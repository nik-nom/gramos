/** Pure shared URL/DNS rules: no database credentials or external requests. */
export const PUBLIC_ROUTES = new Set([
  '/', '/about', '/about/officials','/about/employees','/about/committees',
  '/about/infrastructure','/about/responsibilities','/services','/projects',
  '/schemes','/notices','/news','/gallery','/contact'
]);
export function normalizeHostname(input) {
  if(typeof input!=='string'||input.length>260||/[\s/@\\?#]/.test(input))return '';
  let name=input.trim().toLowerCase().replace(/\.$/,'');
  if(name==='localhost'||name==='127.0.0.1')return name;
  if(/^localhost:\d{1,5}$/.test(name))return 'localhost';
  if(/^127\.0\.0\.1:\d{1,5}$/.test(name))return '127.0.0.1';
  if(name.includes(':')||name.length>253||!name.includes('.'))return '';
  const labels=name.split('.');
  if(labels.some(x=>x.length<1||x.length>63||!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x)))return '';
  if(labels.at(-1).length<2||/^\d+$/.test(labels.at(-1)))return '';
  return name;
}
export function isSharedHostname(host, env={}) {
  const name=normalizeHostname(host);if(!name)return false;
  const configured=[env.GRAMOS_SHARED_HOSTNAMES,env.VERCEL_URL,env.VERCEL_BRANCH_URL,
    env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/^https?:\/\//,'').split('/')[0]]
    .filter(Boolean).flatMap(x=>String(x).split(',')).map(normalizeHostname);
  return ['localhost','127.0.0.1',...configured].includes(name);
}
export function validPublicPath(path) {
  return typeof path==='string'&&PUBLIC_ROUTES.has(path.replace(/\/$/,'')||'/');
}
export function cleanPublicPath(path) {
  if(typeof path!=='string'||path.includes('%')||path.includes('\\')||path.includes('//')||path.includes('?'))return null;
  const clean=path.replace(/\/$/,'')||'/';
  return validPublicPath(clean)?clean:null;
}
export function previewToClean(path,slug){
  const prefix=`/v/${slug}`;
  if(path!==prefix&&!path.startsWith(prefix+'/'))return null;
  return cleanPublicPath(path.slice(prefix.length)||'/');
}
export function routeOnCustomHost(path,slug) {
  if(path==='/robots.txt'||path==='/sitemap.xml')return {kind:'pass'};
  if(path.startsWith('/admin')||path.startsWith('/api')||path.startsWith('/_next'))return {kind:'reject'};
  if(path==='/v'||path.startsWith('/v/')) {
    const target=previewToClean(path,slug);
    return target ? {kind:'redirect',target} : {kind:'reject'};
  }
  const clean=cleanPublicPath(path);
  return clean ? {kind:'rewrite',target:`/v/${slug}${clean==='/'?'':clean}`}:{kind:'reject'};
}
export const xmlEscape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export function sitemapXML(host, pages=[]) {
  const domain=normalizeHostname(host);if(!domain)throw new Error('Invalid sitemap hostname');
  const urls=[];const seen=new Set();
  for(const page of pages) {
    if(!page||page.is_published!==true)continue;
    const path=cleanPublicPath(page.path);if(path===null||seen.has(path))continue;
    seen.add(path);
    const time=page.published_at||page.updated_at;
    let lastmod='';if(time){const date=new Date(time);if(!Number.isNaN(date.getTime()))lastmod=`<lastmod>${date.toISOString()}</lastmod>`;}
    urls.push(`<url><loc>${xmlEscape(`https://${domain}${path}`)}</loc>${lastmod}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
}
export function robotsTXT(host,active) {
  const domain=normalizeHostname(host);
  return active&&domain
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /v/\nSitemap: https://${domain}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
}
export function pageSEO({site,page,pageKey,domain,shared=false}) {
  const titleMr=(site?.content?.general?.name?.mr||site?.content?.general?.name||site?.slug||'ग्रामपंचायत').toString();
  const pageTitle=page?.title_mr|| (pageKey==='home'?'मुखपृष्ठ':pageKey.split('/').at(-1));
  const rawTitle=page?.published_content?.seo_title_mr||page?.published_content?.seo_title||`${pageTitle} | ${titleMr}`;
  const rawDesc=page?.published_content?.seo_description_mr||page?.published_content?.seo_description||site?.content?.general?.description?.mr||site?.content?.general?.description||`${titleMr} ग्रामपंचायत अधिकृत माहिती संकेतस्थळ`;
  const safe=s=>typeof s==='string'?s.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim():'';
  const path=pageKey==='home'?'/':`/${pageKey}`;
  return {title:safe(rawTitle).slice(0,90),description:safe(rawDesc).slice(0,180),
    robots:{index:!shared,follow:!shared},
    ...(domain?{alternates:{canonical:`https://${domain}${path}`}}:{})};
}
export function vercelStatus(project,config) {
  const ownershipVerified=project?.verified===true;
  const dnsConfigured=config?.misconfigured===false;
  return {ownershipVerified,dnsConfigured,state:!ownershipVerified?'ownership_pending':!dnsConfigured?'dns_pending':'ready'};
}
export function dnsInstructions(project,config) {
  const verification=Array.isArray(project?.verification)?project.verification
   .filter(x=>x&&['TXT','CNAME'].includes(x.type)&&typeof x.domain==='string'&&typeof x.value==='string')
   .map(x=>({type:x.type,name:x.domain,value:x.value})):[];
  const recommendedCNAME=config?.recommendedCNAME||[];
  const recommendedIPv4=config?.recommendedIPv4||[];
  return {verification, recommendedCNAME, recommendedIPv4,
    message:'Use the exact A/CNAME values returned by Vercel for this project. Make changes at the domain owner’s DNS provider; a Vercel API call cannot change a third-party DNS zone.'};
}
export const validSiteId=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);

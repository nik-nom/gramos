/** Shared pure SEO helpers for Vercel and the local Node server. */
import {SEO_PAGES,resolveSEO} from './seo.js?v=6.9.1';

export const escapeText=(x)=>String(x??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validSlug=(x)=>typeof x==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x)&&x.length<=90;
export const shortDate=(value)=>/^\d{4}-\d{2}-\d{2}/.test(String(value||''))?String(value).slice(0,10):'';
export const canonicalOrigin=(req)=>{
  const configured=String(process.env.SITE_URL||'').trim();
  if(/^https:\/\/[a-z0-9][a-z0-9.:-]*(?:\/[\w-]+)?\/?$/i.test(configured))return configured.replace(/\/+$/,'');
  const candidate=String(req?.headers?.host||'localhost:8000').split(',')[0].trim();
  if(!/^[\w.-]+(?::\d{1,5})?$/.test(candidate))return 'http://localhost:8000';
  return `${/^localhost(?::|$)|^127\.0\.0\.1(?::|$)/i.test(candidate)?'http':'https'}://${candidate}`;
};
export function routeFromPath(path){
 const match=String(path||'').split('?')[0].match(/^\/v\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?\/?$/);
 if(!match)return null;
 const [,slug,page='home',article='']=match;
 if(!validSlug(slug)||!SEO_PAGES.includes(page)||article&&(!validSlug(article)||page!=='news'))return null;
 return {slug,page,article};
}
export function xmlSitemap({villages=[],articles=[],origin}){
 const urls=new Map();
 for(const v of villages){
  if(v.status!=='published'||!validSlug(v.slug))continue;
  for(const page of SEO_PAGES){
   const m=resolveSEO(v,page,{origin});
   if(m.robots.startsWith('noindex'))continue;
   urls.set(m.canonical,shortDate(v.updated_at));
  }
  for(const a of articles){
   if(a.village_id!==v.id||a.status!=='published'||!validSlug(a.slug))continue;
   const m=resolveSEO(v,'news',{origin,article:a});
   if(m.robots.startsWith('noindex'))continue;
   urls.set(m.canonical,shortDate(a.updated_at)||shortDate(v.updated_at));
  }
 }
 const entries=[...urls].map(([url,date])=>`  <url><loc>${escapeText(url)}</loc>${date?`<lastmod>${date}</lastmod>`:''}</url>`).join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}${entries?'\n':''}</urlset>\n`;
}
export function htmlWithMetadata(baseHTML,metadata){
 // Never leave an initial noindex/canonical in place that contradicts the page metadata.
 const stripped=baseHTML
  .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,'')
  .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,'')
  .replace(/<title>[^<]*<\/title>/i,'')
  .replace(/<link\s+rel="canonical"[^>]*>/i,'')
  .replace(/<link\s+rel="icon"[^>]*>/i,'');
 const m=metadata;
 const heads=[`<link rel="icon" href="${escapeText(m.icon||'/assets/gp-mark.svg')}">`,`<title>${escapeText(m.title)}</title>`,`<meta name="description" content="${escapeText(m.description)}">`,`<meta name="keywords" content="${escapeText(m.keywords||'')}">`,`<meta name="robots" content="${escapeText(m.robots)}">`,
 `<link rel="canonical" href="${escapeText(m.canonical)}">`,
 `<meta property="og:type" content="${escapeText(m.isArticle?'article':'website')}">`,`<meta property="og:title" content="${escapeText(m.title)}">`,
 `<meta property="og:description" content="${escapeText(m.description)}">`,`<meta property="og:url" content="${escapeText(m.canonical)}">`,
 `<meta name="twitter:card" content="${m.image?'summary_large_image':'summary'}">`,`<meta name="twitter:title" content="${escapeText(m.title)}">`,`<meta name="twitter:description" content="${escapeText(m.description)}">`];
 if(m.image){heads.push(`<meta property="og:image" content="${escapeText(m.image)}">`,`<meta name="twitter:image" content="${escapeText(m.image)}">`);}
 return stripped.replace('</head>',`  <!-- GramOS: database-driven page metadata for search crawlers -->\n  ${heads.join('\n  ')}\n</head>`);
}

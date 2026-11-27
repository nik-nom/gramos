import {readFile} from 'node:fs/promises';
import {dbRows,publicConfig,publicArticle} from './lib/v694-seo-data.mjs';
import {routeFor,cleanPath,slugOK,PAGES} from '../src/domain-routing-v694.mjs';
import {resolveSEO} from '../src/seo.js';
const htmlPath=new URL('../page-template.html',import.meta.url);
let templatePromise;
const getTemplate=()=>templatePromise||(templatePromise=readFile(htmlPath,'utf8').catch(e=>{templatePromise=null;throw e;}));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function finish(res,code,body,type='text/html; charset=utf-8'){
 res.statusCode=code;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');if(code!==200)res.setHeader('X-Robots-Tag','noindex,nofollow');return res.end(body);
}
function hostOf(req){const h=String(req.headers?.host||'').toLowerCase();return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(h)&&!h.includes('..')&&h.length<=253?h:'';}
// A Vercel production URL can be a village's own active domain, not a shared host.
const defaultSharedHost='gramos-public.vercel.app';
function shared(h){return [defaultSharedHost,process.env.PUBLIC_SHARED_HOST,process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL].filter(Boolean).map(x=>x.trim().toLowerCase()).includes(h);}
function pageError(res,code){return finish(res,code,`<!doctype html><html lang="mr"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>${code}</title><main style="font:18px system-ui;max-width:700px;margin:12vh auto;padding:24px"><h1>${code===404?'ग्रामपंचायत संकेतस्थळ उपलब्ध नाही':'संकेतस्थळ तात्पुरते उपलब्ध नाही'}</h1><p>${code===404?'योग्य गावाचा प्रकाशित पत्ता वापरा.':'कृपया पुन्हा प्रयत्न करा.'}</p></main></html>`);}
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method))return finish(res,405,'Method not allowed','text/plain');
 const h=hostOf(req);if(!h)return pageError(res,404);
 const u=new URL(req.url||'/',`https://${h}`);
 // Rewrites pass a path param, not a tenant identifier; host binding is always read from the database.
 const raw=req.query?.gramosPath??u.searchParams.get('gramosPath');
 const path=typeof raw==='string'?'/'+raw.replace(/^\/+|\/+$/g,''):u.pathname;
 if(!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+){0,3}|robots\.txt|sitemap\.xml)?\/?$/.test(path))return pageError(res,404);
 try{
  const config=await publicConfig(),opts={config};
  // Only the public anon/publishable key goes to the browser. The service role is never read.
  if(!/^(sb_publishable_[\w-]+|eyJ[\w.-]+)$/.test(config.key))throw Error('Invalid public key');
  if(config.key.startsWith('eyJ')){const payload=JSON.parse(Buffer.from(config.key.split('.')[1],'base64url').toString());if(payload.role!=='anon')throw Error('Expected anon key');}
  let bound=null, village=null;
  // Except for the permanently reserved default host, consult the verified DB binding first.
  if(h!==defaultSharedHost){
   const domains=await dbRows('village_domains','hostname,village_id,status,verified_at',{hostname:'eq.'+h,status:'eq.active'},opts);
   const d=domains.find(x=>x.hostname===h&&x.status==='active'&&x.verified_at);
   if(d){
    village=(await dbRows('villages','*',{id:'eq.'+d.village_id,status:'eq.published'},opts))[0];
    if(!village||village.id!==d.village_id||village.status!=='published'||!slugOK(village.slug))return pageError(res,404);bound=village.slug;
   }else if(!shared(h))return pageError(res,404);
  }
  if(path==='/robots.txt')return finish(res,200,`User-agent: *\n${bound?'Allow: /\nDisallow: /api/\nSitemap: https://'+h+'/sitemap.xml':'Disallow: /\nAllow: /v/'}\n`,'text/plain; charset=utf-8');
  if(path==='/sitemap.xml'){
   if(!bound)return pageError(res,404);
   const articles=await dbRows('content_items','slug,status,title_mr,title_en,body_mr,body_en,image_url',{village_id:'eq.'+village.id,kind:'eq.news',status:'eq.published'},opts);
   const urls=PAGES.map(p=>resolveSEO(village,p,{origin:'https://'+h,domainRoot:true})).concat(articles.filter(a=>slugOK(a.slug)).map(a=>resolveSEO(village,'news',{origin:'https://'+h,domainRoot:true,article:a}))).filter(m=>!m.robots.startsWith('noindex')).map(m=>`<url><loc>${esc(m.canonical)}</loc></url>`).join('');
   return finish(res,200,req.method==='HEAD'?'':`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,'application/xml; charset=utf-8');
  }
  const r=routeFor(path,bound);if(!r)return pageError(res,404);
  if(!village)village=(await dbRows('villages','*',{slug:'eq.'+r.slug,status:'eq.published'},opts))[0];
  if(!village||village.slug!==r.slug||village.status!=='published')return pageError(res,404);
  let article=null;
  if(r.page==='news'&&r.article){article=await publicArticle(village.id,r.article,opts);if(!article)return pageError(res,404);}
  // Legacy tenant paths on a bound domain are redirected to the clean path only.
  if(bound&&path.startsWith('/v/')){const q=new URLSearchParams(u.search);q.delete('gramosPath');q.delete('preview');res.setHeader('Location',cleanPath(path,bound)+(q.size?'?'+q:''));return finish(res,302,'');}
  if(!bound){
   const domains=await dbRows('village_domains','hostname,village_id,status,verified_at',{village_id:'eq.'+village.id,status:'eq.active'},opts).catch(()=>[]);
   const d=domains.find(x=>x.village_id===village.id&&x.status==='active'&&x.verified_at&&typeof x.hostname==='string'&&/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(x.hostname)&&x.hostname.includes('.')&&!x.hostname.includes('..')&&x.hostname!==defaultSharedHost&&x.hostname!==h);
   if(d){const q=new URLSearchParams(u.search);q.delete('gramosPath');q.delete('preview');res.setHeader('Location','https://'+d.hostname+cleanPath(path,r.slug)+(q.size?'?'+q:''));return finish(res,302,'');}
  }
  const m=resolveSEO(village,r.page,{origin:'https://'+h,domainRoot:!!bound,article});
  let html=await getTemplate();
  const verification=village.site_settings?.google_verification;
  const googleTag=bound&&r.page==='home'&&verification?.hostname===h&&typeof verification.token==='string'&&/^[A-Za-z0-9_-]{1,256}$/.test(verification.token)?`<meta name="google-site-verification" content="${esc(verification.token)}">`:'';
  const browser=JSON.stringify({supabaseUrl:config.url,supabaseAnonKey:config.key}).replace(/</g,'\\u003c');
  const seed=JSON.stringify(village).replace(/</g,'\\u003c');
  html=html.replace(/<title>[^<]*<\/title>/i,()=>`<title>${esc(m.title)}</title>`).replace(/<meta name="robots" content="[^"]*"\s*\/?\s*>/i,()=>`<meta name="robots" content="${esc(m.robots)}">`).replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i,()=>`<meta name="description" content="${esc(m.description)}">`).replace('</head>',()=>`<link rel="canonical" href="${esc(m.canonical)}">${googleTag}${bound?`<meta name="gramos-domain-village" content="${esc(bound)}">`:''}<script>window.GRAMOS_CONFIG=Object.assign({},window.GRAMOS_CONFIG||{},${browser});window.GRAMOS_INITIAL_PAGE=${JSON.stringify(r.page)};window.GRAMOS_INITIAL_VILLAGE=${seed};</script></head>`);
  return finish(res,200,req.method==='HEAD'?'':html);
 }catch(error){console.error('Village route unavailable:',error.message);return pageError(res,503);}
}

/** Server-provided SEO HTML. The existing client application still renders the page. */
import {readFile} from 'node:fs/promises';
import {publicVillage,publicArticle} from './lib/seo-data.mjs';
import {resolveSEO} from '../src/seo.js';
import {activeDomainForHost,activeDomainForVillage} from '../src/domain-data.mjs';
import {normalizedHost,isSharedPublicHost,domainDestination} from '../src/domain-routes.mjs';
import {routeFromPath,canonicalOrigin,htmlWithMetadata,validSlug} from '../src/seo-server.mjs';
const htmlLocation=new URL('../page-template.html',import.meta.url);
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 const requestHost=normalizedHost(String(req.headers?.host||''));
 if(!requestHost){res.statusCode=404;return res.end('Unknown host');}
 const raw=new URL(req.url||'/',`https://${requestHost}`);
 // Vercel rewrites fill req.query; the local Node server uses the original path.
 const q=req.query||{};
 const route=q.slug?{slug:q.slug,page:q.page||'home',article:q.article||''}:routeFromPath(raw.pathname);
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');
 if(!route||!validSlug(route.slug)||!['home','about','services','projects','schemes','beneficiaries','notices','news','gallery','contact','staff','leaders','facilities','pages'].includes(route.page)||route.article&&(route.page!=='news'||!validSlug(route.article))){
  res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('Not found');
 }
 try{
  const village=await publicVillage(route.slug);
  if(!village){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('Village not published');}
  const shared=isSharedPublicHost(requestHost);
  const binding=shared?null:await activeDomainForHost(requestHost);
  if(!shared&&(!binding||binding.village_id!==village.id)){
   res.statusCode=404;res.setHeader('X-Robots-Tag','noindex,nofollow');return res.end('Domain not activated for this village');
  }
  const baseHTML=await readFile(htmlLocation,'utf8');
  const origin=shared?canonicalOrigin(req):`https://${requestHost}`;
  const preview=raw.searchParams.get('preview')==='1'||q.preview==='1';
  // Public preview is always noindex and never creates a redirect.
  if(preview){res.setHeader('X-Robots-Tag','noindex,nofollow');return res.end(req.method==='HEAD'?'':baseHTML);}
  const article=route.article?await publicArticle(village.id,route.article):null;
  if(route.article&&!article){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('Article not published');}
  if(shared){
    const custom=await activeDomainForVillage(village.id);
    if(custom){
      const suffix=route.article?`/news/${route.article}`:route.page==='home'?'':`/${route.page}`;
      const requestedPath=raw.pathname.startsWith('/v/')?raw.pathname:`/v/${route.slug}${suffix}`;
      const target=domainDestination(custom.hostname,requestedPath,raw.search);
      if(!target){res.statusCode=404;return res.end('Invalid village URL');}
      res.statusCode=307;res.setHeader('Location',target);res.setHeader('Cache-Control','no-store');return res.end();
    }
  }
  const boundedHTML=shared?baseHTML:baseHTML.replace('</head>',`<meta name="gramos-domain-village" content="${route.slug}"></head>`);
  const metadata=resolveSEO(village,route.page,{origin,article});metadata.isArticle=Boolean(article);
  if(metadata.robots.startsWith('noindex'))res.setHeader('X-Robots-Tag','noindex,nofollow');
  res.statusCode=200;return res.end(req.method==='HEAD'?'':htmlWithMetadata(boundedHTML,metadata));
 }catch(error){console.error('GramOS SEO route error',error.message);res.statusCode=503;res.setHeader('Cache-Control','no-store');return res.end('Temporarily unavailable');}
}

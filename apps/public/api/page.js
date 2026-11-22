/** Server-provided SEO HTML. The existing client application still renders the page. */
import {readFile} from 'node:fs/promises';
import {publicVillage,publicArticle} from './lib/seo-data.mjs';
import {resolveSEO} from '../src/seo.js';
import {routeFromPath,canonicalOrigin,htmlWithMetadata,validSlug} from '../src/seo-server.mjs';
const htmlLocation=new URL('../page-template.html',import.meta.url);
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 const raw=new URL(req.url||'/',`https://${req.headers?.host||'localhost'}`);
 // Vercel rewrites fill req.query; the local Node server uses the original path.
 const q=req.query||{};
 const route=q.slug?{slug:q.slug,page:q.page||'home',article:q.article||''}:routeFromPath(raw.pathname);
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');
 if(!route||!validSlug(route.slug)||!['home','about','services','projects','schemes','beneficiaries','notices','news','gallery','contact','staff','leaders','facilities','pages'].includes(route.page)||route.article&&(route.page!=='news'||!validSlug(route.article))){
  res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('Not found');
 }
 try{
  const baseHTML=await readFile(htmlLocation,'utf8');
  const origin=canonicalOrigin(req);
  // Authenticated draft previews continue to render in the browser. Never put draft data in HTML.
  const preview=raw.searchParams.get('preview')==='1'||q.preview==='1';
  if(preview){res.setHeader('X-Robots-Tag','noindex,nofollow');return res.end(req.method==='HEAD'?'':baseHTML);}
  const village=await publicVillage(route.slug);
  if(!village){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('Village not published');}
  const article=route.article?await publicArticle(village.id,route.article):null;
  if(route.article&&!article){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('Article not published');}
  const metadata=resolveSEO(village,route.page,{origin,article});metadata.isArticle=Boolean(article);
  if(metadata.robots.startsWith('noindex'))res.setHeader('X-Robots-Tag','noindex,nofollow');
  res.statusCode=200;return res.end(req.method==='HEAD'?'':htmlWithMetadata(baseHTML,metadata));
 }catch(error){console.error('GramOS SEO route error',error.message);res.statusCode=503;res.setHeader('Cache-Control','no-store');return res.end('Temporarily unavailable');}
}

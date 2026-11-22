import {publicVillages,publicNews} from './lib/seo-data.mjs';
import {canonicalOrigin,xmlSitemap} from '../src/seo-server.mjs';
export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 try{
  const [villages,articles]=await Promise.all([publicVillages(),publicNews()]);
  const xml=xmlSitemap({villages,articles,origin:canonicalOrigin(req)});
  res.statusCode=200;res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=30, stale-while-revalidate=60');
  return res.end(req.method==='HEAD'?'':xml);
 }catch(e){console.error('GramOS sitemap generation failed:',e.message);res.statusCode=503;res.setHeader('Cache-Control','no-store');return res.end('Sitemap temporarily unavailable');}
}

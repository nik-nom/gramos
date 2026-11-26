import {publicVillages,publicNews} from './lib/seo-data.mjs';
import {canonicalOrigin,xmlSitemap} from '../src/seo-server.mjs';
import {allActiveDomains,activeDomainForHost} from '../src/domain-data.mjs';
import {normalizedHost,isSharedPublicHost} from '../src/domain-routes.mjs';
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 const host=normalizedHost(String(req.headers?.host||''));
 if(!host){res.statusCode=404;return res.end('Unknown host');}
 try{
  const shared=isSharedPublicHost(host);
  const domain=shared?null:await activeDomainForHost(host);
  if(!shared&&!domain){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');return res.end('No active village');}
  const [allVillages,articles]=await Promise.all([publicVillages(),publicNews()]);
  let villages;
  if(shared){const bound=await allActiveDomains();const ids=new Set(bound.map(x=>x.village_id));villages=allVillages.filter(x=>!ids.has(x.id));}
  else villages=allVillages.filter(x=>x.id===domain.village_id);
  const xml=xmlSitemap({villages,articles,origin:shared?canonicalOrigin(req):`https://${host}`});
  res.statusCode=200;res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  res.end(req.method==='HEAD'?'':xml);
 }catch(error){console.error('GramOS domain sitemap error',error.message);res.statusCode=503;res.end('Sitemap temporarily unavailable');}
}

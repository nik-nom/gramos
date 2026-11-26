import {normalizedHost,isSharedPublicHost} from '../src/domain-routes.mjs';
import {activeDomainForHost} from '../src/domain-data.mjs';
import {canonicalOrigin} from '../src/seo-server.mjs';
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 const host=normalizedHost(String(req.headers?.host||''));
 if(!host){res.statusCode=404;return res.end('Unknown host');}
 try{
  const shared=isSharedPublicHost(host);
  const tenant=shared?null:await activeDomainForHost(host);
  const origin=shared?canonicalOrigin(req):`https://${host}`;
  const lines=!shared&&!tenant?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
  res.statusCode=200;res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');
  res.end(req.method==='HEAD'?'':lines);
 }catch(error){console.error('GramOS robots tenant resolution failed',error.message);res.statusCode=503;res.end('Robots temporarily unavailable');}
}

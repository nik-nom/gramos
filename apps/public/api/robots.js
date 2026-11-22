import {canonicalOrigin} from '../src/seo-server.mjs';
export default function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 res.statusCode=200;res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
 const body=`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${canonicalOrigin(req)}/sitemap.xml\n`;
 return res.end(req.method==='HEAD'?'':body);
}

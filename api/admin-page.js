import {readFile} from 'node:fs/promises';
const template=new URL('../index.html',import.meta.url);
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 try{const html=await readFile(template,'utf8');res.statusCode=200;res.end(req.method==='HEAD'?'':html);}
 catch(error){console.error('GramOS admin HTML unavailable',error);res.statusCode=503;res.end('Admin temporarily unavailable');}
}

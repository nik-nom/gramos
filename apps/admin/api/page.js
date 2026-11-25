import {readFile} from 'node:fs/promises';
const template=new URL('../index.html',import.meta.url);
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 const url=new URL(req.url||'/', 'https://admin.invalid');
 const preview=url.searchParams.get('preview')==='1'||req.query?.preview==='1';
 if(!preview){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex,nofollow');return res.end('Admin preview only');}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('X-Robots-Tag','noindex,nofollow');res.setHeader('Cache-Control','no-store');
 try{const html=await readFile(template,'utf8');res.statusCode=200;res.end(req.method==='HEAD'?'':html);}
 catch(error){console.error('Admin preview unavailable',error.message);res.statusCode=503;res.end('Preview unavailable');}
}

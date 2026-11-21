/** GramOS local Node.js server — no Python, no npm dependencies. */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||8000);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.pdf':'application/pdf'};
const apiDir=path.join(root,'api');
const sendJSON=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
const safeFile=(urlPath)=>{
  const decoded=decodeURIComponent(urlPath);
  if(decoded.includes('\\') || decoded.includes('\0'))return null;
  const p=path.resolve(root,'.'+decoded);
  if(p!==root && !p.startsWith(root+path.sep))return null;
  if(p.split(path.sep).some(name=>name.startsWith('.') || name==='node_modules'|| name==='database'||name==='tests'))return null;
  if(/\.(?:env|sql|md|py)$/.test(p))return null;
  return p;
};
const server=createServer(async(req,res)=>{
 try {
  const u=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  const pathname=u.pathname;
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(pathname==='/api/health')return sendJSON(res,200,{ok:true,name:'GramOS',runtime:'Node.js'});
  // Local parity with Vercel: these endpoints use public Supabase rows.
  if(pathname==='/sitemap.xml'||pathname==='/robots.txt'||/^\/v\/[^/]+(?:\/[^/]+){0,2}\/?$/.test(pathname)){
   const action=pathname==='/sitemap.xml'?'sitemap':pathname==='/robots.txt'?'robots':'page';
   const {default:handler}=await import(`file://${path.join(apiDir,action+'.js')}`);
   req.query=Object.fromEntries(u.searchParams.entries());
   return handler(req,res);
  }
  if(pathname==='/api/submit'||pathname==='/api/attachment'||pathname==='/api/beneficiary-file'){
   const name=pathname.slice('/api/'.length);
   const {default:handler}=await import(`file://${path.join(apiDir,name+'.js')}`);
   let body='';
   if(req.method==='POST'){
    for await (const chunk of req){body+=chunk.toString('utf8');if(body.length>3_300_000)return sendJSON(res,413,{error:'Request too large'});}
    try{req.body=JSON.parse(body||'{}');}catch{return sendJSON(res,400,{error:'Invalid JSON'});}
   }
   res.status=function(code){res.statusCode=code;return res;};
   res.json=function(obj){res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(obj));return res;};
   req.query=Object.fromEntries(u.searchParams);
   return handler(req,res);
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJSON(res,405,{error:'Method not allowed'});
  const urlFile=safeFile(pathname);
  if(!urlFile)return sendJSON(res,403,{error:'Forbidden'});
  let file=urlFile;
  try{if(!(await stat(file)).isFile())file=path.join(root,'index.html');}catch{file=path.join(root,'index.html');}
  const ext=path.extname(file).toLowerCase();
  if(!types[ext])return sendJSON(res,404,{error:'Not found'});
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':'no-cache'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch(e){console.error('Local HTTP error',e);if(!res.headersSent)sendJSON(res,500,{error:'Internal server error'});}
});
server.listen(port,()=>console.log(`GramOS Node.js server: http://localhost:${port}/demo\nAdmin: http://localhost:${port}/admin/login`));

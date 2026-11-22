/**
 * GramOS v4.7 split Vercel projects.
 * Run from repository root: node scripts/sync-vercel-projects.mjs
 * Copies the canonical root code to apps/public and apps/admin.
 * Do not edit copies directly: edit root, run script, commit copies.
 * Never copies .env, SQL, tests or service-role secrets.
 */
import {cp,rm,mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const apps=join(root,'apps');
const securityHeaders=[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'X-Frame-Options',value:'SAMEORIGIN'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'},
  {key:'Cross-Origin-Opener-Policy',value:'same-origin'},
  {key:'X-Permitted-Cross-Domain-Policies',value:'none'},
];
const routesPublic=[
  {source:'/',destination:'/api/not-found'},
  {source:'/index',destination:'/api/not-found'},
  {source:'/index.html',destination:'/api/not-found'},
  {source:'/admin',destination:'/api/not-found'},
  {source:'/admin/:path*',destination:'/api/not-found'},
  {source:'/robots.txt',destination:'/api/robots'},
  {source:'/sitemap.xml',destination:'/api/sitemap'},
  {source:'/v/:slug/news/:article',destination:'/api/page?slug=:slug&page=news&article=:article'},
  {source:'/v/:slug/:page',destination:'/api/page?slug=:slug&page=:page'},
  {source:'/v/:slug',destination:'/api/page?slug=:slug'},
  {source:'/demo',destination:'/api/not-found'},
  {source:'/demo/:path*',destination:'/api/not-found'},
];
const routesAdmin=[
  {source:'/robots.txt',destination:'/api/admin-robots'},
  {source:'/sitemap.xml',destination:'/api/not-found'},
  {source:'/admin',destination:'/api/admin-page'},
  {source:'/admin/:path*',destination:'/api/admin-page'},
  {source:'/v/:slug/news/:article',destination:'/api/page?slug=:slug&page=news&article=:article'},
  {source:'/v/:slug/:page',destination:'/api/page?slug=:slug&page=:page'},
  {source:'/v/:slug',destination:'/api/page?slug=:slug'},
  {source:'/v/:path*',destination:'/api/not-found'},
  {source:'/demo',destination:'/index.html'},
];
const noFound=`export default function handler(req,res){
 res.statusCode=404;res.setHeader('X-Robots-Tag','noindex,nofollow');res.setHeader('Cache-Control','no-store');res.end('Not found');
}
`;
// A dedicated function avoids relying on an SPA filesystem fallback for /admin/login.
const adminPage=`import {readFile} from 'node:fs/promises';
const template=new URL('../index.html',import.meta.url);
export default async function handler(req,res){
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;return res.end('Method not allowed');}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 try{const html=await readFile(template,'utf8');res.statusCode=200;res.end(req.method==='HEAD'?'':html);}
 catch(error){console.error('GramOS admin HTML unavailable',error);res.statusCode=503;res.end('Admin temporarily unavailable');}
}
`;
// Admin preview URLs are isolated from public hostname routing and never indexed.
const adminPreview=`import {readFile} from 'node:fs/promises';
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
`;
const adminRobots=`export default function handler(req,res){
 res.statusCode=200;res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end('User-agent: *\\nDisallow: /\\n');
}
`;

for(const target of ['public','admin']){
 const app=join(apps,target);
 await rm(app,{recursive:true,force:true});await mkdir(app,{recursive:true});
 for(const item of ['index.html','config.js','styles.css','src','assets'])
  await cp(join(root,item),join(app,item),{recursive:true});
 await mkdir(join(app,'api'),{recursive:true});
 for(const file of ['page.js','lib'])await cp(join(root,'api',file),join(app,'api',file),{recursive:true});
 if(target==='public'){
  // Keep the HTML template for SEO but remove index.html from the public
  // filesystem: Vercel gives static files precedence over rewrites.
  await rename(join(app,'index.html'),join(app,'page-template.html'));
  let page=await readFile(join(app,'api','page.js'),'utf8');
  if(!page.includes("../index.html"))throw new Error('Public page template path changed; update this generator.');
  page=page.replace("../index.html","../page-template.html");
  await writeFile(join(app,'api','page.js'),page);
  // The public site has no administration link: it is on a separate project.
  let homepage=await readFile(join(app,'src','homepage.js'),'utf8');
  const adminLink='<a class="sv-footer-admin" href="/admin/login">'+'${esc(tr(l,\'प्रशासन\',\'Admin\'))}'+'</a>';
  if(!homepage.includes(adminLink))throw new Error('Footer admin link changed; recheck before deploying.');
  homepage=homepage.replace(adminLink,'');
  await writeFile(join(app,'src','homepage.js'),homepage);
  // Legacy generic public header should not point to a blocked /admin path.
  let publicUI=await readFile(join(app,'src','public.js'),'utf8');
  const entry='<a href=\"/admin/login\" class=\"gp-admin-entry\">'+'${T(\'प्रशासन\',\'Admin\',lang)}'+'</a>';
  if(!publicUI.includes(entry))throw new Error('Generic public admin link changed; inspect before release.');
  publicUI=publicUI.replace(entry,'');
  await writeFile(join(app,'src','public.js'),publicUI);
  for(const file of ['submit.js','beneficiary-file.js','robots.js','sitemap.js'])
   await cp(join(root,'api',file),join(app,'api',file));
  // Browser does not load the admin editor on the public host.
  let main=await readFile(join(app,'src','main.js'),'utf8');
  const adminImport="import {renderAdmin,submitAdminForm,adminAction,imageUpload,documentUpload,excelUpload} from './admin.js';";
  if(!main.includes(adminImport))throw new Error('Admin import changed. Recheck project before splitting.');
  main=main.replace(adminImport,`// Public deployment: the administrator bundle is excluded.
const renderAdmin=async()=>'<main><h1>Not found</h1></main>';
const submitAdminForm=async()=>false;
const adminAction=async()=>false;
const imageUpload=async()=>false;
const documentUpload=async()=>false;
const excelUpload=async()=>false;`);
  await writeFile(join(app,'src','main.js'),main);
  await rm(join(app,'src','admin.js'));
  await writeFile(join(app,'api','not-found.js'),noFound);
 }else{
  for(const file of ['domain-admin.js','attachment.js','beneficiary-file.js'])await cp(join(root,'api',file),join(app,'api',file));
  await writeFile(join(app,'api','not-found.js'),noFound);
  await writeFile(join(app,'api','admin-robots.js'),adminRobots);
  await writeFile(join(app,'api','admin-page.js'),adminPage);
  await writeFile(join(app,'api','page.js'),adminPreview);
 }
 const config={
  version:2,cleanUrls:true,trailingSlash:false,
  ...(target==='admin'?{redirects:[{source:'/',destination:'/admin/login',permanent:false}]}:{}),
  rewrites:target==='public'?routesPublic:routesAdmin,
  headers:[{source:'/(.*)',headers:target==='admin'?[...securityHeaders,{key:'X-Robots-Tag',value:'noindex, nofollow'}]:securityHeaders}],
  functions:target==='public'?{'api/page.js':{includeFiles:'page-template.html'}}:{'api/page.js':{includeFiles:'index.html'},'api/admin-page.js':{includeFiles:'index.html'}}
 };
 await writeFile(join(app,'vercel.json'),JSON.stringify(config,null,2)+'\n');
 await writeFile(join(app,'package.json'),JSON.stringify({name:`gramos-${target}`,version:'4.7.2',private:true,type:'module'},null,2)+'\n');
}
console.log('Split generated: apps/public and apps/admin. Commit both folders.');

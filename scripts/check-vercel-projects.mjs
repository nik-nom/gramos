import {readFile,stat} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const pub=await read('apps/public/vercel.json'),adm=await read('apps/admin/vercel.json');
const route=(obj,src)=>obj.rewrites.find(x=>x.source===src);
for(const source of ['/','/index','/index.html','/demo','/demo/:path*','/admin','/admin/:path*'])
 assert.equal(route(pub,source)?.destination,'/api/not-found',`Public blocked route ${source}`);
assert.equal(route(pub,'/v/:slug')?.destination,'/api/page?slug=:slug');
assert.equal(route(pub,'/sitemap.xml')?.destination,'/api/sitemap');
assert.equal(route(adm,'/admin')?.destination,'/api/admin-page');
assert.equal(route(adm,'/admin/:path*')?.destination,'/api/admin-page');
assert.equal(route(adm,'/robots.txt')?.destination,'/api/admin-robots');
assert.equal(route(adm,'/sitemap.xml')?.destination,'/api/not-found');
assert.equal(adm.redirects[0].destination,'/admin/login');
assert(adm.headers.some(x=>x.headers?.some(y=>y.key==='X-Robots-Tag'&&y.value.includes('noindex'))));
assert.equal(pub.functions['api/page.js'].includeFiles,'page-template.html');
assert.equal(adm.functions['api/admin-page.js'].includeFiles,'index.html');
assert(!(await readFile(new URL('apps/public/src/main.js',root),'utf8')).includes("from './admin.js'"));
await assert.rejects(stat(new URL('apps/public/src/admin.js',root)),{code:'ENOENT'});
await assert.rejects(stat(new URL('apps/public/index.html',root)),{code:'ENOENT'});
for(const [app,files] of [
 ['public',['page-template.html','config.js','styles.css','src/main.js','api/page.js','api/not-found.js','api/lib/seo-data.mjs']],
 ['admin',['index.html','config.js','styles.css','src/main.js','src/admin.js','api/admin-page.js','api/page.js','api/attachment.js']]
])for(const file of files)await stat(new URL(`apps/${app}/${file}`,root));
assert((await readFile(new URL('apps/public/api/page.js',root),'utf8')).includes('../page-template.html'));
assert(!(await readFile(new URL('apps/public/src/homepage.js',root),'utf8')).includes('href="/admin/login"'));
assert(!(await readFile(new URL('src/public.js',root),'utf8')).includes('gp-directory-inner'));
console.log('PASS v4.7.1: no public landing page, protected admin login route, two distinct deployments, functional village SEO and previews.');

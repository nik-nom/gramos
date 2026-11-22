import {readFile,stat} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const pub=await read('apps/public/vercel.json'),adm=await read('apps/admin/vercel.json');
const route=(obj,src)=>obj.rewrites.find(x=>x.source===src);
assert.equal(route(pub,'/admin')?.destination,'/api/not-found');
assert.equal(route(pub,'/admin/:path*')?.destination,'/api/not-found');
assert.equal(route(pub,'/sitemap.xml')?.destination,'/api/sitemap');
assert.equal(route(adm,'/sitemap.xml')?.destination,'/api/not-found');
assert.equal(route(adm,'/robots.txt')?.destination,'/api/admin-robots');
assert.equal(adm.redirects[0].destination,'/admin/login');
assert(adm.headers.some(x=>x.headers?.some(y=>y.key==='X-Robots-Tag'&&y.value.includes('noindex'))));
assert(!(await readFile(new URL('apps/public/src/main.js',root),'utf8')).includes("from './admin.js'"));
try{await stat(new URL('apps/public/src/admin.js',root));throw new Error('Public deployment contains admin.js');}catch(e){if(e.code!=='ENOENT')throw e;}
for(const app of ['public','admin'])for(const file of ['index.html','config.js','styles.css','src/main.js','api/page.js','api/lib/seo-data.mjs'])await stat(new URL(`apps/${app}/${file}`,root));
await stat(new URL('apps/admin/src/admin.js',root));
await stat(new URL('apps/admin/api/attachment.js',root));
console.log('PASS: two Vercel project configurations, route separation and required files.');

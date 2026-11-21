import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SEO_PAGES,resolveSEO} from '../src/seo.js';
import {routeFromPath,xmlSitemap,htmlWithMetadata} from '../src/seo-server.mjs';
import pageHandler from '../api/page.js';
import sitemapHandler from '../api/sitemap.js';
import robotsHandler from '../api/robots.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const a={id:'11111111-1111-1111-1111-111111111111',slug:'shirpur',name_mr:'शिरपूर',status:'published',site_settings:{services_page_title_mr:'उपलब्ध लोकसेवा',seo:{services:{description:'प्रकाशित लोकसेवा'},projects:{noindex:true},home:{title:'ग्रामपंचायत शिरपूर - अधिकृत संकेतस्थळ'}}},updated_at:'2026-11-21T10:00:00Z'};
const b={id:'22222222-2222-2222-2222-222222222222',slug:'namuna',name_mr:'नमुना',status:'draft',site_settings:{},updated_at:'2026-11-21T10:00:00Z'};
const c={...b,id:'33333333-3333-3333-3333-333333333333',slug:'third',name_mr:'तिसरे गाव',status:'published',site_settings:{}};
const article={id:'a',village_id:a.id,slug:'water-project',title_mr:'पाणी प्रकल्प माहिती',body_mr:'गावातील नवीन पाणीपुरवठा प्रकल्पाविषयी तपशील.',image_url:'https://images.example/1.webp',status:'published',updated_at:'2026-11-21T13:00:00Z'};
const unpublished={...article,slug:'secret-story',status:'draft'};
const origin='https://gramos.example.in';
const xml=xmlSitemap({villages:[a,b,c],articles:[article,unpublished],origin});
assert.ok(xml.startsWith('<?xml version="1.0"'));
assert.match(xml,/https:\/\/gramos\.example\.in\/v\/shirpur\/services/);
assert.match(xml,/https:\/\/gramos\.example\.in\/v\/third\/about/);
assert.doesNotMatch(xml,/\/v\/namuna/);
assert.doesNotMatch(xml,/\/v\/shirpur\/projects</);
assert.doesNotMatch(xml,/secret-story/);
assert.match(xml,/\/v\/shirpur\/news\/water-project/);
assert.equal((xml.match(/<url>/g)||[]).length,SEO_PAGES.length*2-1+1);
assert.ok(xml.includes('<lastmod>2026-11-21</lastmod>'));
assert.deepEqual(routeFromPath('/v/shirpur/news/water-project'),{slug:'shirpur',page:'news',article:'water-project'});
assert.equal(routeFromPath('/v/shirpur/news/../../admin'),null);
assert.equal(routeFromPath('/v/shirpur/unknown'),null);
assert.equal(resolveSEO(a,'services').title,'उपलब्ध लोकसेवा | ग्रामपंचायत शिरपूर');
assert.equal(resolveSEO(a,'news',{article}).title,'पाणी प्रकल्प माहिती | ग्रामपंचायत शिरपूर');
assert.match(resolveSEO(a,'news',{article}).description,/गावातील नवीन/);
const safeHTML=htmlWithMetadata(read('../index.html'),{...resolveSEO(a,'news',{article,origin}),isArticle:true});
assert.match(safeHTML,/<title>पाणी प्रकल्प माहिती \| ग्रामपंचायत शिरपूर<\/title>/);
assert.match(safeHTML,/og:type" content="article"/);
assert.match(safeHTML,/name="robots" content="index,follow"/);
assert.equal((safeHTML.match(/name="robots"/g)||[]).length,1);
assert.equal((safeHTML.match(/name="description"/g)||[]).length,1);
assert.ok(!safeHTML.includes('name="robots" content="noindex,nofollow"'));
assert.match(htmlWithMetadata(read('../index.html'),{...resolveSEO({...a,name_mr:'<script>alert(1)</script>'},'home',{origin}),isArticle:false}),/&lt;script&gt;/);
// Test the real Vercel function handlers with an isolated mock for their public Supabase fetches.
const originalFetch=globalThis.fetch;
const originalURL=process.env.SUPABASE_URL;
const originalKey=process.env.SUPABASE_PUBLISHABLE_KEY;
const originalSiteURL=process.env.SITE_URL;
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';
process.env.SITE_URL=origin;
let counts={};
globalThis.fetch=async input=>{
 const u=new URL(input);const table=u.pathname.split('/').pop();counts[table]=(counts[table]||0)+1;
 if(table==='villages'){
  const slug=u.searchParams.get('slug')?.replace(/^eq\./,'');return {ok:true,json:async()=>slug?[a,c].filter(v=>v.slug===slug):[a,c]};
 }
 if(table==='content_items'){
  const slug=u.searchParams.get('slug')?.replace(/^eq\./,'');return {ok:true,json:async()=>slug?[article].filter(x=>x.slug===slug):[article]};
 }
 throw Error('unexpected request');
};
function res(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(body=''){this.body=String(body);return this;}};}
try{
 let r=res();await sitemapHandler({method:'GET',headers:{host:'not-canonical.example'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/v\/shirpur\/news\/water-project/);
 assert.match(r.headers['content-type'],/application\/xml/);
 r=res();await pageHandler({method:'GET',url:'/v/shirpur/services',query:{slug:'shirpur',page:'services'},headers:{host:'localhost:8000'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/<title>उपलब्ध लोकसेवा \| ग्रामपंचायत शिरपूर<\/title>/);
 assert.match(r.body,/https:\/\/gramos.example.in\/v\/shirpur\/services/);
 r=res();await pageHandler({method:'GET',url:'/v/shirpur/news/water-project',query:{slug:'shirpur',page:'news',article:'water-project'},headers:{host:'localhost'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/पाणी प्रकल्प माहिती \| ग्रामपंचायत शिरपूर/);
 r=res();await pageHandler({method:'GET',url:'/v/shirpur/news/missing',query:{slug:'shirpur',page:'news',article:'missing'},headers:{host:'localhost'}},r);
 assert.equal(r.statusCode,404);
 r=res();await pageHandler({method:'GET',url:'/v/secret/home',query:{slug:'secret',page:'home'},headers:{host:'localhost'}},r);
 assert.equal(r.statusCode,404);
 r=res();await pageHandler({method:'GET',url:'/v/secret?preview=1',query:{slug:'secret',page:'home'},headers:{host:'localhost'}},r);
 assert.equal(r.statusCode,200);assert.match(r.headers['x-robots-tag'],/noindex/);
 r=res();robotsHandler({method:'GET',headers:{host:'localhost'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/Sitemap: https:\/\/gramos.example.in\/sitemap.xml/);
 assert.ok(counts.villages>1);
}finally{
 globalThis.fetch=originalFetch;
 for(const [key,val] of [['SUPABASE_URL',originalURL],['SUPABASE_PUBLISHABLE_KEY',originalKey],['SITE_URL',originalSiteURL]]){if(val===undefined)delete process.env[key];else process.env[key]=val;}
}
const server=read('../server.mjs'),vercel=JSON.parse(read('../vercel.json')),admin=read('../src/admin.js'),main=read('../src/main.js'),css=read('../styles.css');
assert.match(server,/pathname==='\/sitemap.xml'/);assert.match(server,/pathname==='\/robots.txt'/);
assert.ok(vercel.rewrites.some(x=>x.source==='/sitemap.xml'));
assert.ok(vercel.rewrites.some(x=>x.source==='/v/:slug/news/:article'));
assert.ok(vercel.rewrites.some(x=>x.source==='/v/:slug/:page'));
assert.match(admin,/function seoEditor/);assert.match(admin,/site_settings=\{\.\.\.current,seo:/);
assert.match(admin,/id="createVillageForm"/);assert.match(admin,/id="seoSettingsForm"/);
assert.match(main,/function startCarousels/);assert.match(main,/function startReveals/);
assert.match(css,/prefers-reduced-motion:reduce/);
console.log('PASS v3.3: dynamic village+article sitemap, noindex exclusion, canonical Marathi SSR titles, published-only DB reads, local/Vercel parity, admin and animation contracts');

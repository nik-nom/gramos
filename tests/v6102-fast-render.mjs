import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../apps/public/api/village-site.js';
const id='11111111-1111-4111-8111-111111111111';
const v={id,slug:'ramngra',status:'published',name_mr:'रामनगर',name_en:'Ramnagar',site_settings:{}};
process.env.SUPABASE_URL='https://mock.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_mock';
globalThis.location={origin:'https://ramnagar-gp.vercel.app',pathname:'/',search:''};
globalThis.document={querySelector:()=>null};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:process.env.SUPABASE_URL,supabaseAnonKey:process.env.SUPABASE_PUBLISHABLE_KEY}};
const calls=[];
globalThis.fetch=async input=>{const u=new URL(input);calls.push(u);return new Response(JSON.stringify(u.pathname.endsWith('/villages')?[v]:[]));};
const {renderPublic,loadPageRenderer}=await import('../apps/public/src/public.js');
assert.deepEqual(await loadPageRenderer('home'),{});
assert.deepEqual(await loadPageRenderer('constructor'),{});
assert.equal(typeof (await loadPageRenderer('beneficiaries')).renderYojanaBeneficiariesPage,'function');
for(const page of ['home','about','services','projects','schemes','beneficiaries','notices','news','gallery','contact','staff','leaders','facilities','pages']){
 const html=await renderPublic(['v',v.slug,page],'mr',{});assert.match(html,/sv-site/,page);assert.match(html,/रामनगर/,page);assert(!html.includes('404 — Not found'),page);
}
const serverRequest=async page=>{const res={headers:{},setHeader(k,x){this.headers[k]=x},end(body){this.body=body}};await handler({method:'GET',headers:{host:'gramos-public.vercel.app'},url:'/v/ramngra/'+page,query:{gramosPath:'v/ramngra/'+page}},res);return res;};
let res=await serverRequest('about');assert.equal(res.statusCode,200);assert.match(res.body,/rel="preconnect" href="https:\/\/mock\.supabase\.co"/);assert.match(res.body,/modulepreload" href="\/src\/about\.js/);assert(!res.body.includes('modulepreload" href="/src/gallery.js'));assert.equal(res.headers['Cache-Control'],'no-store');
res=await serverRequest('home');assert(!res.body.includes('modulepreload" href="/src/about.js'));
// Exercise the actual admin count function against a mocked Supabase client.
const steps=[];let count=1501,error=null;
const builder={select(...a){steps.push(['select',...a]);return this},eq(...a){steps.push(['eq',...a]);return this},is(...a){steps.push(['is',...a]);return this},then(resolve){return Promise.resolve({count,error}).then(resolve)}};
window.supabase={createClient:()=>({from(table){steps.push(['from',table]);return builder}})};
const {countContentDrafts}=await import('../apps/admin/src/admin.js');
assert.equal(await countContentDrafts(id),1501);assert.deepEqual(steps,[['from','content_items'],['select','id',{count:'exact',head:true}],['eq','village_id',id],['eq','status','draft'],['is','deleted_at',null]]);error={message:'denied'};await assert.rejects(countContentDrafts(id),/denied/);error=null;count=null;await assert.rejects(countContentDrafts(id),/unavailable/);
for(const file of ['index.html','admin-shell.html']){const html=await readFile(new URL('../apps/admin/'+file,import.meta.url),'utf8');assert(!html.includes('modulepreload" href="/src/public.js'));assert(html.includes('/src/main.js?v=6.10.2'));}
console.log('PASS: 14 public routes rendered with mock data, selected renderer preload, early DB connection, no cached HTML, exact scoped admin count and error paths.');

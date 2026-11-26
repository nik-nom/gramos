import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../apps/public/api/village-site.js';
const id='11111111-1111-4111-8111-111111111111';
const v={id,slug:'ramngra',status:'published',name_mr:'रामनगर',site_settings:{test:'</script><script>bad()</script> $& $\''},phone:'123'};
process.env.SUPABASE_URL='https://mock.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_mock';
let calls=[];globalThis.fetch=async input=>{const u=new URL(input);calls.push(u);return new Response(JSON.stringify(u.pathname.endsWith('/villages')?[v]:[]));};
const res={headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}};
await handler({method:'GET',headers:{host:'gramos-public.vercel.app'},url:'/v/ramngra',query:{gramosPath:'v/ramngra'}},res);
assert.equal(res.statusCode,200);assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(calls.length,2);assert.equal(calls[0].searchParams.get('select'),'*');assert.equal(calls[0].searchParams.get('status'),'eq.published');
const raw=res.body.match(/window\.GRAMOS_INITIAL_VILLAGE=(.*?);<\/script>/s)[1];assert(!raw.includes('<'));assert.deepEqual(JSON.parse(raw),v);
assert.match(res.body,/modulepreload.*public-read\.js\?v=6\.9\.8/);assert.match(res.body,/import\('\/src\/public-read\.js\?v=6\.9\.8'\)/);
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:process.env.SUPABASE_URL,supabaseAnonKey:process.env.SUPABASE_PUBLISHABLE_KEY},GRAMOS_INITIAL_VILLAGE:v};calls=[];let release;globalThis.fetch=async input=>{const u=new URL(input);calls.push(u);if(u.pathname.endsWith('/content_items'))await new Promise(resolve=>{release=resolve});return new Response(JSON.stringify(u.pathname.endsWith('/villages')?[v]:[{village_id:id,status:'published'},{village_id:id,status:'published',deleted_at:'2026-01-01'}]));};
const reader=await import('../apps/public/src/public-read.js?performance-test');assert.equal(calls.length,1);assert(calls[0].pathname.endsWith('/content_items'));assert.equal(calls[0].searchParams.get('village_id'),'eq.'+id);assert.equal(calls[0].searchParams.get('status'),'eq.published');assert.equal(window.GRAMOS_INITIAL_VILLAGE,undefined);
assert.deepEqual(await reader.villageBySlug('ramngra'),v);release();assert.equal((await reader.publishedItemsFor(id)).length,1);assert.equal(calls.length,1);await reader.villageBySlug('ramngra');assert.equal(calls.length,2); // no persistent stale village cache
window.GRAMOS_INITIAL_VILLAGE=v;calls=[];const wrong=await import('../apps/public/src/public-read.js?other-route');await wrong.villageBySlug('different-village');assert.equal(calls.length,2);assert(calls[1].pathname.endsWith('/villages'));assert.equal(calls[1].searchParams.get('slug'),'eq.different-village');release();
const admin=await readFile(new URL('../apps/admin/src/admin.js',import.meta.url),'utf8');assert.match(admin,/needItems=!reviewerOnly&&section==='overview'/);assert.match(admin,/needKind=!reviewerOnly&&section==='content'/);assert.match(admin,/\.eq\('kind',kind\)/);assert.match(admin,/!\['submissions','domains','members','content','import'\]\.includes\(section\)/);
for(const a of ['admin','public']){const home=await readFile(new URL(`../apps/${a}/src/homepage.js`,import.meta.url),'utf8');assert.match(home,/width="132" height="170" loading="lazy" decoding="async"/);assert.match(home,/i===0&&id==='svHero'/);}
console.log('PASS: initial village lookup reused, content begins before render, one-shot data, published-only filters, safe HTML seed, scoped admin reads and image hints');

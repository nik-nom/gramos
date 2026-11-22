import assert from 'node:assert/strict';
import page from '../api/page.js';
import sitemap from '../api/sitemap.js';
import robots from '../api/robots.js';
const origFetch=globalThis.fetch;
const prevEnv=Object.fromEntries(['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SITE_URL','VERCEL'].map(k=>[k,process.env[k]]));
const a='11111111-1111-1111-1111-111111111111',b='22222222-2222-2222-2222-222222222222';
const village=[{id:a,slug:'lohegaon',name_mr:'लोहेगाव',status:'published',site_settings:{},updated_at:'2026-11-22'},{id:b,slug:'shirpur',name_mr:'शिरपूर',status:'published',site_settings:{},updated_at:'2026-11-22'},{id:'33333333-3333-3333-3333-333333333333',slug:'drafttown',name_mr:'ड्राफ्ट',status:'draft',site_settings:{}}];
const domains=[{hostname:'lohegaon.in',village_id:a,status:'active',verified_at:'2026-11-22'},{hostname:'shirpur.in',village_id:b,status:'active',verified_at:'2026-11-22'},{hostname:'pending.in',village_id:b,status:'pending',verified_at:null}];
const res=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(v=''){this.body=String(v);return this;}});
try{
 process.env.SUPABASE_URL='https://mock.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';process.env.SITE_URL='https://gramos-public.vercel.app';delete process.env.VERCEL;
 globalThis.fetch=async input=>{
  const u=new URL(input);const table=u.pathname.split('/').at(-1);
  let rows=table==='villages'?village.filter(v=>v.status==='published'):table==='village_domains'?domains:table==='content_items'?[]:null;
  if(!rows)throw Error('Unexpected table '+table);
  for(const [k,val] of u.searchParams){if(['limit','offset','select'].includes(k)||!val.startsWith('eq.'))continue;rows=rows.filter(x=>String(x[k])===val.slice(3));}
  return {ok:true,json:async()=>rows};
 };
 let r=res();await page({method:'GET',url:'/v/lohegaon',headers:{host:'gramos-public.vercel.app'}},r);
 assert.equal(r.statusCode,307);assert.equal(r.headers.location,'https://lohegaon.in/v/lohegaon');
 r=res();await page({method:'GET',url:'/v/shirpur/about',headers:{host:'gramos-public.vercel.app'}},r);
 assert.equal(r.statusCode,307);assert.equal(r.headers.location,'https://shirpur.in/v/shirpur/about');
 r=res();await page({method:'GET',url:'/v/lohegaon',headers:{host:'lohegaon.in'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/<meta name="gramos-domain-village" content="lohegaon">/);assert.match(r.body,/https:\/\/lohegaon\.in\/v\/lohegaon/);assert.doesNotMatch(r.body,/https:\/\/shirpur\.in\/v\//);
 r=res();await page({method:'GET',url:'/v/shirpur',headers:{host:'lohegaon.in'}},r);assert.equal(r.statusCode,404);
 r=res();await page({method:'GET',url:'/v/shirpur',headers:{host:'pending.in'}},r);assert.equal(r.statusCode,404);
 r=res();await page({method:'GET',url:'/v/shirpur',headers:{host:'unknown.in'}},r);assert.equal(r.statusCode,404);
 r=res();await page({method:'GET',url:'/v/drafttown',headers:{host:'gramos-public.vercel.app'}},r);assert.equal(r.statusCode,404);
 r=res();await sitemap({method:'GET',headers:{host:'lohegaon.in'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/lohegaon\.in\/v\/lohegaon/);assert.doesNotMatch(r.body,/shirpur/);
 r=res();await sitemap({method:'GET',headers:{host:'shirpur.in'}},r);
 assert.equal(r.statusCode,200);assert.match(r.body,/shirpur\.in\/v\/shirpur/);assert.doesNotMatch(r.body,/lohegaon/);
 r=res();await sitemap({method:'GET',headers:{host:'gramos-public.vercel.app'}},r);
 assert.equal(r.statusCode,200);assert.doesNotMatch(r.body,/<url>/);
 r=res();await sitemap({method:'GET',headers:{host:'unknown.in'}},r);assert.equal(r.statusCode,404);
 r=res();await robots({method:'GET',headers:{host:'pending.in'}},r);assert.match(r.body,/Disallow: \/$/m);
 console.log('PASS v4.8.1: live-style redirects, custom-host isolation, two-village sitemap isolation, unpublished exclusion, pending and unknown host rejection.');
}finally{globalThis.fetch=origFetch;for(const [k,v] of Object.entries(prevEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}

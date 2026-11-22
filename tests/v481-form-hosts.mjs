import assert from 'node:assert/strict';
import submit from '../api/submit.js';
const before={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,TURNSTILE_SECRET_KEY:process.env.TURNSTILE_SECRET_KEY,SITE_URL:process.env.SITE_URL,TURNSTILE_ALLOWED_HOSTNAMES:process.env.TURNSTILE_ALLOWED_HOSTNAMES};
const originalFetch=globalThis.fetch;
const v1='11111111-1111-4111-8111-111111111111',v2='22222222-2222-4222-8222-222222222222';
let tokenHost='lohegaon.in';
const r=()=>({headers:{},code:0,body:null,setHeader(k,v){this.headers[k]=v;return this;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
const body=id=>({village_id:id,turnstile_token:'token',sender_name:'Test Name',sender_email:'test@example.org',subject:'general',message:'This is a realistic message submitted by a resident.',website:''});
try{
 Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service-role',TURNSTILE_SECRET_KEY:'test-secret',SITE_URL:'https://gramos-public.vercel.app',TURNSTILE_ALLOWED_HOSTNAMES:''});
 globalThis.fetch=async (input,opts={})=>{
  const url=String(input);
  if(url.includes('/siteverify'))return {ok:true,json:async()=>({success:true,hostname:tokenHost})};
  if(url.includes('/rest/v1/village_domains'))return {ok:true,json:async()=>url.includes(v1)?[{hostname:'lohegaon.in'}]:[{hostname:'shirpur.in'}]};
  if(url.includes('/rest/v1/villages'))return {ok:true,json:async()=>[{id:v1}]};
  if(url.includes('/rest/v1/submissions')&&opts.method==='POST')return {ok:true,json:async()=>[]};
  if(url.includes('/rest/v1/submissions'))return {ok:true,json:async()=>[]};
  throw Error('Unexpected request '+url);
 };
 let response=r();await submit({method:'POST',headers:{},body:body(v1)},response);assert.equal(response.code,201);
 tokenHost='shirpur.in';response=r();await submit({method:'POST',headers:{},body:body(v1)},response);assert.equal(response.code,403);
 response=r();await submit({method:'POST',headers:{},body:body(v2)},response);assert.equal(response.code,201);
 console.log('PASS v4.8.1: Cloudflare Turnstile village-domain allowlist accepts correct village only and rejects another village.');
}finally{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}

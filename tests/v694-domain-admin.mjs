import assert from 'node:assert/strict';
import handler from '../apps/admin/api/domain-admin.js';
const village='11111111-1111-4111-8111-111111111111', user='22222222-2222-4222-8222-222222222222', host='ramngra.vercel.app';
Object.assign(process.env,{SUPABASE_URL:'https://mock.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_mock',SUPABASE_SERVICE_ROLE_KEY:'mock-server-secret',VERCEL_API_TOKEN:'mock-vercel-token',VERCEL_PUBLIC_PROJECT_ID:'prj_mock'});
let admin=true,verified=true,branch=null,records=[],calls=[];
globalThis.fetch=async(input,init={})=>{const u=new URL(input),method=init.method||'GET',body=init.body?JSON.parse(init.body):null;calls.push([u.hostname,u.pathname,method]);let result=[];
 if(u.pathname==='/auth/v1/user')result={id:user};
 else if(u.pathname.endsWith('/platform_admins'))result=admin?[{user_id:user}]:[];
 else if(u.pathname.endsWith('/villages'))result=[{id:village,slug:'ramngra',status:'published'}];
 else if(u.pathname.endsWith('/village_domains')){
  if(method==='POST')records.push(body);else if(method==='PATCH')records=records.map(d=>({...d,...body}));else if(method==='DELETE')records=[];
  result=records;
 }else if(u.pathname.endsWith('/gramos_activate_verified_domain')){records=records.map(d=>({...d,status:'active'}));result=true;}
 else if(u.hostname==='api.vercel.com')result=u.pathname==='/v9/projects/prj_mock'?{id:'prj_mock',name:'gramos-public'}:{name:host,verified,gitBranch:branch};
 return new Response(JSON.stringify(result),{status:200});};
async function invoke(action,hostname=host){const res={headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=JSON.parse(v)}};await handler({method:'POST',headers:{authorization:'Bearer mock.jwt'},body:{action,hostname,village_id:village}},res);return res;}
admin=false;let r=await invoke('register');assert.equal(r.statusCode,403);r=await invoke('connection');assert.equal(r.statusCode,403);admin=true;
r=await invoke('connection');assert.equal(r.statusCode,200);assert.match(r.body.message,/gramos-public/);assert.doesNotMatch(JSON.stringify(r.body),/mock-vercel-token/);
const savedToken=process.env.VERCEL_API_TOKEN;delete process.env.VERCEL_API_TOKEN;r=await invoke('connection');assert.equal(r.statusCode,409);process.env.VERCEL_API_TOKEN=savedToken;
r=await invoke('register','gramos-public.vercel.app');assert.equal(r.statusCode,400);
r=await invoke('register');assert.equal(r.statusCode,200);assert.equal(records[0].status,'pending');
branch='preview';r=await invoke('check');assert.equal(r.body.active,false);branch=null;verified=false;r=await invoke('check');assert.equal(r.body.active,false);
verified=true;r=await invoke('check');assert.equal(r.body.active,true);assert.equal(records[0].status,'active');assert.match(r.body.message,/https:\/\/ramngra.vercel.app\//);
assert.equal(calls.some(x=>x[1].includes('/config')),false);
r=await invoke('remove');assert.equal(r.statusCode,200);assert.equal(records.length,0);
console.log('PASS: super-admin gate, reserved hostname rejection, Vercel registration, production verification, activation and removal (mock services).');

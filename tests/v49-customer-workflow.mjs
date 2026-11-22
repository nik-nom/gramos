import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clientsCSV,clientsXLSX,clientTable} from '../src/client-export.mjs';
import staffHandler from '../api/staff-admin.js';
import submitHandler from '../api/submit.js';
const v1='11111111-1111-4111-8111-111111111111';
const v2='22222222-2222-4222-8222-222222222222';
const rows=[
 {village:{id:v1,slug:'lohegaon',status:'published',name_mr:'लोहेगाव'},record:{customer_name:'Demo Client',customer_email:'demo@example.com',payment_received:true}},
 {village:{id:v2,slug:'shirpur',status:'draft',name_mr:'शिरपूर'},record:{customer_name:'=HYPERLINK("http://evil.example")',payment_received:null}},
];
const table=clientTable(rows),csv=clientsCSV(rows),xlsx=clientsXLSX(rows);
assert.equal(table.length,3);
assert.equal(table[1][9],'Live');assert.equal(table[2][9],'Draft');
assert.equal(table[1][10],'Yes');assert.equal(table[2][10],'Not recorded');
assert(csv.includes('"\'=HYPERLINK(""http://evil.example"")"')); // Excel formula injection blocked.
assert(!csv.toLowerCase().includes('password')); // Never a password column.
assert.equal(Buffer.from(xlsx).readUInt32LE(0),0x04034b50); // Valid ZIP/XLSX container.
assert.equal(Buffer.from(xlsx).readUInt32LE(xlsx.length-22),0x06054b50);
assert(Buffer.from(xlsx).includes(Buffer.from('xl/worksheets/sheet1.xml')));

const save={...process.env},oldFetch=globalThis.fetch;
function resp(){return {headers:{},code:0,body:null,setHeader(k,v){this.headers[k]=v;return this;},status(v){this.code=v;return this;},json(v){this.body=v;return this;}}}
try{
 Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service-secret',SITE_URL:'https://gramos-public.vercel.app',GRAMOS_FORM_CAPTCHA_ENABLED:'false'});
 let createdUser=false,assigned=false;const calls=[];
 globalThis.fetch=async (input,opt={})=>{
  const url=String(input);calls.push(url);
  if(url.endsWith('/auth/v1/user'))return {ok:true,json:async()=>({id:v1})};
  if(url.includes('/rest/v1/platform_admins'))return {ok:true,json:async()=>[{user_id:v1}]};
  if(url.includes('/rest/v1/villages'))return {ok:true,json:async()=>[{id:v2}]};
  if(url.endsWith('/auth/v1/admin/users')&&opt.method==='POST'){createdUser=true;assert(!String(input).includes('password'));return {ok:true,json:async()=>({id:v2})};}
  if(url.endsWith('/rest/v1/village_members')&&opt.method==='POST'){assigned=true;assert.equal(JSON.parse(opt.body).role,'reviewer');return {ok:true,json:async()=>({})};}
  throw Error('Unexpected staff URL '+url);
 };
 const staff=resp();await staffHandler({method:'POST',headers:{host:'gramos-admin.vercel.app',origin:'https://gramos-admin.vercel.app',authorization:'Bearer valid.jwt'},body:{name:'Member',email:'member@example.in',village_id:v2,role:'reviewer',confirmed_recipient:'true',password:'at-least-14-characters'}},staff);
 assert.equal(staff.code,201,JSON.stringify(staff.body));assert(createdUser&&assigned);assert(!JSON.stringify(staff.body).includes('at-least-14-characters'));
 const badOrigin=resp();await staffHandler({method:'POST',headers:{host:'gramos-admin.vercel.app',origin:'https://evil.example',authorization:'Bearer valid.jwt'}},badOrigin);
 assert.equal(badOrigin.code,403);
 globalThis.fetch=async input=>{const url=String(input);if(url.endsWith('/auth/v1/user'))return {ok:true,json:async()=>({id:v1})};if(url.includes('/rest/v1/platform_admins'))return {ok:true,json:async()=>[]};throw Error('Authorization should stop here');};
 const notAdmin=resp();await staffHandler({method:'POST',headers:{host:'gramos-admin.vercel.app',authorization:'Bearer valid.jwt'},body:{name:'Member',email:'member@example.in',village_id:v2,role:'reviewer',confirmed_recipient:'true',password:'at-least-14-characters'}},notAdmin);
 assert.equal(notAdmin.code,403);

 const requestURLs=[];let limiter=true;
 globalThis.fetch=async (input,opt={})=>{
  const url=String(input);requestURLs.push(url);
  if(url.includes('/rest/v1/village_domains'))return {ok:true,json:async()=>[]};
  if(url.includes('/rest/v1/villages'))return {ok:true,json:async()=>[{id:v1}]};
  if(url.includes('/rest/v1/rpc/gramos_check_form_rate_v49'))return {ok:true,json:async()=>limiter};
  if(url.includes('/rest/v1/submissions')&&opt.method==='POST')return {ok:true,json:async()=>[]};
  if(url.includes('/rest/v1/submissions'))return {ok:true,json:async()=>[]};
  throw Error('Unexpected form URL '+url);
 };
 const formBody={village_id:v1,sender_name:'Resident',sender_email:'resident@example.com',subject:'general',message:'This is a normal message to the village administration.',website:''};
 const good=resp();await submitHandler({method:'POST',headers:{host:'gramos-public.vercel.app',origin:'https://gramos-public.vercel.app','x-forwarded-for':'192.0.2.1'},body:formBody},good);
 assert.equal(good.code,201,JSON.stringify(good.body));assert(!requestURLs.some(s=>s.includes('siteverify')));
 limiter=false;const limited=resp();await submitHandler({method:'POST',headers:{host:'gramos-public.vercel.app','x-forwarded-for':'192.0.2.1'},body:formBody},limited);
 assert.equal(limited.code,429);
 const wrong=resp();await submitHandler({method:'POST',headers:{host:'other-village.in',origin:'https://other-village.in'},body:formBody},wrong);
 assert.equal(wrong.code,403);
 const spam=resp();await submitHandler({method:'POST',headers:{host:'gramos-public.vercel.app'},body:{...formBody,website:'robot'}},spam);
 assert.equal(spam.code,400);
}finally{
 globalThis.fetch=oldFetch;
 for(const key of Object.keys(process.env))if(!(key in save))delete process.env[key];
 Object.assign(process.env,save);
}
const root=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
const handler=readFileSync(new URL('../api/staff-admin.js',import.meta.url),'utf8');
assert(root.includes("route[1]==='clients'")&&root.includes("route[1]==='new-village'"));
assert(root.includes("route[1]==='staff'&&role.admin"));
assert(!handler.includes('GRANT ALL TO authenticated'));
console.log('PASS v4.9: all customer rows and Excel/CSV, formula escaping, superadmin-only staff, ordinary forms without Turnstile, rate limits, tenant host checks, and separate admin pages');

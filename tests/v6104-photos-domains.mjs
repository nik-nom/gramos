import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseDomainInput,dnsRows,renderDNSRecords} from '../apps/admin/src/domain-setup.mjs';
import handler from '../apps/admin/api/domain-admin.js';
assert.equal(parseDomainInput(' https://Ramnagar.com/ '),'ramnagar.com');assert.equal(parseDomainInput('ramnagar'),'ramnagar.vercel.app');assert.throws(()=>parseDomainInput('ramnagar.com/path'));assert.throws(()=>parseDomainInput('gramos-admin.vercel.app'));
const village='11111111-1111-4111-8111-111111111111',user='22222222-2222-4222-8222-222222222222',host='ramnagar.com';
Object.assign(process.env,{SUPABASE_URL:'https://mock.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_mock',SUPABASE_SERVICE_ROLE_KEY:'mock-server-secret',VERCEL_API_TOKEN:'mock-vercel-token',VERCEL_PUBLIC_PROJECT_ID:'prj_mock'});
let records=[],dnsReady=false,ownership=false,txtReady=false,admin=true,activations=0,verifyCalls=0;
globalThis.fetch=async(input,init={})=>{const u=new URL(input),method=init.method||'GET',body=init.body?JSON.parse(init.body):null;let result=[];let status=200;
 if(u.pathname==='/auth/v1/user')result={id:user};else if(u.pathname.endsWith('/platform_admins'))result=admin?[{user_id:user}]:[];else if(u.pathname.endsWith('/villages'))result=[{id:village,slug:'ramngra',status:'published'}];else if(u.pathname.endsWith('/village_domains')){if(method==='POST')records.push(body);else if(method==='PATCH')records=records.map(d=>({...d,...body}));result=records;}else if(u.pathname.endsWith('/gramos_activate_verified_domain')){activations++;records=records.map(d=>({...d,status:'active'}));result=true;}else if(u.hostname==='api.vercel.com'){
 if(u.pathname.endsWith('/config')){assert.equal(u.searchParams.get('projectIdOrName'),'prj_mock');result={misconfigured:!dnsReady,recommendedIPv4:[{rank:2,value:['192.0.2.2']},{rank:1,value:['192.0.2.1']}],recommendedCNAME:[{rank:1,value:'mock.vercel-dns.com'}]};}
 else if(u.pathname.endsWith('/verify')){verifyCalls++;if(txtReady)ownership=true;else status=400;result={verified:ownership};}
 else result={name:host,apexName:host,verified:ownership,verification:ownership?[]:[{type:'TXT',domain:'_vercel.'+host,value:'example-token'}]};
 }return new Response(JSON.stringify(result),{status});};
async function invoke(action){const res={setHeader(){},end(x){this.body=JSON.parse(x)}};await handler({method:'POST',headers:{authorization:'Bearer mock.jwt'},body:{action,hostname:host,village_id:village}},res);return res;}
admin=false;assert.equal((await invoke('register')).statusCode,403);admin=true;
let r=await invoke('register');assert.equal(r.statusCode,200);assert.equal(records[0].status,'pending');assert.deepEqual(dnsRows(records[0]),[['A',host,'192.0.2.1'],['TXT','_vercel.'+host,'example-token']]);assert.match(renderDNSRecords(records[0],'en'),/192\.0\.2\.1/);assert.doesNotMatch(renderDNSRecords(records[0],'en'),/192\.0\.2\.2/);
assert.deepEqual(dnsRows({hostname:'www.'+host,vercel_details:{apexDomain:host,recommendedCNAME:[{rank:1,value:'mock.vercel-dns.com'}]}}),[['CNAME','www.'+host,'mock.vercel-dns.com']]);
r=await invoke('check');assert.equal(r.body.active,false);assert.equal(activations,0);assert.equal(verifyCalls,1);txtReady=true;r=await invoke('check');assert.equal(r.body.active,false);assert.equal(activations,0);dnsReady=true;r=await invoke('check');assert.equal(r.body.active,true);assert.equal(activations,1);
const source=await readFile(new URL('../apps/admin/src/admin.js',import.meta.url),'utf8');assert.match(source,/section==='photos'\?photosEditor/);assert.match(source,/reviewerOnly&&section!=='submissions'/);assert.match(source,/data-image-input data-target="image_url"/);assert.match(source,/input\.dataset\.uploading='true'/);assert.match(source,/delete input\.dataset\.uploading/);
const main=await readFile(new URL('../apps/admin/src/main.js',import.meta.url),'utf8');assert.match(main,/form\.querySelector\('\[data-uploading="true"\]'\)/);
console.log('PASS: custom domain input, ranked DNS records, pending TXT challenge, explicit Vercel verification, DNS-gated activation, admin gate and photo entrypoint/upload guard checks.');

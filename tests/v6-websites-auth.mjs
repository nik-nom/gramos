import assert from 'node:assert/strict';
import {buildShamvadiVillage, SHAMVADI_TEMPLATE_SECTIONS} from '../src/templates.js';
const web1=buildShamvadiVillage({slug:'shamvadi',name_mr:'शामवाडी',taluka_mr:'भोर',district_mr:'पुणे'});
const web2=buildShamvadiVillage({slug:'another-village',name_en:'Another Village',district_en:'Pune'});
assert.equal(web1.status,'draft');
assert.equal(web1.template_style,'classic');
assert.equal(web1.site_settings.template_key,'shamvadi-blue');
assert.deepEqual(web1.home_sections,SHAMVADI_TEMPLATE_SECTIONS);
assert.notEqual(web1.slug,web2.slug);
web1.home_sections.pop();
assert.equal(web2.home_sections.length,6,'One village must not share a mutable content array with another');
assert.throws(()=>buildShamvadiVillage({slug:'../hack',name_en:'X'}),/slug/);
assert.throws(()=>buildShamvadiVillage({slug:'safe'}),/village name/);
// Offline mock for login, permissions and insert payload (does not contact Supabase).
let payloads=[], creds=[], signedIn=true, recoveryEmails=[], passwords=[];
const query=(data)=>({eq(){return this},order(){return this},maybeSingle:async()=>({data:data?.[0]||null,error:null}),single:async()=>({data:data?.[0]||null,error:null}),then(yes,no){return Promise.resolve({data,error:null}).then(yes,no)}});
const api={
 rpc(name,args){payloads.push({rpc:name,args});return query(['created-village-id']);},
 auth:{signInWithPassword:async x=>{creds.push(x);return signedIn?{error:null}:{error:{message:'Invalid login credentials'}}}, resetPasswordForEmail:async (email,options)=>{recoveryEmails.push({email,options});return {error:null}}, updateUser:async data=>{passwords.push(data);return {error:null}}},
 from(table){return {
  select(){return query([{id:'created-village-id',slug:'shamvadi',status:'draft',site_settings:{template_key:'shamvadi-blue'}}])},
  in(){return query([])},
  insert(payload){payloads.push({table,payload});return {select(){return query([{id:'created-village-id'}])}}},
  update(payload){payloads.push({table,payload});return {eq(){return this},select(){return query([{id:'created-village-id'}])}}}
 }}
};
globalThis.location={origin:'https://gramos.test',pathname:'/admin',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://gramos-test.supabase.co',supabaseAnonKey:'sb_publishable_public'},supabase:{createClient:()=>api}};
let toast={className:'',textContent:'',classList:{add(){}}};
globalThis.document={title:'',getElementById(){return toast},querySelectorAll(){return []}};
class FakeFormData{constructor(f){this.f=f.fields}get(k){return this.f[k]??''}}
globalThis.FormData=FakeFormData;
const {submitAdminForm,renderAdmin}=await import('../src/admin.js');
const anonymousLogin=await renderAdmin(['admin','login'],'en',{admin:false,ids:[]},null);
assert(anonymousLogin.includes('There is no default admin password'));
assert(anonymousLogin.includes('Forgot password?'));
let redirected='';
await submitAdminForm({id:'loginForm',fields:{email:' admin@example.test ',password:' space-sensitive ' }},[],{admin:false,ids:[]},url=>redirected=url,()=>{});
assert.equal(creds[0].password,' space-sensitive ');
assert.equal(creds[0].email,'admin@example.test');
assert.equal(redirected,'/admin');
signedIn=false;
await assert.rejects(()=>submitAdminForm({id:'loginForm',fields:{email:'abc@example.test',password:'wrong'}},[],{admin:false,ids:[]},()=>{},()=>{}),/Forgot password/);
signedIn=true;
const recoverPage=await renderAdmin(['admin','recover'],'en',{admin:false,ids:[]},null);
assert(recoverPage.includes('recoverPasswordForm'));
await submitAdminForm({id:'recoverPasswordForm',fields:{email:' admin@example.test '},reset(){}},[],{admin:false,ids:[]},()=>{},()=>{});
assert.equal(recoveryEmails[0].email,'admin@example.test');
assert(recoveryEmails[0].options.redirectTo.endsWith('/admin/security'));
const securityPage=await renderAdmin(['admin','security'],'en',{admin:true,ids:[]},{email:'admin@example.test'});
assert(securityPage.includes('setPasswordForm'));
await assert.rejects(()=>submitAdminForm({id:'setPasswordForm',fields:{password:'123',confirm_password:'123'}},[],{admin:true,ids:[]},()=>{},()=>{}),/14 and 128/);
await assert.rejects(()=>submitAdminForm({id:'setPasswordForm',fields:{password:'new-pass-word-123456',confirm_password:'different'}},[],{admin:true,ids:[]},()=>{},()=>{}),/do not match/);
await submitAdminForm({id:'setPasswordForm',fields:{password:'new-pass-word-123456',confirm_password:'new-pass-word-123456'},reset(){}},[],{admin:true,ids:[]},()=>{},()=>{});
assert.equal(passwords.at(-1).password,'new-pass-word-123456');
await assert.rejects(()=>submitAdminForm({id:'createVillageForm',fields:{slug:'test',name_en:'Test'}},[],{admin:false,ids:[]},()=>{},()=>{}),/Only platform admins/);
await submitAdminForm({id:'createVillageForm',fields:{slug:'shamvadi',name_mr:'शामवाडी',district_mr:'पुणे',taluka_mr:'भोर',customer_name:'Contact',customer_email:'hello@example.com',customer_phone:'9923227879',gram_sevak_name:'Gram Sevak'}},[],{admin:true,ids:[]},url=>redirected=url,()=>{});
const created=payloads.find(x=>x.rpc==='gramos_create_village_customer');
assert(created);
assert.equal(created.args.p_village.slug,'shamvadi');
assert.equal(created.args.p_customer.customer_name,'Contact');
assert.equal(redirected,'/admin/clients?site=created-village-id');
const dashboard=await renderAdmin(['admin'],'en',{admin:true,ids:[]},{email:'owner@example.test'});
assert(dashboard.includes('Customer register'));
const create=await renderAdmin(['admin','new-village'],'en',{admin:true,ids:[]},{email:'owner@example.test'});
assert(create.includes('name="district_mr"'));assert(create.includes('name="taluka_en"'));
clearTimeout(window.__toastTimer);
console.log('PASS v4.9: Auth login, permissions, transactional village/customer creation and separate customer register.');

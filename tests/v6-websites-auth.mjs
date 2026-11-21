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
let payloads=[], creds=[], signedIn=true;
const query=(data)=>({eq(){return this},order(){return this},maybeSingle:async()=>({data:data?.[0]||null,error:null}),single:async()=>({data:data?.[0]||null,error:null}),then(yes,no){return Promise.resolve({data,error:null}).then(yes,no)}});
const api={
 auth:{signInWithPassword:async x=>{creds.push(x);return signedIn?{error:null}:{error:{message:'Invalid login credentials'}}}},
 from(table){return {
  select(){return query([{id:'created-village-id',site_settings:{template_key:'shamvadi-blue'}}])},
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
assert(anonymousLogin.includes('There is no default password'));
assert(anonymousLogin.includes('Create new user'));
let redirected='';
await submitAdminForm({id:'loginForm',fields:{email:' admin@example.test ',password:' space-sensitive ' }},[],{admin:false,ids:[]},url=>redirected=url,()=>{});
assert.equal(creds[0].password,' space-sensitive ');
assert.equal(creds[0].email,'admin@example.test');
assert.equal(redirected,'/admin');
signedIn=false;
await assert.rejects(()=>submitAdminForm({id:'loginForm',fields:{email:'abc@example.test',password:'wrong'}},[],{admin:false,ids:[]},()=>{},()=>{}),/no default account or password/);
signedIn=true;
await assert.rejects(()=>submitAdminForm({id:'createVillageForm',fields:{slug:'test',name_en:'Test'}},[],{admin:false,ids:[]},()=>{},()=>{}),/Only platform admins/);
await submitAdminForm({id:'createVillageForm',fields:{slug:'shamvadi',name_mr:'शामवाडी',district_mr:'पुणे',taluka_mr:'भोर'}},[],{admin:true,ids:[]},url=>redirected=url,()=>{});
const insert=payloads.find(x=>x.table==='villages');
assert(insert);
assert.equal(insert.payload.slug,'shamvadi');
assert.equal(insert.payload.site_settings.template_key,'shamvadi-blue');
assert.equal(insert.payload.status,'draft');
assert.equal(redirected,'/admin/villages/created-village-id/home');
const dashboard=await renderAdmin(['admin'],'en',{admin:true,ids:[]},{email:'owner@example.test'});
assert(dashboard.includes('Shamvadi Blue'));
assert(dashboard.includes('name="district_mr"'));
assert(dashboard.includes('name="taluka_en"'));
clearTimeout(window.__toastTimer);
console.log('PASS: No preset password, valid Auth login, wrong credentials, role gate, shared template and independent new village sites.');

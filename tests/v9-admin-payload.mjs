import assert from 'node:assert/strict';
let saved=[];
const q=()=>({eq(){return this},then(ok,no){return Promise.resolve({data:[{id:'test-record'}],error:null}).then(ok,no)}});
const api={from(table){return {
 select(){return {eq(){return this},maybeSingle:async()=>({data:{id:'v',site_settings:{existing:'keep'}},error:null})}},
 update(payload){saved.push({table,payload});return {select(){return q()},eq(){return this}}},
 insert(payload){saved.push({table,payload});return {select(){return q()}}}
}}};
globalThis.location={origin:'https://gramos.test',pathname:'/admin/villages/v/about',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://test-project.supabase.co',supabaseAnonKey:'sb_publishable_test'},supabase:{createClient:()=>api}};
globalThis.document={getElementById(){return {classList:{add(){}},textContent:''}},querySelectorAll(){return []}};
class MockFormData{constructor(form){this.fields=form.fields;}get(k){return this.fields[k]??''}}
globalThis.FormData=MockFormData;
const {submitAdminForm}=await import('../src/admin.js');
const run=async(kind,fields)=>{
 await submitAdminForm({id:'contentForm',dataset:{id:'v',kind},fields:{slug:'test-item',title_mr:'नमुना',status:'published',...fields}},[],{admin:true},()=>{},()=>{});
 return saved.pop().payload;
};
let f=await run('about_facts',{group:'population',value:'1234'});
assert.equal(f.details.group,'population');assert.equal(f.details.value,'1234');
let c=await run('committees',{committee_key:'health',committee_title_mr:'आरोग्य समिती',committee_role_mr:'अध्यक्ष'});
assert.equal(c.details.committee_key,'health');assert.equal(c.details.committee_role_mr,'अध्यक्ष');
let d=await run('duties',{body_mr:'जबाबदारी १\nजबाबदारी २',icon:'♙',accent:'#bf392b'});
assert.equal(d.details.accent,'#bf392b');assert(d.body_mr.includes('\n'));
let o=await run('officials',{about_group:'staff',ward_mr:'१',phone:'1234'});
assert.equal(o.details.about_group,'staff');assert.equal(o.details.phone,'1234');
let fac=await run('facilities',{value:'होय'});assert.equal(fac.details.value,'होय');
await submitAdminForm({id:'aboutSettingsForm',dataset:{id:'v'},fields:{about_page_title_mr:'ग्रामपंचायतीबद्दल',about_tab_staff_mr:'कर्मचारी',about_mission_mr:'काम\nकाम २'}},[],{admin:true},()=>{},()=>{});
const settings=saved.pop();assert.equal(settings.table,'villages');assert.equal(settings.payload.site_settings.about_tab_staff_mr,'कर्मचारी');assert.equal(settings.payload.site_settings.existing,'keep');
clearTimeout(window.__toastTimer);
console.log('PASS V9: Every new admin content type and About settings save valid Supabase payloads.');

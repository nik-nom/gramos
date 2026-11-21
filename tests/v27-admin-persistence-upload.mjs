import assert from 'node:assert/strict';
let updates=[],uploads=[];
const villages={id:'11111111-1111-4111-8111-111111111111',site_settings:{template_key:'shamvadi-blue',quote_mr:'keep this'}};
const afterUpdate=()=>({eq(){return this},select(){return this},then(ok,fail){return Promise.resolve({data:[{id:villages.id}],error:null}).then(ok,fail)}});
const db={
 from(table){return {
   select(){return {eq(){return this},maybeSingle:async()=>({data:villages,error:null})}},
   update(payload){updates.push({table,payload});return afterUpdate()},
   insert(payload){updates.push({table,payload});return afterUpdate()}
 }},
 storage:{from(bucket){return {
   upload:async(path,file,options)=>{uploads.push({bucket,path,file,options});return {error:null}},
   getPublicUrl:path=>({data:{publicUrl:`https://gramos-test.supabase.co/storage/v1/object/public/${bucket}/${path}`}})
 }}}
};
globalThis.location={origin:'https://gramos.test',pathname:'/admin/villages/11111111-1111-4111-8111-111111111111',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://gramos-test.supabase.co',supabaseAnonKey:'sb_publishable_test'},supabase:{createClient:()=>db}};
const toast={className:'',classList:{add(){}}};
globalThis.document={getElementById:()=>toast};
class FormDataMock {constructor(form){this.fields=form.fields}get(k){return this.fields[k]??''}}
globalThis.FormData=FormDataMock;
const {submitAdminForm}=await import('../src/admin.js');
const {uploadPublicDocument}=await import('../src/data.js');
await submitAdminForm({id:'projectSettingsForm',dataset:{id:villages.id},fields:{
 projects_page_title_mr:'विकास कामे व प्रकल्प',projects_intro_mr:'योजना आणि प्रकल्प',
 projects_tab_ongoing_en:'Ongoing works',projects_scheme_label_mr:'योजना'
}},[],{admin:true},()=>{},()=>{});
const p=updates.pop();assert.equal(p.table,'villages');assert.equal(p.payload.site_settings.quote_mr,'keep this');
assert.equal(p.payload.site_settings.projects_tab_ongoing_en,'Ongoing works');
assert.equal(p.payload.site_settings.projects_page_title_mr,'विकास कामे व प्रकल्प');
await submitAdminForm({id:'contentForm',dataset:{id:villages.id,kind:'projects'},fields:{
 slug:'road-2026',title_mr:'सिमेंट रस्ता',title_en:'Cement Road',project_status:'completed',
 scheme_mr:'१५ वा वित्त आयोग',location_mr:'गाव',project_year:'2026',status:'published'
}},[],{admin:true},()=>{},()=>{});
const c=updates.pop();assert.equal(c.table,'content_items');assert.equal(c.payload.details.project_status,'completed');
assert.equal(c.payload.details.project_year,2026);assert.equal(c.payload.status,'published');
const file={type:'application/pdf',name:'village-form.pdf',size:2048,slice(){return {arrayBuffer:async()=>new TextEncoder().encode('%PDF-').buffer}}};
const url=await uploadPublicDocument(file,villages.id);
assert(url.startsWith('https://gramos-test.supabase.co/storage/v1/object/public/service-documents/'));
assert.equal(uploads[0].bucket,'service-documents');assert(uploads[0].path.startsWith(`${villages.id}/`));
assert.equal(uploads[0].options.contentType,'application/pdf');
let rejected=false;
try{await uploadPublicDocument({...file,slice(){return{arrayBuffer:async()=>new TextEncoder().encode('ABCDE').buffer}}},villages.id)}catch(e){rejected=/valid PDF/.test(e.message)}
assert(rejected,'Reject wrong file contents despite the .pdf name');
clearTimeout(window.__toastTimer);
console.log('PASS v2.7: Admin saves editable project headings and statuses; PDF upload is village-scoped and signature checked.');

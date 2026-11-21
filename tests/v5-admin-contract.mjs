import assert from 'node:assert/strict';
let saved=[];
const qry=()=>({eq(){return this},then(resolve,reject){return Promise.resolve({data:[{id:'ok'}],error:null}).then(resolve,reject)}});
const api={from(table){return {select(){return {eq(){return this},maybeSingle:async()=>({data:{id:'village-id',site_settings:{template_key:'shamvadi-blue'}},error:null})}},update(payload){saved.push({table,op:'update',payload});return {...qry(),select(){return qry()}}},insert(payload){saved.push({table,op:'insert',payload});return {...qry(),select(){return qry()}}}}}};
globalThis.location={origin:'https://gramos.test',pathname:'/admin/villages/village-id',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://gramos-test.supabase.co',supabaseAnonKey:'publishable-example'},supabase:{createClient:()=>api}};
let toast={className:'',textContent:'',classList:{add(){}}};
globalThis.document={getElementById(){return toast},querySelectorAll(){return ['gallery_notice','services_video','news','projects','facilities'].map(x=>({dataset:{section:x}}))}};
class FormDataMock{constructor(form){this.fields=form.fields;}get(k){return this.fields[k]??'';}}
globalThis.FormData=FormDataMock;
const {submitAdminForm}=await import('../src/admin.js');
await submitAdminForm({id:'settingsForm',dataset:{id:'village-id'},fields:{
 slug:'test-village',name_mr:'नमुना गाव',template_style:'classic',
 about_mr:'गावाचे वर्णन',about_en:'Village description',
 about_page_title_mr:'ग्रामपंचायतीबद्दल',about_page_title_en:'About Village',
 about_intro_mr:'पंचायतीची माहिती',about_mission_mr:'ध्येय',about_vision_en:'Vision',
 services_page_title_en:'Citizen Services'
}},[],{admin:true},()=>{},()=>{});
let p=saved.pop()?.payload;
assert.equal(p.about_mr,'गावाचे वर्णन');
assert.equal(p.site_settings.about_intro_mr,'पंचायतीची माहिती');
assert.equal(p.site_settings.services_page_title_en,'Citizen Services');
assert(!('services_tax_qr_url' in p.site_settings), 'Removed QR fields cannot be added through admin');
assert.equal(p.site_settings.about_page_title_en,'About Village');
await submitAdminForm({id:'contentForm',dataset:{id:'village-id',kind:'about_sections'},fields:{
 slug:'about-history',title_mr:'गावाचा इतिहास',title_en:'Village History',
 body_mr:'स्थानिक इतिहास',body_en:'Local history',status:'published',sort_order:'1',
 image_url:'https://example.com/history.jpg'
}},[],{admin:true},()=>{},()=>{});
let x=saved.pop();assert.equal(x.table,'content_items');assert.equal(x.op,'insert');
assert.equal(x.payload.kind,'about_sections');assert.equal(x.payload.status,'published');
assert.equal(x.payload.sort_order,1);assert.equal(x.payload.image_url,'https://example.com/history.jpg');
clearTimeout(window.__toastTimer);
console.log('PASS: Admin saves all About page settings and creates published About sections.');

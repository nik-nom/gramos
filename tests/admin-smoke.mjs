// Offline structural test of the real editable admin HTML (no network / no DB writes).
import assert from 'node:assert/strict';
const villageId='11111111-1111-4111-8111-111111111111';
const fakeVillage={id:villageId,slug:'sample-village',status:'draft',name_en:'Test Village',name_mr:'नमुना गाव',
 template_style:'classic',home_sections:['gallery_notice','leaders_schemes','services_video','news','projects','facilities'],
 site_settings:{nav_mr:'home|मुखपृष्ठ',quote_mr:'चाचणी',welcome_title_mr:'नमुना ग्रामपंचायत',copyright_en:'Test copyright'}};
const fakeItems=[{id:'22222222-2222-4222-8222-222222222222',village_id:villageId,kind:'metrics',slug:'streetlights',title_en:'Streetlights',title_mr:'पथदिवे',details:{value:'210'},status:'published',sort_order:0,created_at:new Date().toISOString()}];
const dbQuery=(table)=>{
 const q={select:()=>q,eq:()=>q,order:()=>q,maybeSingle:async()=>({data:fakeVillage,error:null}),
 then:(yes,no)=>Promise.resolve({data:table==='content_items'?fakeItems:[],error:null}).then(yes,no)};
 return q;
};
globalThis.location={origin:'https://gramos.test',pathname:'/admin/villages/'+villageId,search:''};
globalThis.document={title:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://gramos-test.supabase.co',supabaseAnonKey:'public-test-key'},supabase:{createClient:()=>({from:dbQuery})}};
const {renderAdmin}=await import('../src/admin.js');
const role={admin:true,ids:[]},user={email:'admin@example.test'};
location.search='?view=settings&part=banner';
const homeSettings=await renderAdmin(['admin','villages',villageId,'home'],'mr',role,user);
location.search='';
for(const key of ['welcome_title_mr','nav_mr','gallery_heading_mr','hero_image_url','quote_mr']){
 assert(homeSettings.includes(`name="${key}"`),`Homepage setting ${key} missing from independent Home editor`);
}
for(const area of ['gallery_notice','leaders_schemes','services_video','news','projects','facilities']){
 assert(homeSettings.includes(`data-section="${area}"`),`Homepage area ${area} missing from ordering`);
}
assert(homeSettings.includes('id="homeForm"') && homeSettings.includes('admin-preview-wide'));
const footerSettings=await renderAdmin(['admin','villages',villageId,'footer'],'en',role,user);
assert(footerSettings.includes('id="footerForm"'));
assert(footerSettings.includes('name="footer_logo_0"')&&footerSettings.includes('name="footer_logo_11"'));
assert(footerSettings.includes('name="footer_pages_mr"')&&footerSettings.includes('name="office_hours_mr"'));
const villageSettings=await renderAdmin(['admin','villages',villageId],'en',role,user);
assert(villageSettings.includes('name="logo_url"'));
assert(!villageSettings.includes('name="hero_image_url"'),'Homepage banner must be separate from Village information');
assert(villageSettings.includes('/home'),'Village information must link to independent homepage editor');
globalThis.location.search='?edit=22222222-2222-4222-8222-222222222222';
const metricEditor=await renderAdmin(['admin','villages',villageId,'content','metrics'],'en',role,user);
assert(metricEditor.includes('name="value"'),'Metrics value not editable');
assert(metricEditor.includes('value="210"'),'Existing metric value not populated');
globalThis.location.search='';
const bannerEditor=await renderAdmin(['admin','villages',villageId,'content','banners'],'en',role,user);
assert(bannerEditor.includes('name="image_url"'),'Banner image not editable');
assert(bannerEditor.includes('data-image-input'),'Banner image upload missing');
console.log('PASS: Editable admin homepage fields, section ordering, metric values, banner image uploads.');

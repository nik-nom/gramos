import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderNoticesPage} from '../src/notices.js';

globalThis.location={origin:'http://localhost:8000',pathname:'/demo/notices',search:''};
const {village,items}=getDemo();
assert.equal(items.filter(x=>x.kind==='notices').length,11);
for(const l of ['mr','en']){
 const html=renderNoticesPage(village,items,l);
 assert.equal((html.match(/role="tab"/g)||[]).length,4,'Four accessible tabs');
 assert.equal((html.match(/class="sv-n-card"/g)||[]).length,11,'All categorized demo cards');
 for(const type of ['notice','financial','rti','resolutions']){
  assert(html.includes(`id="notices-panel-${type}"`));
  assert(html.includes(`data-tab="${type}"`));
 }
 assert.equal((html.match(/class="sv-n-download"/g)||[]).length,9,'RTI cards do not misrepresent sample PDFs as real RTI documents');
 assert(html.includes('/assets/reference-demo/notice-sample.pdf'));
 assert(html.includes(l==='mr'?'नोटीस बोर्ड':'Notice Board'));
 assert(html.includes('03/12/2025') || html.includes('30/11/2025'));
 assert(!html.includes('javascript:'));
 const other={...village,slug:'shirpur',id:'live-id'};
 const live=renderNoticesPage(other,[],l);
 assert(live.includes('sv-n-empty'));
 assert.equal((live.match(/class="sv-n-card"/g)||[]).length,2,'Only two explicitly screenshot-backed RTI titles appear by default');
 const legacy=[{kind:'notices',title_mr:'पूर्वीची सूचना',title_en:'Old Notice',details:{event_date:'2026-11-21'},external_url:'',sort_order:0}];
 assert(renderNoticesPage(other,legacy,l).includes('sv-n-card'),'Old notices without type stay visible in first tab');
 globalThis.location.search='?noticeTab=rti';
 assert(/id="notices-tab-rti"[^>]*class="sv-n-tab active"/.test(renderNoticesPage(village,items,l)));
 globalThis.location.search='';
 const malicious=[{kind:'notices',title_mr:'<svg onload=alert(1)>',title_en:'<script>alert(1)</script>',details:{notice_type:'rti'},external_url:'javascript:alert(1)',sort_order:2}];
 const safe=renderNoticesPage(other,malicious,l);
 assert(!safe.includes('<script>')&&!safe.includes('<svg onload'));
 assert(!safe.includes('href="javascript:'));
 assert(safe.includes('sv-n-no-pdf'));
}
const root=new URL('../',import.meta.url);
const admin=await readFile(new URL('src/admin.js',root),'utf8');
const pub=await readFile(new URL('src/public.js',root),'utf8');
const main=await readFile(new URL('src/main.js',root),'utf8');
const css=await readFile(new URL('styles.css',root),'utf8');
const server=await readFile(new URL('server.mjs',root),'utf8');
assert(admin.includes("section==='notices'?noticesEditor(working,lang)"));
assert(admin.includes("payload.kind==='notices'?['event_date','notice_type']"));
assert(admin.includes("kind==='notices'?`<label class=\"upload-box\""));
assert(admin.includes('id="noticeSettingsForm"'));
assert(admin.includes("['notices',tr(lang,'नोटीस बोर्ड','Notice board'),'notices']"));
assert(pub.includes("if(section==='notices')"));
assert(main.includes("if(action==='notice-tab')"));
assert(main.includes("'noticeSettingsForm'"));
assert(css.includes('.sv-n-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'));
assert(css.includes('@media(max-width:600px)'));
assert(server.includes("'.pdf':'application/pdf'"));
const base=await readFile(new URL('src/data.js',root),'utf8');
assert(base.includes("storage.from('service-documents')"));
assert(base.includes('The uploaded document is not a valid PDF file.'));
console.log('PASS v2.9: Four Notice Board tabs, scoped content, PDF links, demo/live separation, XSS safety and responsive layout.');

// Persistence test: editable page fields are stored in village JSON settings;
// category/date are stored in the existing village-scoped content_items table.
const save=[],v={id:'11111111-1111-4111-8111-111111111111',site_settings:{quote_mr:'existing quote'}};
const result=()=>({eq(){return this},select(){return this},then(f,g){return Promise.resolve({data:[{id:v.id}],error:null}).then(f,g)}});
const db={from(table){return {
 select(){return{eq(){return this},maybeSingle:async()=>({data:v,error:null})}},
 update(payload){save.push({table,payload});return result()},
 insert(payload){save.push({table,payload});return result()}
}}};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://gramos-test.supabase.co',supabaseAnonKey:'sb_publishable_test'},supabase:{createClient:()=>db}};
const toast={classList:{add(){}},className:''};
globalThis.document={getElementById:()=>toast};
globalThis.FormData=class{constructor(form){this.fields=form.fields}get(k){return this.fields[k]??''}};
const {submitAdminForm}=await import('../src/admin.js');
await submitAdminForm({id:'noticeSettingsForm',dataset:{id:v.id},fields:{notices_page_title_mr:'सूचना फलक',notices_tab_financial_en:'Finance',notices_intro_mr:'अहवाल व सूचना'}},[],{admin:true},()=>{},()=>{});
assert.equal(save.pop().payload.site_settings.notices_tab_financial_en,'Finance');
await submitAdminForm({id:'contentForm',dataset:{id:v.id,kind:'notices'},fields:{slug:'budget-2026',title_mr:'अहवाल',title_en:'Report',notice_type:'financial',status:'published',event_date:'2026-11-21',external_url:'https://example.org/report.pdf'}},[],{admin:true},()=>{},()=>{});
const row=save.pop();
assert.equal(row.table,'content_items');
assert.equal(row.payload.details.notice_type,'financial');
assert.equal(row.payload.details.event_date,'2026-11-21');
assert.equal(row.payload.external_url,'https://example.org/report.pdf');
assert.equal(row.payload.village_id,v.id);
let bad=false;
try{await submitAdminForm({id:'contentForm',dataset:{id:v.id,kind:'notices'},fields:{slug:'bad',title_mr:'Bad',notice_type:'wrong',status:'draft'}},[],{admin:true},()=>{},()=>{})}catch(e){bad=/valid Notice Board category/.test(e.message)}
assert(bad,'Unknown notice categories are rejected');
clearTimeout(window.__toastTimer);
console.log('PASS v2.9: Notice Board admin settings and categorized PDF records persist through existing Supabase tables.');

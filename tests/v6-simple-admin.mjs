import assert from 'node:assert/strict';
import {renderContactPage} from '../src/contact.js';
import {renderServicesPage} from '../src/services.js';
const id='11111111-1111-4111-8111-111111111111', sub='22222222-2222-4222-8222-222222222222';
const v={id,slug:'village-a',status:'published',name_en:'Village A',name_mr:'गाव अ',site_settings:{},home_sections:[]};
const saved={id:'33333333-3333-4333-8333-333333333333',village_id:id,kind:'service_forms',slug:'birth-death-nonavailability',title_en:'Village-specific PDF',title_mr:'अर्ज',external_url:'https://example.test/form.pdf',status:'published',sort_order:0};
const submission={id:sub,village_id:id,sender_name:'<Citizen>',sender_email:'test@example.test',subject:'complaint',message:'Full complaint\nSecond line',created_at:'2026-11-24T00:00:00Z',status:'new',attachment_path:'private-photo'};
const calls=[];
function from(table){let filters={};const q={select:()=>q,eq:(k,x)=>{filters[k]=x;return q},order:()=>q,range:()=>q,maybeSingle:async()=>{calls.push([table,{...filters}]);return {data:table==='villages'?v:table==='submissions'&&filters.village_id===id&&filters.id===sub?submission:null,error:null}},then:(resolve,reject)=>{calls.push([table,{...filters}]);return Promise.resolve({data:table==='content_items'?[saved]:table==='submissions'&&filters.village_id===id?[submission]:[],error:null}).then(resolve,reject)}};return q;}
globalThis.location={pathname:'/admin/villages/'+id,search:'',origin:'https://example.test'};globalThis.document={title:''};globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://gramos-test.supabase.co',supabaseAnonKey:'public-test-key'},supabase:{createClient:()=>({from})}};
const {renderAdmin}=await import('../src/admin.js');const admin={admin:true,ids:[]},reviewer={admin:false,ids:[id],editorIds:[],reviewerIds:[id]},user={email:'staff@example.test'};
let html=await renderAdmin(['admin','villages',id,'content','service_forms'],'en',admin,user);
assert(html.includes('gx6-listing')&&html.includes('?new=1')&&html.includes('Village-specific PDF')&&html.includes('?template=citizen-services-application'));
for(const lang of ['en','mr']){for(const kind of ['notices','schemes','gallery','news','projects','services']){for(const search of ['', '?new=1']){location.search=search;const screen=await renderAdmin(['admin','villages',id,'content',kind],lang,admin,user);assert(!screen.includes('gx-csv-export')&&!screen.includes('↓ CSV'));assert(screen.includes('/import/'+kind));}}}
location.search='?template=birth-death-nonavailability';html=await renderAdmin(['admin','villages',id,'content','service_forms'],'en',admin,user);
assert(html.includes('gx6-editing')&&html.includes(`data-edit="${saved.id}"`)&&html.includes('value="https://example.test/form.pdf"'));
location.search='';html=await renderAdmin(['admin','villages',id,'submissions'],'en',reviewer,user);
assert(html.includes('View form')&&html.includes('&lt;Citizen&gt;')&&html.includes(`?view=${sub}`));
location.search='?view='+sub;html=await renderAdmin(['admin','villages',id,'submissions'],'en',reviewer,user);
assert(html.includes('Full complaint\nSecond line')&&html.includes('View private attachment')&&!html.includes('data-action="submission-status"'));
assert(calls.some(([table,f])=>table==='submissions'&&f.village_id===id&&f.id===sub));
html=await renderAdmin(['admin','villages',id,'submissions'],'en',admin,user);assert(html.includes('data-action="submission-status"'));
location.search='?contactTab=form';html=renderContactPage(v,'en');assert(html.includes('id="visitorForm"')&&html.includes('Send message')&&!html.includes('type="submit" disabled'));
location.search='?preview=1&contactTab=form';html=renderContactPage(v,'en');assert(html.includes('id="visitorForm"')&&html.includes('type="submit" disabled'));
location.search='?serviceTab=forms';html=renderServicesPage(v,[saved],'en');assert(html.includes('View PDF')&&html.includes('https://example.test/form.pdf'));
console.log('PASS v6: visible built-in records and edit links, existing override reuse, form list and full details, reviewer isolation, live form/preview, PDF view.');

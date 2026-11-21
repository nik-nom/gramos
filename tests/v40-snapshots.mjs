import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {renderShamvadiHomepage} from '../src/homepage.js';
const {village:demo,items:demoItems}=getDemo();
const v={...demo,id:'11111111-1111-4111-8111-111111111111',slug:'sample',status:'published',name_en:'Test village',site_settings:{...demo.site_settings,quote_mr:'एकच सूचना सर्व पानांवर दिसते',quote_en:'Same announcement on every page',nav_logo_url:'https://cdn.example.org/test-logo.png',nav_logo_size:'84',nav_logo_shape:'circle',nav_logo_fit:'contain',footer_logos:Array.from({length:12},(_,i)=>`https://cdn.example.org/logo-${i}.png`),footer_logo_url:'https://cdn.example.org/logo-0.png'}};
const api={from(table){const q={table,filter:[],select(){return this},eq(k,v){this.filter.push([k,v]);return this},order(){return this},maybeSingle:async()=>({data:table==='villages'?v:null,error:null}),then(ok,fail){const data=table==='villages'?[v]:table==='platform_admins'?[{user_id:'admin'}]:table==='content_items'?demoItems:[];return Promise.resolve({data,error:null}).then(ok,fail)}};return q}};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'test'},supabase:{createClient:()=>api}};
globalThis.location={origin:'https://example.org',pathname:'/admin/villages/'+v.id,search:''};
globalThis.document={getElementById:()=>({}),querySelectorAll:()=>[],title:''};
const {renderAdmin}=await import('../src/admin.js');
const role={admin:true,ids:[],editorIds:[]},user={email:'admin@example.org'};
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const html=(body)=>`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="app">${body}</div></body></html>`;
const dir=new URL('../qa/',import.meta.url);mkdirSync(dir,{recursive:true});
for(const section of ['overview','home','branding','footer','settings','about','news','contact','gallery']){
 const body=await renderAdmin(['admin','villages',v.id,section],'en',role,user);
 writeFileSync(new URL(`admin-${section}.html`,dir),html(body));
}
const long='A very long paragraph for the village project that must wrap naturally in a card without distorting the other cards. '.repeat(9);
const longProject={id:'long-project',village_id:v.id,kind:'projects',slug:'long-project',title_en:'Project with a very long title that should never overlap the neighbouring project title even on narrow phone screens',title_mr:'दीर्घ शीर्षक असलेली योजना',body_en:long,body_mr:long,status:'published',sort_order:0,details:{project_year:2026}};
const body=renderShamvadiHomepage({...v,home_sections:['gallery_notice','leaders_schemes','services_video','news','projects','facilities']},[longProject,...demoItems.filter(x=>x.kind!=='projects'),...demoItems.filter(x=>x.kind==='projects').slice(0,2)],'en');
writeFileSync(new URL('public-home.html',dir),html(body));
console.log('Generated static HTML snapshot pages for visual layout checks.');

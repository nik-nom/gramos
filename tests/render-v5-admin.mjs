// Offline browser visual-test snapshots using renderAdmin and a mocked Supabase client.
// For layouts only; do not treat as proof of live authentication or Supabase writes.
import {writeFile,readFile,mkdir} from 'node:fs/promises';
const VID='11111111-2222-4333-8444-555555555555';
const village={id:VID,slug:'test-village',name_en:'Test Village',name_mr:'चाचणी गाव',district_en:'Pune',district_mr:'पुणे',taluka_en:'Haveli',taluka_mr:'हवेली',status:'published',site_settings:{},home_sections:[],updated_at:new Date().toISOString(),created_at:new Date().toISOString()};
const content={id:'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',village_id:VID,kind:'notices',slug:'village-meeting',title_en:'Village meeting',title_mr:'ग्रामसभा',body_en:'Annual meeting notice',body_mr:'वार्षिक बैठकीची सूचना',status:'draft',details:{},sort_order:0,deleted_at:null,updated_at:new Date().toISOString(),created_at:new Date().toISOString()};
const rows={villages:[village],platform_admins:[{user_id:'test-user'}],village_members:[],village_site_drafts:[],content_items:[content],gramos_activity_log:[{id:1,village_id:VID,entity:'content_items',operation:'INSERT',title:'Village meeting',created_at:new Date().toISOString()}],submissions:[],village_clients:[],village_domains:[],gramos_platform_branding:[]};
class Query{constructor(t){this.t=t;this.filters=[];this.singular=false;}
 select(){return this;}eq(k,v){this.filters.push(x=>String(x[k])===String(v));return this;}in(k,values){this.filters.push(x=>values.includes(x[k]));return this;}is(k,v){this.filters.push(x=>x[k]===v);return this;}order(){return this;}limit(){return this;}maybeSingle(){this.singular=true;return this;}
 then(resolve,reject){const filtered=(rows[this.t]||[]).filter(x=>this.filters.every(f=>f(x)));return Promise.resolve({data:this.singular?filtered[0]||null:filtered,error:null}).then(resolve,reject);}
}
const client={from:k=>new Query(k)};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://test.supabase.co',supabaseAnonKey:'not-a-secret'},supabase:{createClient:()=>client}};
globalThis.location={pathname:'/admin',search:''};
globalThis.document={title:'',head:null};
const {renderAdmin}=await import('../src/admin.js');
const role={admin:true,ids:[],editorIds:[],reviewerIds:[]},user={id:'test-user',email:'example@example.org'};
const prefix=`<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${await readFile(new URL('../styles.css',import.meta.url),'utf8')}</style></head><body><div id="app">`;
const dir=new URL('./screenshots-v5/',import.meta.url);await mkdir(dir,{recursive:true});
for(const [name,route] of [['dashboard',['admin']],['content',['admin','villages',VID,'content','notices']],['import',['admin','villages',VID,'import','notices']],['overview',['admin','villages',VID,'overview']]]){
 const html=await renderAdmin(route,'en',role,user);
 await writeFile(new URL(name+'.html',dir),prefix+html+'</div></body></html>');
 console.log('Rendered',name,html.length);
}

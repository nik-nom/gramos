import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {homeHeader,homeBottomLogo,homeFooter} from '../src/homepage.js';
const aId='11111111-1111-4111-8111-111111111111',bId='22222222-2222-4222-8222-222222222222';
let villages=[
 {id:aId,slug:'village-a',name_en:'Village A',name_mr:'गाव अ',status:'published',logo_url:'https://example.org/primary-a.png',site_settings:{footer_logos:['https://example.org/a-logo.png'],quote_mr:'Message A'}},
 {id:bId,slug:'village-b',name_en:'Village B',name_mr:'गाव ब',status:'published',logo_url:'https://example.org/primary-b.png',site_settings:{footer_logos:['https://example.org/b-logo.png'],quote_mr:'Message B'}}
];
let drafts=[];
let rpcs=[];
function query(table){
 const q={table,filters:[],patch:null};
 for(const k of ['eq','in'])q[k]=function(field,value){this.filters.push([field,value]);return this;};
 q.select=function(){return this;};q.order=function(){return this;};q.limit=function(){return this;};
 q.update=function(p){this.patch=p;return this;};
 q.maybeSingle=async function(){
  let data=table==='villages'?villages.find(v=>v.id===q.filters.find(x=>x[0]==='id')?.[1]):table==='village_site_drafts'?drafts.find(d=>d.village_id===q.filters.find(x=>x[0]==='village_id')?.[1]):null;
  return {data:data||null,error:null};
 };
 q.then=function(ok,fail){
  let data=table==='villages'?villages:table==='content_items'?[]:table==='platform_admins'?[{user_id:'super'}]:[];
  if(table==='villages'&&q.patch){
   data=levies();
   function levies(){const selected=villages.filter(v=>q.filters.every(([k,x])=>v[k]===x));selected.forEach(v=>Object.assign(v,q.patch));return selected.map(v=>({id:v.id}));}
  }else if(table==='villages'&&q.filters.length){data=villages.filter(v=>q.filters.every(([k,x])=>v[k]===x));}
  return Promise.resolve({data,error:null}).then(ok,fail);
 };
 return q;
}
const api={from:query,rpc(name,args){rpcs.push({name,args});if(name==='gramos_save_site_draft')drafts.push({village_id:args.p_village_id,changes:args.p_patch,revision:1,updated_at:'2026-11-21T10:00:00Z'});return Promise.resolve({data:name==='gramos_save_site_draft'?1:true,error:null})}};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'test-key'},supabase:{createClient:()=>api}};
globalThis.location={origin:'https://example.org',pathname:'/admin',search:''};
globalThis.document={getElementById:()=>({classList:{add(){}}}),querySelectorAll:()=>[],title:''};
globalThis.FormData=class{constructor(form){this.fields=form.fields||{}}get(k){return this.fields[k]??''}has(k){return Object.hasOwn(this.fields,k)}};
globalThis.confirm=()=>true;globalThis.prompt=()=> 'village-a';
const {renderAdmin,submitAdminForm,adminAction}=await import('../src/admin.js');
const {withGlobalLogos}=await import('../src/data.js');
const superAdmin={admin:true,ids:[],editorIds:[],reviewerIds:[]};
const editor={admin:false,ids:[aId],editorIds:[aId],reviewerIds:[]};
const user={email:'admin@example.org'};
// Visual content must remain isolated by village (header, footer, ticker, all routes).
assert(homeHeader(villages[0],'mr').includes('primary-a.png'));
assert(!homeHeader(villages[0],'mr').includes('primary-b.png'));
assert(homeBottomLogo(villages[0],'mr').includes('a-logo.png'));
assert(!homeBottomLogo(villages[0],'mr').includes('b-logo.png'));
assert(homeBottomLogo(villages[1],'mr').includes('b-logo.png'));
assert(!homeBottomLogo(villages[1],'mr').includes('a-logo.png'));
assert(homeHeader(villages[0],'mr').includes('Message A')&&!homeHeader(villages[0],'mr').includes('Message B'));
assert(homeFooter(villages[0],'mr').includes('Copyright © 2026'));
assert.equal(withGlobalLogos(villages[0],{updated_by:'someone',footer_logos:['https://example.org/hijack.png']}),villages[0]);
// Per-village header override and finite appearance options; ensure code path escapes input.
const aBrand={...villages[0],site_settings:{...villages[0].site_settings,nav_logo_url:'https://example.org/header-a.png',nav_logo_size:'84',nav_logo_fit:'contain',nav_logo_shape:'circle',nav_logo_position:'left'}};
const brandHTML=homeHeader(aBrand,'mr');
assert(brandHTML.includes('header-a.png')&&!brandHTML.includes('primary-b.png'));
assert(brandHTML.includes('sv-nav-logo-circle')&&brandHTML.includes('--gramos-nav-logo-size:84px')&&brandHTML.includes('object-fit:contain'));
const injected={...villages[0],site_settings:{nav_logo_size:'99999;background:red',nav_logo_shape:'weird',nav_logo_fit:'fill'}};
assert(!homeHeader(injected,'mr').includes('99999'));
assert(!homeHeader(injected,'mr').includes('background:red'));
// Website editor is focused by village; no global-logo control is offered.
const editorUI=await renderAdmin(['admin','villages',aId,'branding'],'en',editor,user);
assert(editorUI.includes('id="navbarBrandingForm"')&&editorUI.includes('name="nav_logo_url"'));
assert(editorUI.includes('name="nav_logo_size"')&&editorUI.includes('name="nav_logo_shape"'));
assert(editorUI.includes(`/admin/villages/${aId}/footer`));
assert(!editorUI.includes('/admin/branding'));
const footerUI=await renderAdmin(['admin','villages',aId,'footer'],'en',editor,user);
assert(footerUI.includes('id="footerForm"')&&footerUI.includes('footer_logo_11'));
assert(footerUI.includes('One village, all its pages')&&footerUI.includes('Save footer draft'));
assert(!footerUI.includes('All villages share one logo set'));
const dash=await renderAdmin(['admin'],'en',superAdmin,user);
assert(dash.includes('data-action="archive-site"')&&dash.includes('Remove website'));
assert(!dash.includes('/admin/branding'));
const nonSuperDash=await renderAdmin(['admin'],'en',editor,user);
assert(!nonSuperDash.includes('data-action="archive-site"'));
// Save a new navbar logo as a draft; must not change public village until publish.
await submitAdminForm({id:'navbarBrandingForm',dataset:{id:aId,saveMode:'draft'},fields:{nav_logo_url:'https://example.org/new-nav-a.png',nav_logo_size:'64',nav_logo_fit:'contain',nav_logo_shape:'square',nav_logo_position:'center'}},[],editor,()=>{},()=>{});
assert(rpcs.some(x=>x.name==='gramos_save_site_draft'&&x.args.p_village_id===aId&&x.args.p_patch.site_settings.nav_logo_url.includes('new-nav-a')));
assert(!homeHeader(villages[0],'mr').includes('new-nav-a'));
await assert.rejects(()=>submitAdminForm({id:'navbarBrandingForm',dataset:{id:bId,saveMode:'draft'},fields:{}},[],editor,()=>{},()=>{}),/cannot edit/);
// Footer draft must target only the chosen village.
await submitAdminForm({id:'footerForm',dataset:{id:aId,saveMode:'draft'},fields:{},querySelectorAll:()=>[{value:'https://example.org/new-footer-a.png'}]},[],editor,()=>{},()=>{});
assert(rpcs.some(x=>x.name==='gramos_save_site_draft'&&x.args.p_village_id===aId&&x.args.p_patch.site_settings.footer_logos?.[0]?.includes('new-footer-a')));
assert(homeBottomLogo(villages[1],'mr').includes('b-logo.png'));
await assert.rejects(()=>adminAction({dataset:{action:'archive-site',id:aId}},['admin','villages',aId],editor,()=>{},()=>{}),/Only Super Admin/);
await adminAction({dataset:{action:'archive-site',id:aId}},['admin'],superAdmin,()=>{},()=>{});
assert.equal(villages.find(x=>x.id===aId).status,'archived');assert.equal(villages.find(x=>x.id===bId).status,'published');
await adminAction({dataset:{action:'archive-site',id:aId}},['admin'],superAdmin,()=>{},()=>{});
assert.equal(villages.find(x=>x.id===aId).status,'draft','restore must not instantly republish');
const publicSource=readFileSync(new URL('../src/public.js',import.meta.url),'utf8');
assert(!publicSource.includes('withGlobalLogos') && publicSource.includes('withVillageDraft'));
const mainSource=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert(mainSource.includes("'navbarBrandingForm'")&&mainSource.includes('data-image-input'));
console.log('PASS v4.3: per-village navbar and 12 footer logos, no global overwrite, isolated announcement, navbar drafts, role checks, dashboard archive+restore and no unintended data mutation.');

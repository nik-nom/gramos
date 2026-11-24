import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const id='11111111-1111-4111-8111-111111111111';
let v={id,slug:'sample',status:'published',name_en:'Test village',name_mr:'गाव',hero_image_url:'https://example.test/old.png',home_sections:['gallery_notice'],site_settings:{quote_mr:'Old message',footer_logos:['https://example.test/logo.png']}};
const base={village_id:id,status:'published',sort_order:0};
const records=[{...base,id:'n1',kind:'notices',slug:'financial-a',title_en:'Financial report A',details:{notice_type:'financial'}},{...base,id:'n2',kind:'notices',slug:'notice-a',title_en:'General notice A',details:{notice_type:'notice'}},{...base,id:'s1',kind:'officials',slug:'staff-a',title_en:'Staff person A',details:{about_group:'staff'}},{...base,id:'c1',kind:'committee_groups',slug:'health',title_en:'Health Committee'}];
const writes=[],drafts=[];const api={from(table){const q={select(){return q},eq(){return q},order(){return q},maybeSingle:async()=>({data:table==='villages'?v:null,error:null}),update(p){writes.push(p);v={...v,...p};return q},then(ok,fail){return Promise.resolve({data:table==='content_items'?records:table==='villages'?[v]:[],error:null}).then(ok,fail)}};return q},rpc(name,args){drafts.push(args.p_patch);return Promise.resolve({data:1,error:null})}};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'public-test'},supabase:{createClient:()=>api}};
globalThis.location={origin:'https://example.test',pathname:'/admin/villages/'+id,search:''};
globalThis.document={title:'',getElementById:()=>({classList:{add(){}}})};
globalThis.FormData=class{constructor(f){this.f=f.fields||{}}get(k){return this.f[k]??''}has(k){return Object.hasOwn(this.f,k)}};
const {renderAdmin,submitAdminForm}=await import('../src/admin.js');
const role={admin:true,ids:[]},user={email:'test@example.test'};
async function screen(page,kind='',search='',lang='en',access=role){location.search=search;return renderAdmin(['admin','villages',id,page,...(kind?[kind]:[])],lang,access,user)}
for(const page of ['home','about','services','schemes','projects','news','notices','gallery','contact']){
 const h=await screen(page);assert(h.includes('gx63-page-hub'));assert(!h.includes('id="homeForm"'));assert(!h.includes('id="contentForm"'));
 const mr=await screen(page,'','','mr');assert(mr.includes('काय बदलायचे आहे?'));
}
const home=await screen('home');assert(home.includes('part=banner')&&home.includes('part=order')&&home.includes('part=announcement'));
const banner=await screen('home','','?view=settings&part=banner');assert(banner.includes('id="homeForm"')&&banner.includes('name="hero_image_url"')&&!banner.includes('gx63-page-hub'));
const about=await screen('about');assert(about.includes('category=staff')&&about.includes('category=representatives')&&about.includes('committee_groups'));
const notices=await screen('notices');for(const cat of ['notice','financial','rti','resolutions'])assert(notices.includes('category='+cat));
let list=await screen('content','notices','?from=notices&category=financial');assert(list.includes('Financial report A')&&!list.includes('General notice A')&&!list.includes('Bench Order'));
list=await screen('content','notices','?from=notices&category=rti');assert(list.includes('Bench Order')&&!list.includes('Financial report A'));
const staff=await screen('content','officials','?from=about&category=staff&new=1');assert(staff.includes('value="staff" selected'));
const committee=await screen('content','committees','?from=about&new=1');assert(committee.includes('name="committee_key" required')&&committee.includes('Health Committee'));
const contact=await screen('contact');assert(contact.includes('contactTab=form')&&contact.includes('/submissions'));
const noAccess=await screen('home','','','en',{admin:false,ids:[id],editorIds:[]});assert(!noAccess.includes('gx63-page-hub'));
await submitAdminForm({id:'homeForm',dataset:{id,homePart:'banner'},fields:{hero_image_url:'https://example.test/new.png'},querySelectorAll:()=>{throw Error('must not read other panel')}},[],role,()=>{},()=>{});
assert.deepEqual(writes[0],{hero_image_url:'https://example.test/new.png'});assert.equal(v.site_settings.quote_mr,'Old message');assert.deepEqual(v.home_sections,['gallery_notice']);
await submitAdminForm({id:'homeForm',dataset:{id,homePart:'announcement',saveMode:'draft'},fields:{quote_mr:'Draft message'},querySelectorAll:()=>{throw Error('must not read other panel')}},[],role,()=>{},()=>{});
assert.deepEqual(drafts[0],{site_settings:{quote_mr:'Draft message'}});
if(process.env.GRAMOS_TEST_HTML){writeFileSync('/tmp/gram63-hub.html',home);writeFileSync('/tmp/gram63-banner.html',banner);writeFileSync('/tmp/gram63-staff.html',staff);}
clearTimeout(window.__toastTimer);
console.log('PASS v6.3: nine bilingual page menus, separate homepage edit screens, category isolation and defaults, committee picker, citizen-form links, reviewer protection and isolated draft/live updates.');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const id='11111111-1111-4111-8111-111111111111';
let v={id,slug:'test',status:'published',name_mr:'गाव',name_en:'Village',site_settings:{},home_sections:['gallery_notice','leaders_schemes']};let records=[],uploads=[];
const api={from(table){let filters={},payload,mode='select';const q={select(){return q},eq(k,val){filters[k]=val;return q},order(){return q},maybeSingle:async()=>({data:v,error:null}),insert(p){mode='insert';payload=p;return q},update(p){mode='update';payload=p;return q},then(ok,bad){let data;if(mode==='insert'){const rec={...payload,id:'rec-'+records.length};records.push(rec);data=[rec]}else if(mode==='update'){if(table==='villages'){v={...v,...payload};data=[v]}else{records=records.map(x=>x.id===filters.id?{...x,...payload}:x);data=records.filter(x=>x.id===filters.id)}}else{data=table==='content_items'?records:[v]}return Promise.resolve({data,error:null}).then(ok,bad)}};return q},storage:{from(bucket){return {upload:async(path)=>{uploads.push({bucket,path});return {error:null}},getPublicUrl:path=>({data:{publicUrl:`https://mock.supabase.co/storage/v1/object/public/${bucket}/${path}`}})}}}};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'public-test'},supabase:{createClient:()=>api}};
globalThis.location={origin:'https://example.test',pathname:'/admin/villages/'+id,search:'',href:'https://example.test/'};globalThis.document={title:'',getElementById:()=>({classList:{add(){}}})};globalThis.FormData=class{constructor(f){this.fields=f.fields||{}}get(k){return this.fields[k]??''}has(k){return Object.hasOwn(this.fields,k)}};
const {renderAdmin,imageUpload,submitAdminForm}=await import('../src/admin.js');const role={admin:true,ids:[]};const user={email:'test@example.test'};
async function screen(kind,search=''){location.search=search;return renderAdmin(['admin','villages',id,'content',kind],'en',role,user)}
for(const [kind,slug] of [['officials','official-1'],['officials','official-3'],['leaders','minister-2'],['banners','banner-slot-1'],['gallery','gallery-slot-1']]){
 assert((await screen(kind)).includes('template='+slug));const html=await screen(kind,'?template='+slug);assert(html.includes('data-record-photo')&&html.includes('data-image-input')&&html.includes(`value="${slug}"`));
}
async function uploadAndSave(kind,slug,edit='',extra={}){const target={value:''},preview={hidden:true,src:''},empty={hidden:false};const form={id:'contentForm',dataset:{id,kind,edit},fields:{slug,title_mr:'नवीन माहिती',title_en:'Actual '+kind,sort_order:'0',...extra},querySelector(sel){return sel.includes('name=')?target:sel==='[data-record-photo]'?preview:sel==='[data-record-photo-empty]'?empty:null}};await imageUpload({files:[{type:'image/webp',size:200,name:'new.webp'}],dataset:{target:'image_url',village:id},closest:()=>form});assert(target.value.startsWith('https://mock.supabase.co/'));assert.equal(preview.src,target.value);assert.equal(preview.hidden,false);form.fields.image_url=target.value;await submitAdminForm(form,[],role,()=>{},()=>{});return target.value;}
const first=await uploadAndSave('officials','official-1','',{about_group:'representatives'});const record=records[0];const second=await uploadAndSave('officials','official-1',record.id,{about_group:'representatives'});assert.notEqual(first,second);assert.equal(records.length,1);assert.equal(records[0].image_url,second);
const leader=await uploadAndSave('leaders','minister-2');const slide=await uploadAndSave('banners','banner-slot-2');const gallery=await uploadAndSave('gallery','gallery-slot-1','',{gallery_type:'meetings'});
assert(uploads.every(x=>x.bucket==='village-media'&&x.path.startsWith(id+'/')));
await submitAdminForm({id:'homeForm',dataset:{id,homePart:'banner'},fields:{hero_image_url:'https://example.test/new-banner.webp'}},[],role,()=>{},()=>{});
await submitAdminForm({id:'navbarBrandingForm',dataset:{id},fields:{nav_logo_url:'https://example.test/new-logo.webp',nav_logo_size:'72',nav_logo_mobile_size:'48',nav_logo_fit:'contain',nav_logo_shape:'rounded',nav_logo_position:'center'}},[],role,()=>{},()=>{});
location.search='';
for(const root of ['..','../apps/admin','../apps/public']){
 const {renderShamvadiHomepage:home}=await import(`${root}/src/homepage.js`);
 const {renderAboutPage:about}=await import(`${root}/src/about.js`);
 const {renderGalleryPage}=await import(`${root}/src/gallery.js`);
 const h=home(v,records,'mr',false);for(const url of [second,leader,slide,gallery,'new-banner.webp','new-logo.webp'])assert(h.includes(url),url);
 assert(!h.includes(first));assert(!h.includes('official-1.webp'));assert(!h.includes('minister-2.webp'));assert(about(v,records,'mr').includes(second));assert(renderGalleryPage(v,records,'mr').includes(gallery));
 console.log('PASS',root,'simulated uploaded portrait/banner/logo/gallery replaces default on published render');
}
clearTimeout(window.__toastTimer);

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderBeneficiariesPage} from '../src/beneficiaries.js';
import {homeHeader,homeFooter,homeBottomLogo} from '../src/homepage.js';
import {SEO_PAGES,resolveSEO} from '../src/seo.js';
import {htmlWithMetadata,xmlSitemap,routeFromPath} from '../src/seo-server.mjs';
import handler from '../api/beneficiary-file.js';
const vid='11111111-1111-4111-8111-111111111111',iid='22222222-2222-4222-8222-222222222222',fid='33333333-3333-4333-8333-333333333333';
const file_path=`${vid}/${fid}.xlsx`;
const v={id:vid,slug:'shirpur',name_mr:'शिरपूर',logo_url:'https://images.example/logo.png',status:'published',site_settings:{beneficiaries_page_title_mr:'लाभार्थी यादी'}};
const published={id:iid,village_id:vid,kind:'beneficiary_lists',slug:'pm-kisan',title_mr:'पीएम किसान लाभार्थी',status:'published',details:{file_path,public_file_approved:true}};
const data=[published,{...published,id:'another',slug:'waiting',title_mr:'यादी प्रतिक्षेत',details:{file_path,public_file_approved:false}},{...published,id:'draft',status:'draft',title_mr:'Secret hidden'}, {kind:'schemes',status:'published',slug:'water',title_mr:'जल जीवन मिशन'}];
const h=renderBeneficiariesPage(v,data,'mr');
assert.match(h,/लाभार्थी यादी/);assert.match(h,/पीएम किसान लाभार्थी/);assert.match(h,/Excel यादी डाउनलोड करा/);assert.match(h,/यादी लवकरच उपलब्ध/);assert.match(h,/जल जीवन मिशन/);
assert(!h.includes('Secret hidden'));assert(!h.includes(file_path));assert(!h.includes('<script'));
assert.match(renderBeneficiariesPage(v,[{...published,title_mr:'<script>alert(1)</script>'}],'mr'),/&lt;script&gt;/);
assert(!renderBeneficiariesPage(v,[{...published,details:{file_path:`other/${fid}.xlsx`,public_file_approved:true}}],'mr').includes('/api/beneficiary-file?'));
assert.match(renderBeneficiariesPage({...v,id:'demo',slug:'demo'},data,'mr'),/\/demo\/schemes/);
const oldLocation=globalThis.location;
globalThis.location={origin:'https://site.example.in'};
try{
 const header=homeHeader(v,'mr');const footer=homeFooter(v,'mr');
 assert.match(header,/images.example\/logo.png/);assert.equal(homeBottomLogo(v,'mr'),'','No village name/emblem should appear without an explicitly saved bottom logo');assert(!footer.includes('sv-page-logo')); 
 assert.match(header,/\/v\/shirpur\/schemes/);assert.match(footer,/\/v\/shirpur\/beneficiaries/);
}finally{globalThis.location=oldLocation;}
assert(SEO_PAGES.includes('beneficiaries'));
assert.equal(routeFromPath('/v/shirpur/beneficiaries')?.page,'beneficiaries');
const seo=resolveSEO(v,'beneficiaries',{origin:'https://site.example.in'});
assert.match(seo.title,/लाभार्थी यादी/);assert.equal(seo.icon,v.logo_url);
const xml=xmlSitemap({villages:[v],origin:'https://site.example.in'});
assert.match(xml,/\/v\/shirpur\/beneficiaries/);
const pageHTML=htmlWithMetadata(readFileSync(new URL('../index.html',import.meta.url),'utf8'),seo);
assert.match(pageHTML,/<link rel="icon" href="https:\/\/images.example\/logo.png"/);
assert.equal((pageHTML.match(/rel="icon"/g)||[]).length,1);
const r=()=>({statusCode:200,headers:{},setHeader(k,val){this.headers[k.toLowerCase()]=val;},end(body){this.body=body;return this;}});
const old={fetch:globalThis.fetch,url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY,service:process.env.SUPABASE_SERVICE_ROLE_KEY};
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_example';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-secret';
let approved=true,signCalls=0;
globalThis.fetch=async (input,opts={})=>{
 const url=String(input);
 if(url.includes('rest/v1/villages'))return {ok:true,json:async()=>[v]};
 if(url.includes('rest/v1/content_items'))return {ok:true,json:async()=>[{...published,details:{file_path,public_file_approved:approved}}]};
 if(url.includes('/storage/v1/object/sign/beneficiary-files/')){signCalls++;return {ok:true,json:async()=>({signedURL:`/object/sign/beneficiary-files/${file_path}?token=fake`})};}
 throw Error('Unexpected fetch '+url);
};
try{
 const invalid=r();await handler({method:'GET',query:{v:'../evil',id:iid}},invalid);assert.equal(invalid.statusCode,400);assert.equal(signCalls,0);
 approved=false;const unapproved=r();await handler({method:'GET',query:{v:'shirpur',id:iid}},unapproved);assert.equal(unapproved.statusCode,404);assert.equal(signCalls,0);
 approved=true;const ok=r();await handler({method:'GET',query:{v:'shirpur',id:iid}},ok);assert.equal(ok.statusCode,302);assert.equal(signCalls,1);assert.match(ok.headers.location,/storage\/v1\/object\/sign\/beneficiary-files/);assert.equal(ok.headers['cache-control'],'private, no-store');
 const post=r();await handler({method:'POST',query:{v:'shirpur',id:iid}},post);assert.equal(post.statusCode,405);
}finally{globalThis.fetch=old.fetch;for(const [k,v] of [['SUPABASE_URL',old.url],['SUPABASE_PUBLISHABLE_KEY',old.key],['SUPABASE_SERVICE_ROLE_KEY',old.service]])v===undefined?delete process.env[k]:process.env[k]=v;}
const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');const app=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');const db=readFileSync(new URL('../database/13_v35_beneficiary_workbooks.sql',import.meta.url),'utf8');
assert.match(admin,/data-image-input data-target="logo_url"/);assert.match(admin,/data-excel-input/);assert.match(app,/excelUpload/);assert.match(db,/beneficiary_lists/);assert.match(db,/public,\s*file_size_limit/);assert.match(db,/app_private.can_edit_village/);
console.log('PASS v3.5: village logo everywhere, page SEO, draft/privacy safeguards, new editable scheme cards, private Excel links, signed-download checks');

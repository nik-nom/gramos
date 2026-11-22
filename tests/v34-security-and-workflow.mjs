import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {socialUrl,validateSocialSettings} from '../src/social.js';
import {renderPageElements} from '../src/page-elements.js';
import submit from '../api/submit.js';
import attachment from '../api/attachment.js';

// Global official links are platform-specific and shared on every page through site_settings.
const valid={instagram_url:'https://www.instagram.com/somevillage/',facebook_url:'https://www.facebook.com/somevillage',youtube_url:'https://youtu.be/abc',linkedin_url:'https://www.linkedin.com/company/village',whatsapp_url:'https://wa.me/919876543210'};
for(const [field,url] of Object.entries(valid))assert(socialUrl(field,url),`expected valid ${field}`);
for(const [field,url] of Object.entries({
 instagram_url:'https://instagram.com.evil.example/@village',
 whatsapp_url:'https://www.instagram.com/village',
 linkedin_url:'javascript:alert(1)',
 facebook_url:'https://facebook.com@evil.example/',
 youtube_url:'https://youtube.com:443.evil.example/watch',
}))assert.equal(socialUrl(field,url),'',`reject wrong-platform ${field}`);
validateSocialSettings(valid);
assert.throws(()=>validateSocialSettings({instagram_url:'https://evil.example/'}));

// Page editor can add content to separate pages without script injection or cross-page leaks.
const blocks=[{status:'published',kind:'page_elements',title_mr:'नवी माहिती',body_mr:'<img src=x onerror=alert(1)>',details:{page_target:'about',element:'text'},sort_order:2},
 {status:'published',kind:'page_elements',title_mr:'सुरक्षित लिंक',external_url:'javascript:alert(1)',details:{page_target:'about',element:'link'},sort_order:3},
 {status:'draft',kind:'page_elements',title_mr:'Hidden',body_mr:'Hidden',details:{page_target:'about',element:'text'}}];
const html=renderPageElements(blocks,'about','mr');
assert.match(html,/नवी माहिती/);assert(!html.includes('<img src=x'));assert(!html.includes('javascript:'));assert(!html.includes('Hidden'));
assert.equal(renderPageElements(blocks,'services','mr'),'');

function response(){return {code:0,headers:{},body:null,setHeader(k,v){this.headers[k]=v;return this;},status(n){this.code=n;return this;},json(d){this.body=d;return this;}}}
const oldFetch=globalThis.fetch;
const oldEnv={...process.env};
try{
 Object.assign(process.env,{SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'not-a-real-key',TURNSTILE_SECRET_KEY:'test-secret',SITE_URL:'https://gramos.example'});
 const village='11111111-1111-4111-8111-111111111111';
 const validBody={village_id:village,turnstile_token:'123',sender_name:'Visitor',sender_email:'visitor@example.test',subject:'complaint',message:'The road outside our office has developed a dangerous pothole.',attachment:null,website:''};
 const requests=[];
 globalThis.fetch=async (url,opts={})=>{
  const u=String(url);requests.push(u);
  if(u.includes('siteverify'))return {ok:true,json:async()=>({success:true,hostname:'gramos.example'})};
  if(u.includes('/rest/v1/villages'))return {ok:true,json:async()=>[{id:village}]};
  if(u.includes('/rest/v1/village_domains'))return {ok:true,json:async()=>[]};
  if(u.includes('/rest/v1/submissions')&&opts.method==='POST')return {ok:true,json:async()=>[]};
  if(u.includes('/rest/v1/submissions'))return {ok:true,json:async()=>[]};
  throw Error('Unexpected fetch '+u);
 };
 const res=response();await submit({method:'POST',headers:{},body:validBody},res);
 assert.equal(res.code,201,JSON.stringify(res.body));assert.equal(res.body.ok,true);
 assert(requests.some(url=>url.includes('siteverify'))&&requests.some(url=>url.includes('submissions')));
 const bad=response();await submit({method:'POST',headers:{},body:{...validBody,website:'spam-site'}},bad);assert.equal(bad.code,400);
 const big=response();await submit({method:'POST',headers:{'content-length':'9000000'},body:validBody},big);assert.equal(big.code,413);
 globalThis.fetch=async u=>String(u).includes('siteverify')?{ok:true,json:async()=>({success:true,hostname:'wrong.example'})}:String(u).includes('/rest/v1/village_domains')?{ok:true,json:async()=>[]}:(()=>{throw Error('No further database access is allowed for an unrecognized hostname')})();
 const wrong=response();await submit({method:'POST',headers:{},body:validBody},wrong);assert.equal(wrong.code,403);
 // Mock signed private attachment, only members for that village and explicit roles.
 const user='22222222-2222-4222-8222-222222222222', submissionId='33333333-3333-4333-8333-333333333333';
 let memberLookup='';
 globalThis.fetch=async (url,opts={})=>{
  const u=String(url);
  if(u.includes('/auth/v1/user'))return {ok:true,json:async()=>({id:user})};
  if(u.includes('rest/v1/submissions'))return {ok:true,json:async()=>[{village_id:village,attachment_path:`${village}/photo.jpg`}]};
  if(u.includes('rest/v1/platform_admins'))return {ok:true,json:async()=>[]};
  if(u.includes('rest/v1/village_members')){memberLookup=u;return {ok:true,json:async()=>[{user_id:user,role:'reviewer'}]};}
  if(u.includes('/storage/v1/object/sign/'))return {ok:true,json:async()=>({signedURL:'/object/sign/visitor-uploads/xyz'})};
  throw Error('Unexpected attachment request '+u);
 };
 const signed=response();await attachment({method:'GET',query:{submission_id:submissionId},headers:{authorization:'Bearer fake.jwt'}},signed);
 assert.equal(signed.code,200,JSON.stringify(signed.body));assert.match(memberLookup,/role=in/);assert.match(signed.body.url,/visitor-uploads/);
 const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
 assert.match(admin,/reviewerOnly/);assert.match(admin,/staffAccessForm/);assert.match(admin,/Add element to this page/);assert.match(admin,/readOnly/);
 const sql=readFileSync(new URL('../database/12_v34_reviewer_and_page_elements.sql',import.meta.url),'utf8');
 assert.match(sql,/role IN \('owner','editor'\)/);assert.match(sql,/can_review_submissions/);
 console.log('PASS v3.4: platform-specific links, shared settings, XSS-safe elements, reviewer access and Cloudflare submission flow.');
}finally{
 globalThis.fetch=oldFetch;
 for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];
 Object.assign(process.env,oldEnv);
}

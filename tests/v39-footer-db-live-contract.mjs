import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {homeBottomLogo,homeFooter,socialMediaHeading,footerLegalLine} from '../src/homepage.js';
import {renderContactPage} from '../src/contact.js';

const demo=getDemo();
const savedVillage={...demo.village,id:'11111111-1111-4111-8111-111111111111',slug:'example-village',
 site_settings:{...demo.village.site_settings,footer_logo_url:'https://cdn.example.org/brand.png',footer_social_heading_mr:'समाज माध्यमे',copyright_mr:'',credit_mr:''}};
globalThis.location={origin:'https://example.org',pathname:'/v/example-village',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'sb_publishable_test',turnstileSiteKey:''}};
const logo=homeBottomLogo(savedVillage,'mr');
assert.match(logo,/sv-page-logo-band/);
assert.match(logo,/cdn\.example\.org\/brand\.png/);
assert(!logo.includes('<span>'),'No village name printed under logo');
assert.equal(socialMediaHeading(savedVillage,'mr'),'समाजमाध्यमे');
assert.match(homeFooter(savedVillage,'mr'),/>समाजमाध्यमे<\/a>/);
assert.match(renderContactPage(savedVillage,'mr'),/>समाजमाध्यमे<\/button>/);
assert.match(renderContactPage(savedVillage,'mr'),/<h2>समाजमाध्यमे<\/h2>/);
assert.equal(footerLegalLine(savedVillage,'mr').credit,'');
assert.match(homeFooter(savedVillage,'mr'),/Copyright © 2026 · V Swaraj Gramsoft and Software Private Limited™/);

// Simulated Supabase persistence: the actual admin form updates site_settings,
// and the same saved values feed public rendering on the next load.
const updates=[];
let villageRecord={...savedVillage};
const chain=()=>({eq(){return this;},select(){return this;},then(ok,fail){return Promise.resolve({data:[{id:villageRecord.id}],error:null}).then(ok,fail);}});
const api={from(table){return {select(){return {eq(){return this;},maybeSingle:async()=>({data:villageRecord,error:null})}},update(payload){updates.push({table,payload});villageRecord={...villageRecord,...payload};return chain();}}}};
window.supabase={createClient:()=>api};
const toast={className:'',textContent:'',classList:{add(){}}};
globalThis.document={getElementById:()=>toast,querySelectorAll:()=>[]};
globalThis.FormData=class { constructor(form){this.fields=form.fields;}get(key){return this.fields[key]??'';}};
const {submitAdminForm,renderAdmin}=await import('../src/admin.js');
const fields={slug:'example-village',name_mr:'उदाहरण गाव',name_en:'Example Village',template_style:'classic',
  footer_logo_url:'https://cdn.example.org/brand.png',footer_social_heading_mr:'समाजमाध्यमे',
  copyright_mr:'© 2026 · चाचणी गावाची अधिकृत वेबसाईट.',
  credit_mr:'रचना, विकास आणि देखभाल — संपादनयोग्य श्रेय'};
await submitAdminForm({id:'settingsForm',dataset:{id:savedVillage.id},fields},[],{admin:true},()=>{},()=>{});
assert.equal(updates.length,1);
assert.equal(updates[0].table,'villages');
assert.notEqual(updates[0].payload.site_settings.copyright_mr,fields.copyright_mr);
assert.notEqual(updates[0].payload.site_settings.credit_mr,fields.credit_mr);
assert.equal(updates[0].payload.site_settings.footer_social_heading_mr,'समाज माध्यमे','Legacy village setting is kept without changing real data');
const liveFooter=homeFooter(villageRecord,'mr');
assert(!liveFooter.includes(fields.copyright_mr));
assert(!liveFooter.includes(fields.credit_mr));
assert(liveFooter.includes('V Swaraj Gramsoft and Software Private Limited'));
assert(!homeBottomLogo(villageRecord,'mr').includes('<span>'));
const dangerous={...villageRecord,site_settings:{...villageRecord.site_settings,
 copyright_mr:'<img src=x onerror=alert(1)>',credit_mr:'<script>alert(1)</script>'}};
assert(!homeFooter(dangerous,'mr').includes('<script>'));
assert(!homeFooter(dangerous,'mr').includes('<img src=x'));
assert(!homeFooter(dangerous,'mr').includes('&lt;script&gt;'),'Old village credit is no longer rendered');
const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
assert(admin.includes('platformLegalNotice()'));
assert(!admin.includes("['footer_social_heading_mr'"));
assert(admin.includes('payload.site_settings={...(existing.site_settings||{})'));
const pub=readFileSync(new URL('../src/public.js',import.meta.url),'utf8');
assert(pub.includes('villageBySlug(route[1])'),'Public pages must fetch their own village from Supabase');
assert(pub.includes('homeBottomLogo(v,lang)')&&pub.includes('homeFooter(v,lang)'));
clearTimeout(window.__toastTimer);
console.log('PASS v3.9 compatibility: legacy data preserved, fixed company legal notice, Marathi social label, village Supabase fetch path.');

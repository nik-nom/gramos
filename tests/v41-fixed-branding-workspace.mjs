import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {homeHeader,homeFooter,homeBottomLogo,homeTicker,footerLegalLine} from '../src/homepage.js';
import {renderContactPage} from '../src/contact.js';
import {PLATFORM_LEGAL,platformLegalNotice} from '../src/branding.js';

const {village:demo}=getDemo();
const base={...demo,id:'11111111-1111-4111-8111-111111111111',status:'published',site_settings:{...demo.site_settings}};
const a={...base,slug:'shirpur',name_mr:'शिरपूर',name_en:'Shirpur',logo_url:'https://cdn.example.org/a-primary.png',site_settings:{...base.site_settings,footer_logos:[],footer_logo_url:'',quote_mr:'फक्त गाव अ ची सूचना',copyright_mr:'Fake © 2028',credit_mr:'Injected'}};
const b={...base,id:'22222222-2222-4222-8222-222222222222',slug:'lohegaon',name_mr:'लोहेगाव',name_en:'Lohegaon',site_settings:{...base.site_settings,footer_logos:['https://cdn.example.org/sponsor-b.png','https://cdn.example.org/sponsor-c.png'],quote_mr:'फक्त गाव ब ची सूचना',copyright_mr:'Bogus © 2032'}};

globalThis.location={origin:'https://gramos.example.org',pathname:'/v/shirpur',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'publishable-test',turnstileSiteKey:''}};
globalThis.document={title:''};

assert.equal(PLATFORM_LEGAL.year,2026);
assert.deepEqual(PLATFORM_LEGAL.numbers,['9923227879','9423227879']);
for(const v of [a,b]){
 const footer=homeFooter(v,'mr');
 assert(footer.includes(platformLegalNotice()));
 assert(footer.includes('V Swaraj Gramsoft and Software Private Limited™'));
 assert(footer.includes('Jalna')&&footer.includes('9923227879')&&footer.includes('9423227879'));
 assert(!footer.includes('Fake © 2028')&&!footer.includes('Bogus © 2032')&&!footer.includes('Injected'));
 assert.equal(footerLegalLine(v,'mr').notice,footerLegalLine(v,'en').notice);
 assert(homeFooter(v,'en').includes(platformLegalNotice()));
 assert(footer.includes('>समाजमाध्यमे</a>'));
 assert(renderContactPage(v,'mr').includes('>समाजमाध्यमे</button>'));
}
assert.equal(homeBottomLogo(a,'mr'),'','A village with no bottom-logo uploads must not show name or placeholder emblem');
assert(!homeBottomLogo(b,'mr').includes('लोहेगाव'),'Bottom logo names must not be exposed as alt fallback text');
assert(!homeBottomLogo(b,'en').includes('Lohegaon'));
assert.equal((homeBottomLogo(b,'mr').match(/class="sv-page-logo"/g)||[]).length,2);
assert(!homeBottomLogo(b,'mr').includes('a-primary.png'),'A separate village logo must not appear in other village bottom logos');
assert(homeHeader(a,'mr').includes('फक्त गाव अ ची सूचना'));
assert(!homeHeader(a,'mr').includes('फक्त गाव ब ची सूचना'));
assert(homeHeader(b,'mr').includes('फक्त गाव ब ची सूचना'));
assert(!homeHeader(b,'mr').includes('फक्त गाव अ ची सूचना'));
assert.equal((homeHeader(a,'mr').match(/class="sv-ticker-track"/g)||[]).length,1);
assert.equal(homeHeader(a,'mr').includes(homeTicker(a,'mr')),true);

const cfg={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'publishable-test'}};
globalThis.window={...cfg,supabase:{createClient:()=>({from:()=>({select(){return this},eq(){return this},order(){return this},maybeSingle:async()=>({data:a,error:null}),then(ok,fail){return Promise.resolve({data:[],error:null}).then(ok,fail)}})})}};
const {renderAdmin}=await import('../src/admin.js');
const role={admin:true,ids:[],editorIds:[]},user={email:'admin@example.org'};
const overview=await renderAdmin(['admin','villages',a.id,'overview'],'mr',role,user);
const footerEditor=await renderAdmin(['admin','villages',a.id,'footer'],'en',role,user);
location.search='?view=settings&part=banner';
const homeEditor=await renderAdmin(['admin','villages',a.id,'home'],'mr',role,user);
location.search='';
assert(overview.includes('admin-overview-grid')&&overview.includes('Workspace overview')===false);
assert.equal((overview.match(/class="admin-overview-card"/g)||[]).length,13);
assert(overview.includes('फक्त गाव अ ची सूचना')&&!overview.includes('फक्त गाव ब ची सूचना'));
assert(footerEditor.includes(platformLegalNotice()));
assert(footerEditor.includes('admin-legal-fixed')&&footerEditor.includes('id="footerForm"'));
assert(!footerEditor.includes('name="copyright_mr"')&&!footerEditor.includes('name="copyright_en"'));
assert(!footerEditor.includes('name="credit_mr"')&&!footerEditor.includes('name="footer_social_heading_mr"'));
assert(footerEditor.includes('admin-footer-logo-placeholder'));
assert(homeEditor.includes('name="quote_mr"'));
assert(homeEditor.includes('data-action="preview-refresh"'));
assert(homeEditor.includes('admin-save-hint'));
assert(homeEditor.includes('Other website pages')===false,'Marathi admin should show Marathi menu');

const mainSource=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert(mainSource.includes("'navbarBrandingForm','homeForm','footerForm','seoSettingsForm'"),'Homepage and footer Save must be routed into submitAdminForm');
assert(mainSource.includes("app.addEventListener('input'"),'Unsaved-change and inline logo preview handler must be installed');
assert(mainSource.includes("else await submitAdminForm(form,currentRoute,role,navigate,render)"),'Shared Supabase save handler must be called');
clearTimeout(window.__toastTimer);
console.log('PASS v4.1: fixed © 2026 imprint, both phone numbers, logo-only strip, two village isolation, Marathi contact/footer, shared ticker, focused admin and working save dispatch contract.');

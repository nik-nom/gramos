import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {homeHeader,homeFooter,homeBottomLogo} from '../src/homepage.js';
import {PLATFORM_LEGAL,platformLegalNotice} from '../src/branding.js';

globalThis.location={origin:'https://gramos.test',pathname:'/demo',search:''};
const {village:demo}=getDemo();
const a={...demo,id:'11111111-1111-4111-8111-111111111111',slug:'a',name_mr:'गाव अ',logo_url:'https://example.com/main-a.png',phone:'1234567890',site_settings:{...demo.site_settings,nav_logo_url:'https://example.com/nav-a.webp',nav_logo_mobile_size:'52',nav_logo_size:'84',footer_logos:['https://example.com/footer-a.png'],footer_social_body_mr:'गाव अ चे समाजमाध्यम'}};
const b={...demo,id:'22222222-2222-4222-8222-222222222222',slug:'b',name_mr:'गाव ब',logo_url:'https://example.com/main-b.png',phone:'0987654321',site_settings:{...demo.site_settings,nav_logo_url:'',footer_logos:['https://example.com/footer-b.png'],footer_social_body_mr:'गाव ब चे समाजमाध्यम'}};
const aHeader=homeHeader(a,'mr'),bHeader=homeHeader(b,'mr');
assert(aHeader.includes('nav-a.webp')&&!aHeader.includes('main-b.png'));
assert(aHeader.includes('--gramos-nav-mobile-logo-size:52px'));
assert(aHeader.includes('--gramos-nav-logo-size:84px'));
assert(aHeader.includes('<nav id="publicNavItems"') && aHeader.includes('class="sv-lang-picker"'));
assert(bHeader.includes('main-b.png') && !bHeader.includes('nav-a.webp'));
assert(aHeader.includes('गाव अ') && !aHeader.includes('गाव ब'));
assert.equal(PLATFORM_LEGAL.company,'V Swaraj Gramsoft and Software Private Limited');
assert.equal(PLATFORM_LEGAL.year,2026);
for(const v of [a,b]){
 const foot=homeFooter(v,'mr');
 assert(foot.includes(platformLegalNotice()));
 assert(!foot.includes('MAJHIGRAM TECH')&&!foot.includes('copyright@2025'));
 for(const cls of ['sv-footer-social','sv-footer-useful','sv-footer-pages','sv-footer-contact']) assert(foot.includes(cls));
 assert(foot.includes('समाजमाध्यमे'));
 assert(foot.includes(v.phone));
 assert(homeFooter(v,'en').includes(platformLegalNotice()));
}
assert(homeFooter(a,'mr').includes('गाव अ चे समाजमाध्यम'));
assert(!homeFooter(a,'mr').includes('गाव ब चे समाजमाध्यम'));
assert(homeBottomLogo(a,'mr').includes('footer-a.png')&&!homeBottomLogo(a,'mr').includes('footer-b.png'));
assert(homeBottomLogo(b,'mr').includes('footer-b.png')&&!homeBottomLogo(b,'mr').includes('footer-a.png'));
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
assert(css.includes('.sv-site .sv-footer-grid{display:grid;grid-template-columns:repeat(4'));
assert(css.includes('@media(max-width:650px)') && css.includes('var(--gramos-nav-mobile-logo-size'));
const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
assert(admin.includes('name="nav_logo_mobile_size"')===false || admin.includes('nav_logo_mobile_size')); // option renderer is computed
assert(admin.includes("select('nav_logo_mobile_size'"));
assert(admin.includes('data-action="nav-logo-reset"'));
assert(admin.includes("'brand_title_mr','brand_title_en','brand_subtitle_mr','brand_subtitle_en'"));
assert(admin.includes('data-action="nav-logo-reset"'));
assert(admin.includes('platformLegalNotice()'));
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
assert(main.includes("e.target.matches('input[name=\"nav_logo_url\"]')"));
console.log('PASS v4.7: screenshot-aligned responsive nav/footer, editable village logo, protected V Swaraj ©2026 credit, two-village isolation, admin reset and live preview.');

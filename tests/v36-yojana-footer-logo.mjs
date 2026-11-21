import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {renderSchemesPage,renderYojanaBeneficiariesPage} from '../src/schemes.js';
import {homeHeader,homeFooter,homeBottomLogo} from '../src/homepage.js';
import {renderBeneficiariesPage} from '../src/beneficiaries.js';

const oldLocation=globalThis.location;
globalThis.location={origin:'https://gramos.example',pathname:'/demo/schemes',search:''};
try {
 const {village,items}=getDemo();
 const classic=renderSchemesPage(village,items,'mr');
 assert(classic.includes('href="/demo/beneficiaries"'),'Beneficiaries must be a Yojana subpage');
 assert(classic.includes('लाभार्थी यादी'),'Yojana subpage title must show');
 assert.equal((classic.match(/role="tab"/g)||[]).length,3,'Existing Yojana filters must remain usable');
 const nested=renderYojanaBeneficiariesPage(village,items,'mr');
 assert.match(nested,/sv-yojana-beneficiaries/);
 assert.match(nested,/शासकीय योजना/);
 assert.match(nested,/href="\/demo\/schemes\?schemeTab=all"/);
 assert.match(nested,/href="\/demo\/beneficiaries" aria-current="page"/);
 assert.match(nested,/पीएम किसान लाभार्थी/);
 assert.equal((nested.match(/sv-bene-card-icon/g)||[]).length,6);
 assert(!nested.includes('Secret hidden'));
 // A second village must never inherit another village's published content.
 const second={...village,id:'11111111-1111-4111-8111-111111111111',slug:'a-second-village',site_settings:{}};
 const empty=renderYojanaBeneficiariesPage(second,[],'mr');
 assert.match(empty,/अद्याप कोणतीही यादी प्रकाशित झालेली नाही/);
 assert(!empty.includes('पीएम किसान लाभार्थी'));
 assert.match(empty,/href="\/v\/a-second-village\/schemes\?schemeTab=individual"/);
 assert.match(renderYojanaBeneficiariesPage(village,items,'en'),/Beneficiary Lists/);
 // Existing links and previously-issued SEO URLs continue working.
 assert.match(renderBeneficiariesPage(village,items,'mr'),/लाभार्थी यादी/);
 const header=homeHeader(village,'mr');
 assert(!header.includes('href="/demo/beneficiaries"'),'Remove standalone default navbar entry');
 assert(header.includes('href="/demo/schemes"'));
 const footerLogo='https://cdn.example.org/footer-custom.png';
 const v={...village,site_settings:{...village.site_settings,footer_logo_url:footerLogo}};
 const f=homeFooter(v,'mr'), bottom=homeBottomLogo(v,'mr');
 assert(f.includes('sv-footer-grid')&&!f.includes('sv-page-logo'),'Logo is no longer part of the footer');
 assert(bottom.includes('sv-page-logo-band')&&bottom.includes(footerLogo));
 assert(f.includes('sv-copyright'),'Copyright and admin notice restored in footer');
 assert(homeBottomLogo({...v,site_settings:{}},'mr').includes(v.logo_url));
 const bad=homeBottomLogo({...v,site_settings:{footer_logo_url:'javascript:alert(1)'}},'mr');
 assert(!bad.includes('javascript:alert(1)'),'No unsafe image URI');
 assert(bad.includes(v.logo_url),'Invalid custom logo must fall back to village logo');
 const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
 assert.match(admin,/data-footer-logo="true"/);
 assert.match(admin,/admin-footer-logo-list/);
 assert.match(admin,/beneficiarySettingsForm/);
 assert(admin.includes("footer_logo_url:urls[0]||''"));
 assert(admin.includes("Array.isArray(ss.footer_logos)"));
 assert.match(admin,/can_edit_village|editing is not permitted/);
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 assert.match(css,/\.sv-g-nav/);
 assert.match(css,/\.sv-page-logo-band/);
 const pub=readFileSync(new URL('../src/public.js',import.meta.url),'utf8');
 assert.match(pub,/renderYojanaBeneficiariesPage\(v,items,lang\)/);
 console.log('PASS v3.6: beneficiary subpage inside Yojana, bilingual routing, scoped content, safe bottom footer logo, editable upload and admin headings.');
} finally {globalThis.location=oldLocation;}

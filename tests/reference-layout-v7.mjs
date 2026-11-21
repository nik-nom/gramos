import assert from 'node:assert/strict';
import {getDemo} from '../src/demo.js';
import {renderShamvadiHomepage} from '../src/homepage.js';
import {buildShamvadiVillage} from '../src/templates.js';
globalThis.location={origin:'https://gramos.example',pathname:'/demo'};
const {village,items}=getDemo();
for(const lang of ['mr','en']){
 const html=renderShamvadiHomepage(village,items,lang,false);
 for(const section of ['sv-header','sv-ticker','sv-hero','sv-welcome','sv-gallery-row','sv-notices','sv-people-area','sv-profile-grid','sv-schemes-box','sv-contact-box','sv-weather-box','sv-services-grid','sv-news-cards','sv-project-grid','sv-metric-cards','sv-footer']) {
   assert(html.includes(section),`Missing ${section} (${lang})`);
 }
 assert(html.includes('sv-slide-dots')&&html.includes('sv-slide'), 'Missing carousel');
}
const site=buildShamvadiVillage({slug:'another-village',name_mr:'वेगळे गाव'});
assert.equal(site.slug,'another-village');
assert.equal(site.status,'draft');
assert(site.home_sections.includes('leaders_schemes'));
console.log('PASS: screenshot sections and independent editable village template.');

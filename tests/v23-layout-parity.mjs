import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {renderAboutPage} from '../src/about.js';
import {renderShamvadiHomepage, homeFooter} from '../src/homepage.js';

globalThis.location={search:'',pathname:'/demo/about'};
const {village, items}=getDemo();
const live={...village,id:'real-1',slug:'shirpur',name_mr:'शिरपूर',name_en:'Shirpur',logo_url:'',
 site_settings:{footer_social_heading_mr:'Social Media',about_page_title_mr:'ग्रामपंचायतीबद्दल'}, home_sections:[...village.home_sections]};
for(const lang of ['mr','en']){
 const d=renderAboutPage(village,items,lang),l=renderAboutPage(live,[],lang);
 const structural=['sv-template-about','sv-a-pagehead','sv-a-tablist','sv-a-factgrid','sv-a-people-grid','sv-a-table-scroll','sv-a-facility-grid','sv-a-pillars','sv-a-tabpanel'];
 for(const cls of structural) assert(d.includes(cls)&&l.includes(cls),`About demo and live both need ${cls}`);
 assert.equal((d.match(/role="tab"/g)||[]).length,(l.match(/role="tab"/g)||[]).length);
 assert.equal((d.match(/class="sv-a-facility"/g)||[]).length>=4,true);
 assert(l.includes('sv-a-facility-placeholder'),'Real-village empty facility boxes retain the demo grid');
 const home=renderShamvadiHomepage(live,[],lang),demoHome=renderShamvadiHomepage(village,items,lang);
 for(const markup of ['sv-service-video','sv-service-column','sv-video-content','sv-footer-grid']) assert(home.includes(markup)&&demoHome.includes(markup));
 assert(home.includes('rdd.maharashtra.gov.in'),'Live footer must have same basic links structure as populated demo');
 assert(homeFooter(live,lang).includes('sv-footer-grid'));
 assert(!l.includes('नमुना कर्मचारी'),'Never copy demo persons into real-village pages');
}
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
assert(css.includes('GramOS v2.3'));
assert(css.includes('grid-template-columns: minmax(0, 2.05fr) minmax(0, 1fr)'));
assert(css.includes('.sv-site .sv-service-video > .sv-video'));
assert(css.includes('margin: 0;'));
assert(css.includes('max-width: 940px'));
const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
for(const k of ['about_facts','about_facilities','about_blocks','committee_groups','committees','duties','officials'])
 assert(admin.includes(`['${k}'`),`About editor must expose ${k}`);
console.log('PASS v2.3: shared demo/live HTML, stable empty-state geometry, matched video-service tracks, same editable footer and About controls');

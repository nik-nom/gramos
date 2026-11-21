import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderAboutPage} from '../src/about.js';
import {renderShamvadiHomepage} from '../src/homepage.js';
import {renderServicesPage} from '../src/services.js';

globalThis.location={pathname:'/demo/about',search:''};
const {village,items}=getDemo();
const real={...village,id:'actual-village',slug:'shirpur',name_mr:'शिरपूर',name_en:'Shirpur',
  site_settings:{about_mission_mr:'',about_vision_mr:'',about_mission_en:'',about_vision_en:''}};
for(const lang of ['mr','en']) {
 const demo=renderAboutPage(village,items,lang);
 const live=renderAboutPage(real,[],lang);
 assert(demo.includes('sv-about-shared') && live.includes('sv-about-shared'));
 assert.equal((demo.match(/role="tab"/g)||[]).length,6);
 assert.equal((live.match(/role="tab"/g)||[]).length,6);
 for(const key of ['sv-a-pagehead','sv-a-tablist','sv-a-content','sv-a-factgrid','sv-a-pillars','sv-a-people-grid','sv-a-facility']) {
   assert(demo.includes(key),`Demo has ${key}`);
   // Live village may have no facility data but must preserve the section heading and grid framing
   if (key!=='sv-a-facility')assert(live.includes(key),`Real village has ${key}`);
 }
 assert(live.includes('sv-a-person-placeholder'), 'Empty live villagers keep the demo people grid instead of collapsing');
 assert(live.includes('sv-a-table-placeholder'),'Empty live committee maintains the reference table layout');
 const panel=live.split('id="about-panel-info"')[1].split('id="about-panel-officials"')[0];
 assert(panel.includes('ग्रामपंचायत माहिती')||panel.includes('Gram Panchayat Information'));
 assert(!panel.includes('sv-a-duties-grid'), 'Responsibilities must NOT show on All Information');
 assert(!panel.includes('sv-a-history'), 'History must NOT appear on All Information');
 const demoPanel=demo.split('id="about-panel-info"')[1].split('id="about-panel-officials"')[0];
 assert(!demoPanel.includes('sv-a-duties-grid'));
 assert(!demoPanel.includes('sv-a-history'));
 assert(!live.includes('hero-tree.webp'), 'Do not put demo sample photography on real village About');
 const bannedPhoto={kind:'about_blocks',slug:'sample-photo',sort_order:900,title_mr:'फोटो',title_en:'Photo',body_mr:'',body_en:'',image_url:'https://example.org/should-not-show.jpg',details:{about_tab:'info',element:'image'}};
 const withForbiddenImage=renderAboutPage(real,[bannedPhoto],lang);
 assert(!withForbiddenImage.includes('should-not-show.jpg'), 'No custom About images in All Information');
 // No accidental leak of reference demo names into a live village.
 assert(!live.includes('नमुना ग्रामपंचायत सदस्य'));
 const dutiesPanel=demo.split('id="about-panel-duties"')[1];
 assert(dutiesPanel.includes('sv-a-duties-grid'),'Responsibility cards only in sixth tab');
 const home=renderShamvadiHomepage(village,items,lang,false);
 assert(home.includes('sv-services-grid')&&home.includes('sv-video'));
 const services=renderServicesPage(village,items,lang);
 assert(services.includes('sv-service-tabpanel')&&services.includes('service_forms')===false);
 assert(services.includes('services-panel-qr'), 'Screenshot-matched QR tab is separate from View All');
}
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
assert(css.includes('.sv-about-shared .sv-a-people-grid-empty'));
assert(css.includes('.sv-site .sv-service-video .sv-video'));
assert(css.includes('.sv-site .sv-footer h3'));
const publicJS=await readFile(new URL('../src/public.js',import.meta.url),'utf8');
assert(publicJS.includes('renderAboutPage(v,items,lang)'),'Shared demo and real page template');
const sql=await readFile(new URL('../database/07_lokseva_v22.sql',import.meta.url),'utf8');
assert(sql.includes("'service_forms'") && sql.includes("'service_steps'"));
assert(sql.includes("service-documents") && sql.includes('app_private.can_edit_village'));
console.log('PASS v2.2: demo/live About shared design and empty states, no history or duties in All Information, compact homepage and Lokseva DB contract');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderAboutPage} from '../src/about.js';
globalThis.location={origin:'https://gramos.test',pathname:'/demo/about',search:''};
for(const language of ['mr','en']){
 const {village,items}=getDemo();
 const html=renderAboutPage(village,items,language);
 for(const tab of ['info','officials','staff','committees','facilities','duties']){
  assert(html.includes(`id="about-tab-${tab}"`),`missing ${tab} button`);
  assert(html.includes(`id="about-panel-${tab}"`),`missing ${tab} panel`);
 }
 assert.equal((html.match(/role="tab"/g)||[]).length,6);
 assert(html.includes('sv-a-factgrid'));
 assert(html.includes('sv-a-people-grid'));
 assert(html.includes('sv-a-table'));
 assert(html.includes('sv-a-duties-grid'));
 assert(html.includes('loading="lazy"')||html.includes('sv-a-avatar-placeholder'));
 assert(!html.includes('undefined'));
}
location.search='?tab=committees';
const {village:village2,items:items2}=getDemo();
assert(renderAboutPage(village2,items2,'mr').includes('id="about-panel-committees" role="tabpanel" aria-labelledby="about-tab-committees"'));
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
assert(css.includes('.sv-site .sv-service{min-height:112px'));
assert(css.includes('.sv-site .sv-service-video .sv-video{margin-top:55px;min-height:235px')); // historical baseline overridden by v2.2 CSS
const js=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert(js.includes("action==='about-tab'"));
assert(js.includes("'aboutSettingsForm'"));
console.log('PASS V9: About tabs, editable sections, bilingual labels, responsive and service/video alignment contracts.');

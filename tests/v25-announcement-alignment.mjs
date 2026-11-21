import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {homeHeader,homeTicker,renderShamvadiHomepage} from '../src/homepage.js';

const css=readFileSync(new URL('../styles.css', import.meta.url),'utf8');
const publicSource=readFileSync(new URL('../src/public.js', import.meta.url),'utf8');
const {village,items}=getDemo();
const original=[...village.home_sections];
for (const language of ['mr','en']) {
 const output=renderShamvadiHomepage(village,items,language,false);
 assert.equal((output.match(/class="sv-ticker"/g)||[]).length,1,'one ticker on homepage');
 assert(output.indexOf('sv-ticker')<output.indexOf('sv-hero'), 'announcement appears below nav, above hero');
 assert(homeHeader(village,language).includes('sv-ticker-track'),'ticker is part of reusable header');
 const joined=output.match(/<section class="sv-wrap sv-people-area sv-joined-layout"[\s\S]*?<\/section><\/div>/);
 assert(output.includes('sv-joined-layout'),'staff and services share two independent tracks');
 assert(output.indexOf('sv-service-video-main') > output.indexOf('sv-people-panel'),'services follow staff in left track');
 assert(output.indexOf('sv-service-video-side') > output.indexOf('sv-weather-box'),'video follows weather in right track');
 assert(output.includes('sv-footer-grid'),'footer unchanged');
 const altered={...village,home_sections:original.filter(x=>x!=='services_video')};
 assert(!renderShamvadiHomepage(altered,items,language).includes('sv-joined-layout'),'reorder/hide works');
 const alternate={...village,home_sections:['services_video','leaders_schemes']};
 assert(!renderShamvadiHomepage(alternate,items,language).includes('sv-joined-layout'),'reversed order preserves independent sections');
 assert(homeTicker({...village,site_settings:{quote_mr:'<script>alert(1)</script>'}},'mr').includes('&lt;script&gt;'),'announcement is escaped');
}
assert(publicSource.includes('${homeHeader(v,lang,navLanguage)}'),'inner pages share header containing ticker');
assert(css.includes('@keyframes sv-ticker-travel'),'ticker visually moves');
assert(css.includes('prefers-reduced-motion:reduce'),'ticker respects motion preferences');
assert(css.includes('.sv-joined-layout .sv-service-video-side'),'video is explicitly aligned with weather column');
console.log('PASS v2.5: one moving blue ribbon per page, safe admin text, stacked Lokseva/staff + video/weather tracks, and editable section ordering');

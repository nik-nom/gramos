import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderSchemesPage} from '../src/schemes.js';

globalThis.location={origin:'http://localhost:8000',search:'',pathname:'/demo/schemes'};
const {village,items}=getDemo();
for(const lang of ['mr','en']){
 const html=renderSchemesPage(village,items,lang);
 assert.equal((html.match(/role="tab" /g)||[]).length,3);
 assert.equal((html.match(/class="sv-g-card"/g)||[]).length,10,'All + filtered views each render 5 scheme cards');
 for(const tab of ['all','individual','public'])assert(html.includes(`id="schemes-panel-${tab}"`));
 assert.equal((html.match(/class="sv-g-individual"/g)||[]).length,0);
 assert(!html.includes('QR Code'));
 assert(html.includes('sv-g-section'));
 assert(html.includes(lang==='mr'?'वैयक्तिक लाभाच्या योजना':'Individual Benefit Schemes'));
 const live=renderSchemesPage({...village,slug:'shirpur'},[],lang);
 assert(live.includes('प्रधानमंत्री आवास योजना') || live.includes('Pradhan Mantri Awas Yojana'),'New village receives built-in reference schemes');
 globalThis.location.search='?schemeTab=public';
 assert(renderSchemesPage(village,items,lang).includes('class="sv-g-tab active"')||renderSchemesPage(village,items,lang).includes('sv-g-tab active'));
 globalThis.location.search='';
}
const admin=await readFile(new URL('../src/admin.js',import.meta.url),'utf8');
const pub=await readFile(new URL('../src/public.js',import.meta.url),'utf8');
const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
assert(admin.includes('schemeSettingsForm'));
assert(admin.includes('schemesEditor(working,lang)'));
assert(admin.includes("payload.kind==='schemes'?['scheme_type'"));
assert(admin.includes('details?.scheme_type'));
assert(pub.includes("if(section==='schemes')"));
assert(main.includes("if(action==='scheme-tab')"));
assert(css.includes('.sv-g-grid'));
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
console.log('PASS v2.8: 3 scheme tabs, editable village-specific scheme cards, bilingual fields and responsive layout.');

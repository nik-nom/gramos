import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderAboutPage} from '../src/about.js';
// Import the browser-facing public router only after minimal browser globals exist.
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'PASTE_SUPABASE_PROJECT_URL_HERE',supabaseAnonKey:'PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE'}};
globalThis.document={title:''};
const {renderPublic}=await import('../src/public.js');
globalThis.location={origin:'https://example.com',pathname:'/demo/about',search:''};
const {village,items}=getDemo();
for(const lang of ['mr','en']){
  const withExtra={...village,site_settings:{...village.site_settings,about_cover_image_url:'https://example.com/hidden-history.jpg'}};
  const extra={kind:'about_sections',slug:'extra-content',sort_order:1,title_mr:'अधिक माहिती',title_en:'More information',body_mr:'मजकूर',body_en:'Text',image_url:'https://example.com/hidden-extra.jpg',details:{}};
  const html=renderAboutPage(withExtra,[...items,extra],lang);
  const info=html.match(/id="about-panel-info"[^>]*>([\s\S]*?)<\/section><section class="sv-a-tabpanel"/);
  assert(info,'all-info panel exists');
  const body=info[1];
  assert(body.includes('sv-a-extra-plain'),'plain extra text renderer');
  assert(body.includes('sv-a-extra-entry'),'text-only record renderer');
  assert(!body.includes('sv-about-detail'),'no old boxed grid');
  assert(!body.includes('sv-a-extra-image'),'no old photo wrapper');
  assert(!body.includes('hidden-extra.jpg'),'no extra photo in all information');
  assert(!body.includes('hidden-history.jpg'),'no history photo in all information');
  assert(body.includes('sv-a-people-grid'),'other tab sections retained');
  assert(!body.includes('sv-a-duties-grid'),'duties must appear only in sixth tab');
  assert(!body.includes('sv-a-history'),'History must not appear in All Information');
  assert(body.includes('sv-a-committee'),'committees retained');
  assert.equal((html.match(/role="tab"/g)||[]).length,6);
  assert(!renderAboutPage(village,items,lang).includes('sample-history'),'old fake extra section omitted from demo');
}
// Both public routes use one renderAboutPage() component, not two distinct templates.
const pub = await readFile(new URL('../src/public.js',import.meta.url),'utf8');
assert(pub.includes('return villagePage(village,items,lang,route.slice(1),false,navLanguage)')); 
assert(pub.includes('return villagePage(branded,items,lang,route.slice(2),preview,navLanguage)'));
assert(!pub.includes('withGlobalLogos')&&pub.includes('withVillageDraft'), 'village settings must not be overwritten with global branding');
assert(pub.includes('renderAboutPage(v,items,lang)'));
const demoPage=await renderPublic(['demo','about'],'mr',{admin:false,ids:[]});
assert(demoPage.includes('sv-about-v9'));
assert(!demoPage.includes('sv-a-extra-image'));
assert(demoPage.includes('sv-footer'));
console.log('PASS V11/V2.2: clean All Information, no history or duties, demo/live share renderer');

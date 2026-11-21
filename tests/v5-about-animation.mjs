import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
globalThis.location={origin:'https://gramos.test',pathname:'/demo/about',search:''};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'PASTE_SUPABASE_PROJECT_URL_HERE',supabaseAnonKey:'PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE'}};
globalThis.document={title:''};
const {renderPublic}=await import('../src/public.js');
for(const lang of ['mr','en']){
 const html=await renderPublic(['demo','about'],lang,{admin:false,ids:[]});
 assert(html.includes('sv-about-pagebar'));
 assert(html.includes('sv-about-info'));
 assert(!html.includes('sv-about-detail')); // V11: intentionally removed boxed About overview
 assert(html.includes('sv-about-pillars'));
 assert(html.includes('sv-footer'));
 assert(!html.includes('undefined'));
}
const js=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert(js.includes('IntersectionObserver'));
assert(js.includes('prefers-reduced-motion: reduce'));
assert(js.includes('svGallery'));
const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');
assert(css.includes('.sv-site .sv-slide.active{display:block;opacity:1;'));
assert(css.includes('.sv-site.sv-motion-ready .sv-reveal'));
const admin=await readFile(new URL('../src/admin.js',import.meta.url),'utf8');
assert(!admin.includes("['about_cover_image_url'"),'Legacy About photo must not be an editable default setting');
assert(admin.includes('about_sections'));
console.log('PASS: About page (both languages), editable fields, crossfade and scroll-reveal contracts.');

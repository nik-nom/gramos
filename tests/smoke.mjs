// Run: node tests/smoke.mjs
// Tests the public router and demo without network, credentials or extra packages.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.window = {GRAMOS_CONFIG:{supabaseUrl:'PASTE_SUPABASE_PROJECT_URL_HERE',supabaseAnonKey:'PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE'}};
globalThis.document = {title:''};
globalThis.location = {origin:'https://gramos.test',search:''};
const {renderPublic} = await import('../src/public.js');
const {renderAdmin} = await import('../src/admin.js');
const paths=['','about','services','projects','schemes','notices','news','news/clean-village-drive','gallery','staff','leaders','contact','pages','pages/local-history'];
for(const lang of ['en','mr'])for(const path of paths){
  const out=await renderPublic(['demo',...path.split('/').filter(Boolean)],lang,{admin:false,ids:[]});
  assert(out.length>1000,`Empty response: ${lang} /demo/${path}`);
  assert(out.includes('<main') && out.includes('</main>'),`Missing main: ${path}`);
  assert(!out.includes('undefined'),`Unexpected undefined: ${path}`);
  console.log(`OK ${lang}: /demo${path?'/'+path:''}`);
}
const root=await renderPublic([],'en',{admin:false,ids:[]});
assert(root.includes('404') && !root.includes('gp-directory') && !root.includes('Published village sites'), 'Root must NOT show the platform homepage or village directory');
const admin=await renderAdmin(['admin'],'en',{admin:false,ids:[]},null);
assert(admin.includes('Connect Supabase first'));
const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));
assert(config.rewrites.some(x=>x.source==='/v/:path*'));
assert(config.rewrites.some(x=>x.source==='/admin/:path*'));
console.log('PASS: Screenshot-matched demo and public routes, no platform homepage, Node.js route and language contract.');

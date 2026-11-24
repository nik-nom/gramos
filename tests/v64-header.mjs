import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const id='11111111-1111-4111-8111-111111111111';
const v={id,slug:'sample',status:'published',name_en:'Sample village',name_mr:'नमुना गाव',site_settings:{},home_sections:[]};
const api={from(table){const q={select:()=>q,eq:()=>q,in:()=>q,range:()=>q,order:()=>q,maybeSingle:async()=>({data:table==='villages'?v:null,error:null}),then:(ok,fail)=>Promise.resolve({data:table==='villages'?[v]:[],error:null}).then(ok,fail)};return q;}};
globalThis.window={GRAMOS_CONFIG:{supabaseUrl:'https://mock.supabase.co',supabaseAnonKey:'public-test'},supabase:{createClient:()=>api}};
globalThis.location={origin:'https://example.test',pathname:'/admin',search:''};globalThis.document={title:''};
const {renderAdmin}=await import('../src/admin.js');
const role={admin:true,ids:[]},user={email:'test@example.test'};
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
assert.equal(css,readFileSync(new URL('../apps/admin/styles.css',import.meta.url),'utf8'));
assert.match(css,/\.admin-top \.admin-top-right > a,[\s\S]*?color:#202020 !important/);
const out=process.env.GRAMOS_TEST_HTML;if(out)mkdirSync(out,{recursive:true});
for(const lang of ['en','mr'])for(const [name,route] of Object.entries({dashboard:['admin'],security:['admin','security'],home:['admin','villages',id,'home'],notices:['admin','villages',id,'content','notices'],forms:['admin','villages',id,'submissions']})){
 location.pathname='/'+route.join('/');const html=await renderAdmin(route,lang,role,user);
 assert.match(html,/href="\/admin\/security"/);assert.match(html,/href="\/demo" target="_blank"/);assert.match(html,/data-action="logout"/);assert.match(html,/data-action="set-nav-language"/);
 if(name==='security')assert.match(html,/id="setPasswordForm"/);
 if(out)writeFileSync(`${out}/${lang}-${name}.html`,`<!doctype html><html lang="${lang}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><body>${html}</body></html>`);
}
console.log('PASS v6.4: shared stylesheet parity, bilingual header actions on five admin screens, password form route.');

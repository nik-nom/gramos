import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
for(const app of ['admin','public']){
 const base=resolve(root,'apps',app);
 const cfg=JSON.parse(await readFile(resolve(base,'vercel.json'),'utf8'));
 for(const path of Object.keys(cfg.functions||{}))await access(resolve(base,path));
 for(const path of ['config.js','src/main.js','styles.css','package.json'])await access(resolve(base,path));
 for(const rewrite of cfg.rewrites||[]){const dest=rewrite.destination.split('?')[0];if(dest.startsWith('/api/'))await access(resolve(base,dest.slice(1)+'.js'));else if(dest.endsWith('.html'))await access(resolve(base,dest.slice(1)));}
}
const context={window:{}};
vm.runInNewContext(await readFile(resolve(root,'apps/admin/config.js'),'utf8'),context);
for(const file of ['index.html','admin-shell.html']){
 const html=await readFile(resolve(root,'apps/admin',file),'utf8');
 const setup=html.match(/<script>(window\.GRAMOS_CONFIG=.*?;)<\/script>/s)?.[1];assert(setup);
 const browser={window:{}};vm.runInNewContext(setup,browser);
 assert.equal(browser.window.GRAMOS_CONFIG.supabaseAnonKey,context.window.GRAMOS_CONFIG.supabaseAnonKey);
 assert.match(browser.window.GRAMOS_CONFIG.supabaseAnonKey,/^sb_publishable_/);
 assert.equal(browser.window.GRAMOS_CONFIG.supabaseUrl,context.window.GRAMOS_CONFIG.supabaseUrl);
 assert(html.indexOf(setup)<html.indexOf('id="gramos-inline-bootstrap"'));
 assert(html.includes('Version 6.9.8'));assert(html.includes('/src/main.js?v=6.9.8'));
}
console.log('PASS: deploy entrypoints, required API/static files, inline public configuration, cache version');

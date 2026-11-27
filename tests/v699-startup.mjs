import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {publicConfig} from '../apps/public/api/lib/v694-seo-data.mjs';
const read=(p)=>readFile(new URL('../'+p,import.meta.url),'utf8');
const context={window:{}};vm.runInNewContext(await read('apps/admin/config.js'),context);
for(const file of ['apps/admin/index.html','apps/admin/admin-shell.html']){
 const html=await read(file), inline=html.match(/<script>(window\.GRAMOS_CONFIG=.*?;)<\/script>/s)?.[1];assert(inline);const c={window:{}};vm.runInNewContext(inline,c);assert.equal(c.window.GRAMOS_CONFIG.supabaseUrl,context.window.GRAMOS_CONFIG.supabaseUrl);assert.equal(c.window.GRAMOS_CONFIG.supabaseAnonKey,context.window.GRAMOS_CONFIG.supabaseAnonKey);assert.match(c.window.GRAMOS_CONFIG.supabaseAnonKey,/^sb_publishable_/);assert.match(html,/\/src\/main\.js\?v=6\.10\.0/);assert(html.indexOf(inline)<html.indexOf('id="gramos-inline-bootstrap"'));
}
for(const app of ['admin','public']){
 const prefix='apps/'+app+'/';const cfg=JSON.parse(await read(prefix+'vercel.json'));for(const file of Object.keys(cfg.functions||{}))await access(new URL('../'+prefix+file,import.meta.url));for(const rule of cfg.rewrites||[]){const dest=rule.destination.split('?')[0];if(dest.startsWith('/api/'))await access(new URL('../'+prefix+dest.slice(1)+'.js',import.meta.url));else if(dest.endsWith('.html'))await access(new URL('../'+prefix+dest.slice(1),import.meta.url));}
}
process.env.VERCEL='1';delete process.env.SUPABASE_URL;delete process.env.SUPABASE_PUBLISHABLE_KEY;delete process.env.SUPABASE_ANON_KEY;
const fallback=await publicConfig();assert.equal(fallback.url,context.window.GRAMOS_CONFIG.supabaseUrl);assert.equal(fallback.key,context.window.GRAMOS_CONFIG.supabaseAnonKey);
process.env.SUPABASE_URL='https://mock.supabase.co';await assert.rejects(publicConfig,/Set SUPABASE_URL/);process.env.SUPABASE_PUBLISHABLE_KEY='sb_secret_do_not_expose';await assert.rejects(publicConfig,/Expected a public/);process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_mock';assert.equal((await publicConfig()).key,'sb_publishable_mock');
const pub=JSON.parse(await read('apps/public/vercel.json'));assert.equal(pub.outputDirectory,'.');assert.equal(pub.framework,null);assert.match(pub.functions['api/village-site.js'].includeFiles,/config\.js/);
console.log('PASS: matching admin bootstrap, public-only configuration fallback, rejection of partial and private credentials, API route files.');

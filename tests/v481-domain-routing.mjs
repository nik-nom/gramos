import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizedHost,validVillageDomain,isSharedPublicHost,domainDestination} from '../src/domain-routes.mjs';
import {activeDomainForHost,activeDomainForVillage,allActiveDomains} from '../src/domain-data.mjs';
import {xmlSitemap} from '../src/seo-server.mjs';
const root=new URL('../',import.meta.url);
assert.equal(normalizedHost('Village.IN:443'),'village.in');
for(const x of ['https://bad.in','bad.in/v/shirpur','localhost','a.vercel.app','a.supabase.co','-bad.in','bad-.in','bad in'])assert.equal(validVillageDomain(x),'',x);
assert.equal(validVillageDomain('village.in'),'village.in');
assert.equal(isSharedPublicHost('gramos-public.vercel.app'),true);
assert.equal(isSharedPublicHost('evil.in'),false);
assert.equal(domainDestination('lohegaon.in','/v/lohegaon/about','?lang=mr'),'https://lohegaon.in/v/lohegaon/about?lang=mr');
assert.equal(domainDestination('lohegaon.in','/v/lohegaon','?preview=1'),'https://lohegaon.in/v/lohegaon');
assert.equal(domainDestination('evil.com','/v/../shirpur'), '');
const aId='12345678-1234-1234-1234-123456789abc',bId='abcdefab-abcd-abcd-abcd-abcdefabcdef';
const domains=[{hostname:'lohegaon.in',village_id:aId,status:'active',verified_at:'2026-11-22T12:00:00Z'},{hostname:'shirpur.in',village_id:bId,status:'active',verified_at:'2026-11-22T12:00:00Z'}];
function mockFetch(url){const u=new URL(url);let rows=domains.filter(x=>{
 for(const [key,value] of u.searchParams){if(key==='select'||key==='offset'||key==='limit')continue;
 if(!value.startsWith('eq.'))continue;if(x[key]!==value.slice(3))return false;}
 return true;});return Promise.resolve({ok:true,json:async()=>rows});}
const opts={fetcher:mockFetch,config:{url:'https://example.supabase.co',key:'public'}};
assert.equal((await activeDomainForHost('lohegaon.in',opts)).village_id,aId);
assert.equal((await activeDomainForHost('shirpur.in',opts)).village_id,bId);
assert.equal(await activeDomainForHost('not-verified.in',opts),null);
assert.equal((await activeDomainForVillage(aId,opts)).hostname,'lohegaon.in');
assert.equal((await allActiveDomains(opts)).length,2);
const villages=[{id:aId,slug:'lohegaon',status:'published',name_mr:'लोहेगाव'},{id:bId,slug:'shirpur',status:'published',name_mr:'शिरपूर'}];
const la=xmlSitemap({villages:villages.filter(v=>v.id===aId),origin:'https://lohegaon.in'});
assert.match(la,/lohegaon\.in\/v\/lohegaon/);assert.doesNotMatch(la,/shirpur/);
const lb=xmlSitemap({villages:villages.filter(v=>v.id===bId),origin:'https://shirpur.in'});
assert.match(lb,/shirpur\.in\/v\/shirpur/);assert.doesNotMatch(lb,/lohegaon/);
const none=xmlSitemap({villages:villages.filter(v=>v.id==='missing'),origin:'https://not-verified.in'});
assert.doesNotMatch(none,/<url>/);
const admin=await readFile(new URL('../apps/admin/api/domain-admin.js',import.meta.url),'utf8');
const pub=await readFile(new URL('../apps/public/vercel.json',import.meta.url),'utf8');
assert.match(admin,/Only a signed-in Super Admin/);assert.match(admin,/dns\?\.misconfigured===false/);assert.match(admin,/gramos_activate_verified_domain/);
assert(!pub.includes('domain-admin'));
assert.match(await readFile(new URL('../apps/public/api/page.js',import.meta.url),'utf8'),/statusCode=307/);
console.log('PASS v4.8.1: predefined per-village custom-domain entries; two tenants; hostname isolation; safe redirects; sitemap isolation; unknown hosts; pending DNS; admin-only activation.');

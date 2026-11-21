import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeHostname,isSharedHostname,routeOnCustomHost,previewToClean,sitemapXML,robotsTXT,pageSEO,vercelStatus,dnsInstructions,validPublicPath} from '../apps/gramos/lib/domain-core.mjs';
import {resolveDomainRows,primaryDomainRows} from '../apps/gramos/lib/domain-lookup.mjs';
import {makeVercelClient} from '../apps/gramos/lib/vercel-domains.mjs';
const A='10000000-0000-4000-8000-000000000001',B='20000000-0000-4000-8000-000000000002';
const fixed='2026-11-21T13:00:00Z';
function fakeDB(domainRows,sites){
 const all={village_domains:domainRows,village_sites:sites};
 const audits=[];
 return {audits,from(table){
   let conditions=[];
   const query={
    select(){return this},eq(k,v){conditions.push(row=>row[k]===v);return this},
    in(k,list){conditions.push(row=>list.includes(row[k]));return this},
    not(k,operator,v){conditions.push(row=>operator==='is'&&v===null?row[k]!==null:row[k]!==v);return this},
    is(k,v){conditions.push(row=>row[k]===v);return this},
    async maybeSingle(){audits.push({table,conditions:conditions.length});const match=(all[table]||[]).filter(row=>conditions.every(fn=>fn(row)));return {data:match[0]||null,error:match.length>1?{message:'duplicate'}:null}}
   };return query;
 }};
}
const domains=[
 {hostname:'a-village.in',site_id:A,status:'active',is_primary:true,redirect_to:null,verified_at:fixed,dns_verified_at:fixed},
 {hostname:'b-village.in',site_id:B,status:'active',is_primary:true,redirect_to:null,verified_at:fixed,dns_verified_at:fixed},
 {hostname:'future-village.in',site_id:A,status:'pending',is_primary:false,redirect_to:null,verified_at:null,dns_verified_at:null},
];
const sites=[{id:A,slug:'alpha',published:true,archived_at:null},{id:B,slug:'beta',published:true,archived_at:null}];
test('hostname normalization fails closed against URI injection, invalid suffix and ports',()=>{
 assert.equal(normalizeHostname('A-Village.IN.'),'a-village.in');
 for(const v of ['https://a-village.in','a-village.in/anything','foo..in','foo-.in','evil.com:443','evil.com@example.com','example.com?x=1','example.com\\bad'])assert.equal(normalizeHostname(v),'');
 assert.equal(normalizeHostname('localhost:3000'),'localhost');
 assert.equal(isSharedHostname('gramos-platform.vercel.app',{GRAMOS_SHARED_HOSTNAMES:'gramos-platform.vercel.app'}),true);
 assert.equal(isSharedHostname('evil-gramos-platform.vercel.app',{GRAMOS_SHARED_HOSTNAMES:'gramos-platform.vercel.app'}),false);
});
test('two hostnames resolve to two separate immutable site IDs',async()=>{
 const db=fakeDB(domains,sites);const a=await resolveDomainRows('a-village.in',db),b=await resolveDomainRows('b-village.in',db);
 assert.equal(a.site.id,A);assert.equal(a.site.slug,'alpha');assert.equal(b.site.id,B);assert.equal(b.site.slug,'beta');
 assert.equal(await primaryDomainRows(A,db),'a-village.in');
 assert.equal(await primaryDomainRows(B,db),'b-village.in');
});
test('pending, unverified, unknown, unpublished and archived domains never resolve',async()=>{
 const db=fakeDB(domains,[...sites]);
 assert.equal(await resolveDomainRows('future-village.in',db),null);
 assert.equal(await resolveDomainRows('unknown-village.in',db),null);
 assert.equal(await resolveDomainRows('a-village.in',fakeDB(domains,[{...sites[0],published:false},sites[1]])),null);
 assert.equal(await resolveDomainRows('b-village.in',fakeDB(domains,[sites[0],{...sites[1],archived_at:fixed}])),null);
 const lost=domains.map(d=>d.hostname==='a-village.in'?{...d,dns_verified_at:null}:d);
 assert.equal(await resolveDomainRows('a-village.in',fakeDB(lost,sites)),null);
});
test('redirects remain same-village and can reverse for rollback',async()=>{
 const switched=[
  {...domains[0],status:'redirect',is_primary:false,redirect_to:'future-village.in'},
  {...domains[2],status:'active',verified_at:fixed,dns_verified_at:fixed,is_primary:true},
  domains[1]
 ];
 const old=await resolveDomainRows('a-village.in',fakeDB(switched,sites));
 assert.equal(old.redirectHost,'future-village.in');assert.equal(old.site.id,A);
 assert.deepEqual(routeOnCustomHost('/about','alpha'),{kind:'rewrite',target:'/v/alpha/about'});
 assert.deepEqual(routeOnCustomHost('/v/alpha/about','alpha'),{kind:'redirect',target:'/about'});
 assert.deepEqual(routeOnCustomHost('/v/beta/about','alpha'),{kind:'reject'});
 assert.equal(previewToClean('/v/alpha','alpha'),'/');
 const reverse=[{...switched[0],status:'active',is_primary:true,redirect_to:null},
  {...switched[1],status:'redirect',is_primary:false,redirect_to:'a-village.in'},switched[2]];
 assert.equal((await resolveDomainRows('future-village.in',fakeDB(reverse,sites))).redirectHost,'a-village.in');
 const hijack=[{...switched[0],redirect_to:'b-village.in'},switched[1],switched[2]];
 assert.equal(await resolveDomainRows('a-village.in',fakeDB(hijack,sites)),null);
});
test('same public routes serve clean URLs; private/cross-village paths rejected',()=>{
 for(const path of ['/','/about','/about/officials','/contact','/schemes'])assert.equal(routeOnCustomHost(path,'alpha').kind,'rewrite');
 for(const path of ['/api/admin/domains','/admin','/v/beta','/v/beta/contact','/news/private','/%2e%2e'])assert.equal(routeOnCustomHost(path,'alpha').kind,'reject');
 assert.equal(validPublicPath('/random'),false);
});
test('sitemaps contain only published pages of assigned village with its own hostname',()=>{
 const aPages=[{path:'/',is_published:true,published_at:fixed},{path:'/about',is_published:true,updated_at:fixed},{path:'/schemes',is_published:false},{path:'/v/beta',is_published:true}];
 const bPages=[{path:'/',is_published:true},{path:'/news',is_published:true},{path:'/about',is_published:false}];
 const a=sitemapXML('a-village.in',aPages),b=sitemapXML('b-village.in',bPages);
 assert.match(a,/https:\/\/a-village.in\/about/);assert.doesNotMatch(a,/b-village.in|\/schemes|\/v\/beta/);
 assert.match(b,/https:\/\/b-village.in\/news/);assert.doesNotMatch(b,/a-village.in|\/about/);
 assert.match(a,/lastmod>2026-11-21/);
 assert.equal((a.match(/<url>/g)||[]).length,2);
});
test('unverified host robots are disallowed; verified host advertises own sitemap',()=>{
 assert.equal(robotsTXT('a-village.in',false),'User-agent: *\nDisallow: /\n');
 assert.match(robotsTXT('a-village.in',true),/Sitemap: https:\/\/a-village.in\/sitemap.xml/);
 assert.doesNotMatch(robotsTXT('a-village.in',true),/vercel.app/);
});
test('metadata canonicalizes only on verified custom hostname and prevents duplicate preview indexing',()=>{
 const site={slug:'alpha',content:{general:{name:{mr:'ग्राम अ'},description:'अधिकृत संकेतस्थळ'}}};
 const page={title_mr:'ग्रामपंचायतीबद्दल',published_content:{seo_title_mr:'स्थानिक माहिती',seo_description_mr:'गावाची अधिकृत माहिती'}};
 const live=pageSEO({site,page,pageKey:'about',domain:'a-village.in'}),shared=pageSEO({site,page,pageKey:'about',shared:true});
 assert.equal(live.alternates.canonical,'https://a-village.in/about');
 assert.equal(live.robots.index,true);assert.equal(shared.robots.index,false);
 assert.equal(shared.alternates,undefined);assert.equal(live.description,'गावाची अधिकृत माहिती');
});
test('DNS-pending states and provider-reported instructions are not guessed',()=>{
 assert.deepEqual(vercelStatus({verified:false},{misconfigured:true}),{ownershipVerified:false,dnsConfigured:false,state:'ownership_pending'});
 assert.equal(vercelStatus({verified:true},{misconfigured:true}).state,'dns_pending');
 assert.equal(vercelStatus({verified:true},{misconfigured:false}).state,'ready');
 const i=dnsInstructions({verification:[{type:'TXT',domain:'_vercel.test',value:'vc-domain-verify=x'}]},{recommendedCNAME:[{value:'actual-provider-target'}]});
 assert.equal(i.verification[0].value,'vc-domain-verify=x');assert.equal(i.recommendedCNAME[0].value,'actual-provider-target');
});
test('Vercel API calls keep token server-side and target only public project',async()=>{
 const calls=[];
 const fakeFetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>
  url.includes('/config')?{misconfigured:false}:url.includes('/verify')?{verified:true}:{verified:true,verification:[]}}};
 const api=makeVercelClient({VERCEL_API_TOKEN:'SERVER_SECRET',VERCEL_PUBLIC_PROJECT_ID:'prj_public',VERCEL_TEAM_ID:'team_one'},fakeFetch);
 await api.add('a-village.in');const result=await api.check('a-village.in');await api.remove('a-village.in');
 assert.equal(result.state,'ready');assert.equal(calls.length,4);
 assert.ok(calls.every(c=>c.url.includes('teamId=team_one')));
 assert.ok(calls.every(c=>c.options.headers.Authorization==='Bearer SERVER_SECRET'));
 assert.equal(calls[0].options.method,'POST');assert.equal(calls.at(-1).options.method,'DELETE');
});
test('migration is schema-specific, additive, access-limited and serializes rollback/activation',async()=>{
 const sql=await readFile(new URL('../supabase/migrations/20261121_gramos_verified_village_domains.sql',import.meta.url),'utf8');
 for(const text of ['to_regclass(\'public.village_sites\')','ADD COLUMN IF NOT EXISTS status','REVOKE ALL ON FUNCTION public.register_village_domain','FOR UPDATE','gramos_one_primary_domain_per_site','gramos_activate_domain_v1','verified_at < v_time','dns_verified_at < v_time'])assert.ok(sql.includes(text),text);
 assert.ok(!/DROP TABLE|TRUNCATE|DELETE FROM public\.village_sites/i.test(sql));
});

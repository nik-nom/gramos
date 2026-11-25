import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
globalThis.location={origin:'https://example.test',pathname:'/v/test/services',search:''};
const v={id:'test',slug:'test',name_mr:'गाव',status:'published',site_settings:{},home_sections:['gallery_notice','leaders_schemes'],logo_url:'/assets/gp-mark.svg',hero_image_url:'/assets/placeholders/photo.svg'};
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(new URL('../GRAMOS_V6_9_PDF_MANIFEST.json',import.meta.url)));
for(const root of ['..','../apps/admin','../apps/public']){
 const mod=n=>import(`${root}/src/${n}.js`);
 const {referenceForms,mergeReferenceRows}=await mod('services-reference');
 const {mergeReferenceNotices}=await mod('notices-reference');
 const {renderServicesPage}=await mod('services');
 const {renderNoticesPage}=await mod('notices');
 const {renderShamvadiHomepage,homeHeader}=await mod('homepage');
 const {renderAboutPage}=await mod('about');
 const s=renderServicesPage(v,[],'mr'), n=renderNoticesPage(v,[],'mr');
 assert.equal(referenceForms.length,18);assert.equal(new Set(referenceForms.map(x=>x.external_url)).size,18);
 assert.equal((s.match(/Download PDF<\/a>/g)||[]).length,36); // All tab and forms tab; only one is visible at a time
 assert(!s.includes('sv-l-form-actions'));assert(!n.includes('संदर्भ कागदपत्रे'));assert(!n.includes('PDF अद्याप अपलोड केलेले नाही.'));
 const rti=mergeReferenceNotices([]).filter(x=>x.details.notice_type==='rti');assert.equal(rti.length,2);assert(rti.every(x=>x.external_url&&x.body_en.includes('not an RTI order')));
 for(const p of referenceForms){const bytes=await readFile(new URL(`${root}${p.external_url}`,import.meta.url));assert(bytes.subarray(0,5).equals(Buffer.from('%PDF-')));assert(s.includes(p.external_url));}
 for(const item of manifest){const bytes=await readFile(new URL(`${root}/${item.file}`,import.meta.url));assert.equal(hash(bytes),item.sha256);assert(s.includes('/'+item.file));}
 assert.notEqual(hash(await readFile(new URL(`${root}${rti[0].external_url}`,import.meta.url))),hash(await readFile(new URL(`${root}${rti[1].external_url}`,import.meta.url))));
 const saved=mergeReferenceRows([{kind:'service_forms',status:'published',slug:'citizen-services-application',external_url:''}],'service_forms');assert.equal(saved.length,18);assert(saved.find(x=>x.slug==='citizen-services-application').external_url);
 assert.equal(mergeReferenceNotices([{kind:'notices',status:'published',slug:'rti-bench-order',title_mr:'खंडपीठ आदेश',external_url:'',details:{notice_type:'rti'}}])[0].title_mr,'लोकसेवा हक्क अर्ज — नमुना १');
 assert(mergeReferenceNotices([{kind:'notices',status:'published',slug:'rti-bench-order',external_url:'https://example.test/genuine-rti.pdf',details:{notice_type:'rti'}}]).some(x=>x.external_url==='https://example.test/genuine-rti.pdf'));
 let h=renderShamvadiHomepage(v,[],'mr',false);assert(h.includes('reference-logo.png'));assert(h.includes('hero-tree.webp'));for(let i=1;i<=5;i++)assert(h.includes(`minister-${i}.webp`));for(let i=1;i<=3;i++)assert(h.includes(`official-${i}.webp`));assert(h.includes('data-action="profile-next"'));
 const ab=renderAboutPage(v,[],'mr');for(let i=1;i<=3;i++)assert(ab.includes(`official-${i}.webp`));
 const real={kind:'officials',slug:'official-1',status:'published',title_mr:'Actual official',image_url:'https://example.test/actual-portrait.webp',details:{about_group:'representatives'}};
 h=renderShamvadiHomepage({...v,site_settings:{nav_logo_url:'https://example.test/new-logo.webp'}},[real],'mr',false);assert(h.includes('new-logo.webp'));assert(h.includes('actual-portrait.webp'));assert(!h.includes('official-1.webp'));assert(renderAboutPage(v,[real],'mr').includes('actual-portrait.webp'));assert(!renderAboutPage(v,[real],'mr').includes('official-1.webp'));
 console.log('PASS',root,'18 PDF links, original hashes, two correctly labelled RTI-tab forms, published reference media and replacement rendering');
}

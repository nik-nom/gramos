import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
globalThis.location={origin:'https://example.test',search:'',href:'https://example.test/v/test',pathname:'/v/test'};
const manifest=JSON.parse(await readFile(new URL('../GRAMOS_V6_7_PDF_MANIFEST.json',import.meta.url),'utf8'));
const v={id:'test',slug:'test',name_mr:'गाव',site_settings:{},home_sections:['gallery_notice','leaders_schemes','services_video','news','projects']};
for(const root of ['..','../apps/admin','../apps/public']){
 const mod=async name=>import(`${root}/src/${name}.js`);
 const {renderShamvadiHomepage:home,homeHeader}=await mod('homepage');
 const {renderAboutPage:about}=await mod('about');
 const {renderServicesPage:services}=await mod('services');
 const {renderNoticesPage:notices}=await mod('notices');
 const {mergeReferenceRows,referenceForms}=await mod('services-reference');
 const {mergeReferenceNotices,referenceRTI}=await mod('notices-reference');
 const publicHome=home(v,[],'mr',false), preview=home(v,[],'mr',true);
 assert(publicHome.includes('/assets/gp-mark.svg'));assert(!publicHome.includes('/assets/reference-demo/'));assert(publicHome.includes('/assets/placeholders/portrait.svg'));
 assert(preview.includes('/assets/reference-demo/reference-logo.png'));assert(preview.includes('/assets/reference-demo/hero-tree.webp'));assert(preview.includes('/assets/reference-demo/gallery-photo.webp'));assert(preview.includes('/assets/reference-demo/minister-5.webp'));assert(preview.includes('/assets/reference-demo/official-3.webp'));assert(preview.includes('नमुना फोटो'));
 for(const h of [publicHome,preview]){assert.equal((h.match(/data-slider="svHero"/g)||[]).length,5);assert.equal((h.match(/class="sv-profile-grid sv-profile-leaders sv-profile-page"/g)||[]).length,2);}
 assert(about({...v,_templatePreview:true},[],'mr').includes('/assets/reference-demo/official-1.webp'));
 assert(!about(v,[],'mr').includes('/assets/reference-demo/'));
 const official={kind:'officials',status:'published',title_mr:'Actual official',subtitle_mr:'Role',image_url:'https://example.test/real.webp'};
 const village={...v,logo_url:'https://example.test/logo.webp',hero_image_url:'https://example.test/banner.webp'};
 const actual=home(village,[official],'mr',true);for(const path of ['real.webp','logo.webp','banner.webp','Actual official'])assert(actual.includes(path));assert(!actual.includes('sv67-sample-logo'));
 assert(about({...v,_templatePreview:true},[official],'mr').includes('real.webp'));
 const s=services(v,[],'mr'), n=notices(v,[],'mr');
 assert.equal(referenceForms.length,13);assert.equal(referenceRTI.length,5);assert(n.includes('संदर्भ कागदपत्रे (RTI आदेश नाहीत)'));
 for(const f of manifest){const bytes=await readFile(new URL(`${root}/${f.file}`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert((s+n).includes('/'+f.file));}
 assert(!s.includes('reference-panchayat-campaign.pdf'));assert(!n.includes('declaration-toilet.pdf'));assert(!s.includes('Right_to_Service_Form_1.pdf'));assert(!s.includes('Gramsoft_Form_2.pdf'));
 for(const f of referenceForms){assert(s.includes(f.external_url));}
 const replacement={...referenceForms[3],template_default:false,external_url:'https://example.test/custom.pdf'};assert.equal(mergeReferenceRows([replacement],'service_forms').find(x=>x.slug===replacement.slug).external_url,replacement.external_url);
 const notice=referenceRTI.find(x=>x.slug==='reference-panchayat-campaign');assert.equal(mergeReferenceNotices([{...notice,external_url:''}]).find(x=>x.slug===notice.slug).external_url,notice.external_url);
 assert(notices(v,[{kind:'notices',status:'published',slug:'rti-bench-order',title_mr:'खंडपीठ आदेश',details:{notice_type:'rti'},external_url:'https://example.test/order.pdf'}],'mr').includes('https://example.test/order.pdf'));
 assert(!notices(v,[{kind:'notices',status:'published',slug:'unsafe',title_mr:'unsafe',details:{notice_type:'rti'},external_url:'/unapproved.pdf'}],'mr').includes('href="/unapproved.pdf"'));
 for(const asset of ['reference-logo.png','hero-tree.webp','gallery-photo.webp','project-1.webp','minister-5.webp','official-3.webp']) assert((await readFile(new URL(`${root}/assets/reference-demo/${asset}`,import.meta.url))).length>100);
 console.log('PASS',root,'preview images, public fallback, real photo preservation, carousel controls, PDF links and hashes, RTI classification');
}

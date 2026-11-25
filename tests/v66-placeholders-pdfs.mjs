import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
globalThis.location={origin:'https://example.test',search:'',href:'https://example.test/v/test',pathname:'/v/test'};
const v={id:'test',slug:'test',name_mr:'गाव',site_settings:{},home_sections:['gallery_notice','leaders_schemes','services_video','news','projects']};
for(const root of ['..','../apps/admin','../apps/public']){
 const mod=async name=>import(`${root}/src/${name}.js`);
 const {renderShamvadiHomepage:home}=await mod('homepage');
 const {renderAboutPage:about}=await mod('about');
 const {renderServicesPage:services}=await mod('services');
 const {renderGalleryPage:gallery}=await mod('gallery');
 const {renderProjectsPage:projects}=await mod('projects');
 const {renderNewsPage:news}=await mod('news');
 const {renderNoticesPage:notices}=await mod('notices');
 const {mergeReferenceRows:merge}=await mod('services-reference');
 const h=home(v,[],'mr',false); assert.equal((h.match(/sv66-profile-placeholder/g)||[]).length,6); assert(h.includes('/assets/placeholders/portrait.svg')); assert(h.includes('/assets/placeholders/photo.svg')); assert.equal((h.match(/data-slider="svHero"/g)||[]).length,5);
 const a=about(v,[],'mr'); assert(a.includes('/assets/placeholders/portrait.svg')); assert(!a.includes('sv-a-placeholder-stripe'));
 const official={kind:'officials',status:'published',title_mr:'Uploaded official',subtitle_mr:'Role',image_url:'https://example.test/real.webp'};
 for(const text of [home(v,[official],'mr',false),about(v,[official],'mr')]){assert(text.includes('https://example.test/real.webp'));assert(text.includes('Uploaded official'));}
 for(const render of [gallery,projects,news])assert(render(v,[],'mr').includes('/assets/placeholders/photo.svg'));
 const s=services(v,[],'mr');assert(s.includes('Right_to_Service_Form_2.pdf'));assert(!s.includes('Right_to_Service_Form_1.pdf'));assert(!s.includes('sv-l-other-form-copies'));assert(!s.includes('Gramsoft_Form_2.pdf'));
 const record={kind:'service_forms',slug:'citizen-services-application',status:'published',title_mr:'My form',external_url:'/assets/forms/V_Swaraj_Gramsoft_Form_2.pdf'};
 assert(merge([record],'service_forms').find(x=>x.slug===record.slug).external_url.endsWith('Right_to_Service_Form_2.pdf'));
 assert(merge([{...record,external_url:'https://example.test/custom.pdf'}],'service_forms').find(x=>x.slug===record.slug).external_url.endsWith('custom.pdf'));
 assert(services(v,[{...record,slug:'new-pdf',external_url:'https://example.test/additional.pdf'}],'mr').includes('additional.pdf'));
 assert(!notices(v,[],'mr').includes('Right_to_Service_Form_2.pdf'));
 for(const f of ['portrait','photo'])assert((await readFile(new URL(`${root}/assets/placeholders/${f}.svg`,import.meta.url),'utf8')).startsWith('<svg'));
 const pdf=await readFile(new URL(`${root}/assets/forms/V_Swaraj_Gramsoft_Right_to_Service_Form_2.pdf`,import.meta.url));assert.equal(createHash('sha256').update(pdf).digest('hex'),'cff9d0bcadca82298369179471b73c0923220fa1c6d6692ecb1c2099072d1f9b');
 console.log('PASS',root,'placeholder render, real photo, PDF defaults and overrides, extra forms, RTI separation');
}

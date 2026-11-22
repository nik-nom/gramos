/** GramOS Lokseva: one page for /demo/services and /v/:slug/services.
 * Screenshot-matched template cards + the user's unaltered V Swaraj PDF forms.
 * Existing published per-village content overrides cards with the same slug.
 */
import {esc,loc,safeLink,safePdfURL,imageURL} from './utils.js';
import {mergeReferenceRows,referenceFormsPaths} from './services-reference.js';
const tr=(l,m,e)=>l==='mr'?m:e;
const setting=(v,key,l)=>String(v.site_settings?.[`${key}_${l}`]||v.site_settings?.[`${key}_${l==='mr'?'en':'mr'}`]||'');
const metadata=(entry,key,l)=>String(entry.details?.[`${key}_${l}`]||entry.details?.[`${key}_${l==='mr'?'en':'mr'}`]||'');
const lines=value=>String(value||'').split(/\r?\n/).map(s=>s.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
const bullets=value=>lines(value).length?`<ul>${lines(value).map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:'';
const cfg=(v,key,l,mr,en)=>setting(v,key,l)||tr(l,mr,en);
const tabs=[
 ['all','सर्व पहा','View all'],['available','उपलब्ध लोकसेवा','Available services'],
 ['steps','अर्ज प्रक्रिया','Application steps'],['forms','अर्ज नमुना डाउनलोड करा','Download forms'],
 ['links','नागरिक सेवा लिंक','Citizen service links'],['qr','कर भरणा QR Code','Tax payment QR code']
];
const tabTitle=(v,id,l)=>{
 const k=['steps','forms','links','qr'].includes(id)?id:'available';
 const [mr,en]=tabs.find(x=>x[0]===id)?.slice(1)||['लोकसेवा','Services'];
 return id==='all'?cfg(v,'services_all_heading',l,mr,en):cfg(v,`services_${k}_heading`,l,mr,en);
};
const rows=(items,kind,preview=false)=>mergeReferenceRows(items,kind,preview);
function available(v,items,l,prefix,preview=false){
 const list=rows(items,'services',preview);
 return `<section class="sv-l-section sv-l-available"><h2>${esc(tabTitle(v,'available',l))}</h2>
 <div class="sv-l-services">${list.map((x,i)=>{
   const required=metadata(x,'required_documents',l),process=metadata(x,'process',l);
   const fee=metadata(x,'fee',l),duration=metadata(x,'duration',l);
   return `<article class="sv-l-service" id="${prefix}-service-${i}">
    <h3>${esc(loc(x,'title',l))}</h3>
    ${loc(x,'body',l)?`<p>${esc(loc(x,'body',l))}</p>`:''}
    ${required?`<div class="sv-l-detail"><h4>${esc(cfg(v,'services_documents_label',l,'आवश्यक कागदपत्रे','Required documents'))}:</h4>${bullets(required)}</div>`:''}
    ${process?`<div class="sv-l-detail"><h4>${esc(cfg(v,'services_process_label',l,'प्रक्रिया','Procedure'))}:</h4>${bullets(process)}</div>`:''}
    ${safeLink(x.external_url)?`<a class="sv-l-service-pdf" href="${esc(safeLink(x.external_url))}" target="_blank" rel="noopener noreferrer">${tr(l,'संबंधित दुवा उघडा','Open related link')} ↗</a>`:''}
    ${(fee||duration)?`<div class="sv-l-chips">${fee?`<span><b>${esc(cfg(v,'services_fee_label',l,'शुल्क','Fee'))}:</b> ${esc(fee)}</span>`:''}${duration?`<span><b>${esc(cfg(v,'services_time_label',l,'वेळ','Time'))}:</b> ${esc(duration)}</span>`:''}</div>`:''}
   </article>`;
 }).join('')}</div></section>`;
}
function steps(v,items,l,preview=false){
 const list=rows(items,'service_steps',preview);
 return `<section class="sv-l-section sv-l-steps"><h2>${esc(tabTitle(v,'steps',l))}</h2>
 <div class="sv-l-step-grid">${list.map((x,i)=>`<article class="sv-l-step"><span class="sv-l-step-number">${i+1}</span><div><h3>${esc(loc(x,'title',l))}</h3><p>${esc(loc(x,'body',l))}</p></div></article>`).join('')}</div>
 </section>`;
}
const userSuppliedRightToServiceCopies=Object.freeze([
 '/assets/forms/V_Swaraj_Gramsoft_Right_to_Service_Form_1.pdf',
 '/assets/forms/V_Swaraj_Gramsoft_Right_to_Service_Form_2.pdf'
]);
const pdfURL=url=>{
 if(referenceFormsPaths.has(url))return url; // fixed same-origin, bundled immutable PDF files
 return safePdfURL(url); // uploaded village PDF must be HTTPS and end with .pdf
};
function forms(v,items,l,preview=false){
 const list=rows(items,'service_forms',preview);
 return `<section class="sv-l-section sv-l-forms"><h2>${esc(tabTitle(v,'forms',l))}</h2>
 <div class="sv-l-form-grid">${list.map(x=>{const url=pdfURL(x.external_url),builtin=referenceFormsPaths.has(url);
 return `<article class="sv-l-download"><h3>${esc(loc(x,'title',l))}</h3>
 ${!x.template_default&&loc(x,'body',l)?`<p>${esc(loc(x,'body',l))}</p>`:''}
 ${url?`<a href="${esc(url)}" ${builtin?'download':''} ${builtin?'':'target="_blank" rel="noopener noreferrer"'} aria-label="${esc(loc(x,'title',l))} — ${tr(l,'PDF डाउनलोड करा','Download PDF')}">${tr(l,'डाउनलोड करा','Download')}</a>`:`<span class="sv-l-download-unavailable">${tr(l,'दस्तऐवज अद्याप जोडलेला नाही','Document not uploaded')}</span>`}
 ${builtin&&x.slug==='citizen-services-application'?`<details class="sv-l-other-form-copies"><summary>${tr(l,'इतर PDF प्रती','Other PDF copies')}</summary><div>${userSuppliedRightToServiceCopies.map((copy,index)=>`<a href="${copy}" download>${tr(l,'अर्ज नमुना','Application form')} ${index+1} (PDF)</a>`).join('')}</div></details>`:''}
 </article>`;}).join('')}</div></section>`;
}
function citizenLinks(v,items,l,preview=false){
 const list=rows(items,'service_links',preview);
 const allowedColors=new Set(['blue','gray','yellow','green','peach','lavender']);
 return `<section class="sv-l-section sv-l-links"><h2>${esc(tabTitle(v,'links',l))}</h2>
 <div class="sv-l-link-grid">${list.map(x=>{
   const href=safeLink(x.external_url);
   const color=allowedColors.has(x.details?.color)?x.details.color:'blue';
   const title=esc(loc(x,'title',l));
   return `<article class="sv-l-link-card sv-l-link-${color}"><h3>${title}</h3>
    ${href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${title}">${esc(href.replace(/^https:\/\//,''))}</a>`:
    `<span class="sv-l-link-no-url">${tr(l,'अधिकृत लिंक अद्याप जोडलेली नाही.','Official link not added yet.')}</span>`}</article>`;
 }).join('')}</div></section>`;
}
function qrPanel(v,l){
 const raw=String(v.site_settings?.services_payment_qr_url||'');
 const qr=imageURL(raw);
 return `<section class="sv-l-section sv-l-payment"><h2>${esc(tabTitle(v,'qr',l))}</h2>
 <div class="sv-l-payment-panel"><div><h3>${tr(l,'कर भरण्यासाठी QR Code','QR code for tax payment')}</h3>
 <p>${tr(l,'संबंधित ग्रामपंचायतीने मंजूर केलेला QR Code ॲडमिनमधून जोडल्यानंतरच येथे दिसेल.','The QR code appears only after the village admin supplies the verified payment code.')}</p></div>
 ${qr?`<img class="sv-l-qr" src="${esc(qr)}" alt="${tr(l,'ग्रामपंचायत कर भरणा QR Code','Village tax payment QR code')}" loading="lazy">`:
 `<div class="sv-l-qr-placeholder">${tr(l,'या गावासाठी कर भरणा QR Code अद्याप जोडलेला नाही.','No tax payment QR code has been added for this village.')}</div>`}</div></section>`;
}
export function renderServicesPage(v,items,l,preview=false){
 // The demo's earlier illustrative rows do not duplicate the complete shared template.
 const sourceItems=v.id==='demo'?[]:items;
 const pageTitle=cfg(v,'services_page_title',l,'उपलब्ध लोकसेवा','Available Citizen Services');
 const intro=cfg(v,'services_intro',l,'सेवा हक्क अधिनियम अंतर्गत ग्रामपंचायतीकडून देण्यात येणाऱ्या सेवांची माहिती व अर्ज प्रक्रिया','Information and application procedures for Gram Panchayat citizen services');
 const activeParam=new URLSearchParams(location.search||'').get('serviceTab');
 const active=tabs.some(x=>x[0]===activeParam)?activeParam:'all';
 const sections={available:available(v,sourceItems,l,'services-only',preview),steps:steps(v,sourceItems,l,preview),forms:forms(v,sourceItems,l,preview),links:citizenLinks(v,sourceItems,l,preview),qr:qrPanel(v,l)};
 const combined=available(v,sourceItems,l,'services-all',preview)+sections.steps+sections.forms;
 return `<div class="sv-services-page"><header class="sv-l-intro sv-wrap"><h1>${esc(pageTitle)}</h1><p>${esc(intro)}</p>
 <div class="sv-l-tabs" role="tablist" aria-label="${esc(pageTitle)}">${tabs.map(([id])=>`<button class="sv-l-tab ${id===active?'active':''}" id="services-tab-${id}" type="button" role="tab" data-action="service-tab" data-tab="${id}" aria-controls="services-panel-${id}" aria-selected="${id===active}" tabindex="${id===active?'0':'-1'}">${esc(tabTitle(v,id,l))}</button>`).join('')}</div></header>
 <div class="sv-wrap sv-l-content">${tabs.map(([id])=>`<section id="services-panel-${id}" class="sv-service-tabpanel" role="tabpanel" aria-labelledby="services-tab-${id}" ${id===active?'':'hidden'}>${id==='all'?combined:sections[id]}</section>`).join('')}</div></div>`;
}

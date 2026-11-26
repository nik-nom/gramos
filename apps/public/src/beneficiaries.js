/** Published village beneficiary scheme links. No citizen PII rendered or imported. */
import {esc,loc} from './utils.js?v=6.9.3';
const tr=(l,m,e)=>l==='mr'?m:e;
const order=(a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.created_at||'').localeCompare(String(b.created_at||''));
const idOK=s=>/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(s||''));
const goodFile=(v,item)=>Boolean(item.details?.public_file_approved===true && typeof item.details?.file_path==='string' && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.xlsx$/i.test(item.details.file_path) && item.details.file_path.startsWith(v.id+'/') && idOK(item.id));
function listCard(v,item,language){
 const name=loc(item,'title',language),description=loc(item,'body',language);
 const approved=goodFile(v,item);
 const url=`/api/beneficiary-file?v=${encodeURIComponent(v.slug)}&id=${encodeURIComponent(item.id)}`;
 return `<article class="sv-bene-card"><div class="sv-bene-card-icon" aria-hidden="true">▤</div><h3>${esc(name)}</h3>${description?`<p>${esc(description)}</p>`:''}<div class="sv-bene-card-foot">${approved?`<a class="sv-bene-download" href="${esc(url)}" rel="nofollow">${tr(language,'Excel यादी डाउनलोड करा','Download Excel list')} ↓</a>`:`<span class="sv-bene-awaiting">${tr(language,'यादी लवकरच उपलब्ध होईल','List not yet available')}</span>`}</div></article>`;
}
export function renderBeneficiarySections(v,items,lang='mr'){
 const ss=v.site_settings||{};
 const val=(k,m,e)=>String(ss[`${k}_${lang}`]||ss[`${k}_${lang==='mr'?'en':'mr'}`]||tr(lang,m,e));
 const entries=(items||[]).filter(i=>i.kind==='beneficiary_lists'&&i.status==='published').sort(order);
 const schemes=(items||[]).filter(i=>i.kind==='schemes'&&i.status==='published').sort(order);
 const home=v.id==='demo'?'/demo':`/v/${encodeURIComponent(v.slug)}`;
 return `<div class="sv-bene-page sv-bene-embedded"><section class="sv-wrap sv-bene-section"><h2>${esc(val('beneficiaries_lists_heading','योजनानिहाय लाभार्थी याद्या','Scheme-wise Beneficiary Lists'))}</h2>${entries.length?`<div class="sv-bene-grid">${entries.map(i=>listCard(v,i,lang)).join('')}</div>`:`<div class="sv-bene-empty">${tr(lang,'अद्याप कोणतीही यादी प्रकाशित झालेली नाही.','No beneficiary lists have been published yet.')}</div>`}</section><section class="sv-wrap sv-bene-section sv-bene-schemes"><div class="sv-bene-section-heading"><h2>${esc(val('beneficiaries_schemes_heading','इतर शासकीय योजना','Other Government Schemes'))}</h2><a href="${home}/schemes">${tr(lang,'सर्व योजना पहा','View all schemes')} →</a></div>${schemes.length?`<div class="sv-bene-scheme-grid">${schemes.map(i=>`<a href="${home}/schemes" class="sv-bene-scheme-card"><strong>${esc(loc(i,'title',lang))}</strong><span>${tr(lang,'योजनेची माहिती पाहा','View scheme details')} →</span></a>`).join('')}</div>`:`<p class="sv-bene-empty">${tr(lang,'इतर योजनांची माहिती अद्याप प्रकाशित केलेली नाही.','No additional schemes published yet.')}</p>`}</section></div>`;
}

/** Legacy standalone renderer is retained for old deep links and integration tests.
 * Public routing embeds the same records inside the Yojana page instead. */
export function renderBeneficiariesPage(v,items,lang='mr'){
 const ss=v.site_settings||{};
 const title=String(ss[`beneficiaries_page_title_${lang}`]||tr(lang,'लाभार्थी यादी','Beneficiary Lists'));
 const description=String(ss[`beneficiaries_page_intro_${lang}`]||tr(lang,'ग्रामपंचायत योजनांच्या लाभार्थी याद्या व माहिती','Published scheme beneficiary lists and information'));
 return `<div class="sv-bene-standalone"><div class="sv-wrap sv-bene-intro"><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${renderBeneficiarySections(v,items,lang)}</div>`;
}

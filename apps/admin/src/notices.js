/** GramOS 2.9 — Shamvadi-style editable Notice Board.
 * Records are village-scoped content_items(kind='notices'); the admin sets
 * details.notice_type and the optional public PDF URL on external_url.
 */
import {esc,loc,safePdfURL} from './utils.js?v=6.9.2';
import {mergeReferenceNotices,referenceNoticePaths} from './notices-reference.js?v=6.9.2';
const tr=(l,mr,en)=>l==='mr'?mr:en;
const setting=(v,k,l)=>String(v.site_settings?.[`${k}_${l}`]||v.site_settings?.[`${k}_${l==='mr'?'en':'mr'}`]||'');
const cfg=(v,k,l,mr,en)=>setting(v,k,l)||tr(l,mr,en);
export const NOTICE_TYPES=['notice','financial','rti','resolutions'];
const defaultTabs={
  notice:['नोटीस/ सूचना','Notices / Announcements'],
  financial:['जमा खर्च अहवाल','Income & Expense Reports'],
  rti:['माहितीचा अधिकार - RTI','Right to Information — RTI'],
  resolutions:['महत्वाचे शासन निर्णय','Important Government Resolutions']
};
const typeOf=i=>NOTICE_TYPES.includes(i.details?.notice_type)?i.details.notice_type:'notice';
const byOrder=(a,b)=>(a.sort_order??0)-(b.sort_order??0)||(String(b.created_at||'').localeCompare(String(a.created_at||'')));
const listOf=(items,type)=>items.filter(i=>i.kind==='notices'&&typeOf(i)===type).sort(byOrder);
const dateLabel=(value,lang)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return '';
  const [y,m,d]=value.split('-');return `${d}/${m}/${y}`;
};
const card=(v,x,index,type,lang)=>{
  const url=(referenceNoticePaths.has(x.external_url)?x.external_url:safePdfURL(x.external_url))||(v.slug==='demo' && x.external_url==='/assets/reference-demo/notice-sample.pdf' ? x.external_url : '');
  const date=dateLabel(x.details?.event_date,lang);
  return `<article class="sv-n-card">
    <h3>${index+1}. ${esc(loc(x,'title',lang))}</h3>
    ${date?`<p class="sv-n-date"><span aria-hidden="true">▣</span><time datetime="${esc(x.details.event_date)}">${esc(date)}</time></p>`:''}
    ${loc(x,'body',lang)?`<p>${esc(loc(x,'body',lang))}</p>`:''}
    ${url?`<a class="sv-n-download" href="${esc(url)}" download="${esc(loc(x,'title',lang))}.pdf" ${referenceNoticePaths.has(url)?'':'target="_blank" rel="noopener noreferrer"'} aria-label="Download PDF — ${esc(loc(x,'title',lang))}">Download PDF</a>`:
       `<span class="sv-n-no-pdf">${esc(cfg(v,'notices_missing_pdf',lang,'PDF अद्याप अपलोड केलेले नाही.','PDF not uploaded yet.'))}</span>`}
  </article>`;
};
const pane=(v,items,type,lang)=>{
  const list=listOf(items,type);
  const name=defaultTabs[type];
  const heading=cfg(v,`notices_section_${type}`,lang,...name);
  return `<section class="sv-n-section"><h2><span class="sv-n-bell" aria-hidden="true">♟</span>${esc(heading)}</h2>
    ${list.length?`<div class="sv-n-grid">${list.map((x,i)=>card(v,x,i,type,lang)).join('')}</div>`:
      `<p class="sv-n-empty">${esc(cfg(v,'notices_empty',lang,'अद्याप कोणतीही माहिती प्रकाशित झालेली नाही.','No documents have been published yet.'))}</p>`}
  </section>`;
};
export function renderNoticesPage(v,items,lang,preview=false){
  const notices=mergeReferenceNotices(items,preview);
  const search=typeof location!=='undefined'?new URLSearchParams(location.search||''):new URLSearchParams();
  const requested=search.get('noticeTab');
  const selected=NOTICE_TYPES.includes(requested)?requested:'notice';
  return `<div class="sv-notices-page">
    <header class="sv-n-intro sv-wrap">
      <h1>${esc(cfg(v,'notices_page_title',lang,'नोटीस बोर्ड','Notice Board'))}</h1>
      <p>${esc(cfg(v,'notices_intro',lang,'सभा व कार्यक्रमांच्या सूचना, जमा खर्च अहवाल, माहितीच्या अधिकार अंतर्गत माहिती','Meeting notices, financial reports, RTI documents and official government resolutions'))}</p>
      <div class="sv-n-tabs" role="tablist" aria-label="${esc(tr(lang,'नोटीस बोर्ड विभाग','Notice Board categories'))}">
        ${NOTICE_TYPES.map(type=>`<button type="button" id="notices-tab-${type}" data-action="notice-tab" data-tab="${type}" role="tab" class="sv-n-tab ${type===selected?'active':''}" aria-controls="notices-panel-${type}" aria-selected="${type===selected}" tabindex="${type===selected?'0':'-1'}">${esc(cfg(v,`notices_tab_${type}`,lang,...defaultTabs[type]))}</button>`).join('')}
      </div>
    </header>
    <main class="sv-n-content sv-wrap">
      ${NOTICE_TYPES.map(type=>`<div class="sv-n-tabpanel" id="notices-panel-${type}" role="tabpanel" aria-labelledby="notices-tab-${type}" ${type===selected?'':'hidden'}>${pane(v,notices,type,lang)}</div>`).join('')}
    </main>
  </div>`;
}

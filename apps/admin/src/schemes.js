import {renderBeneficiarySections} from './beneficiaries.js?v=6.9.3';
import {mergeReferenceSchemes} from './schemes-reference.js?v=6.9.3';
/** GramOS 2.8: Editable Government Schemes page, shared by demo and every village. */
import {esc,loc,safeLink} from './utils.js?v=6.9.3';
const tr=(lang,mr,en)=>lang==='mr'?mr:en;
const setting=(v,key,l)=>String(v.site_settings?.[`${key}_${l}`]||v.site_settings?.[`${key}_${l==='mr'?'en':'mr'}`]||'');
const cfg=(v,key,l,mr,en)=>setting(v,key,l)||tr(l,mr,en);
const extra=(item,key,lang)=>String(item.details?.[`${key}_${lang}`]||item.details?.[`${key}_${lang==='mr'?'en':'mr'}`]||'');
const rows=value=>String(value||'').split(/\r?\n/).map(line=>line.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
const paragraphs=value=>String(value||'').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
const sectionMeta={
 individual:['वैयक्तिक लाभाच्या योजना','Individual Benefit Schemes'],
 public:['सार्वजनिक विकासाच्या योजना','Public Development Schemes']
};
const tabs=[['all','सर्व योजना','All Schemes'],['individual','वैयक्तिक लाभाच्या योजना','Individual Benefit Schemes'],['public','सार्वजनिक विकासाच्या योजना','Public Development Schemes']];
const cleanType=item=>['individual','public'].includes(item?.details?.scheme_type)?item.details.scheme_type:'individual';
const ordered=items=>items.filter(x=>x.kind==='schemes').sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
const tabName=(v,id,lang)=>{const x=tabs.find(t=>t[0]===id);return cfg(v,`schemes_tab_${id}`,lang,x[1],x[2]);};
const heading=(v,id,lang)=>cfg(v,`schemes_section_${id}`,lang,...sectionMeta[id]);
function infoBlock(v,item,key,labelKey,lang,defaultMR,defaultEN,mode='text'){
 const raw=extra(item,key,lang);
 if(!raw)return '';
 const label=cfg(v,labelKey,lang,defaultMR,defaultEN);
 if(mode==='list')return `<div class="sv-g-part"><strong>${esc(label)}:</strong><ul>${rows(raw).map(value=>`<li>${esc(value)}</li>`).join('')}</ul></div>`;
 return `<div class="sv-g-part"><strong>${esc(label)}:</strong>${paragraphs(raw).map(value=>`<p>${esc(value).replaceAll('\n','<br>')}</p>`).join('')}</div>`;
}
function card(v,item,lang){
 const title=loc(item,'title',lang);
 const d=item.details||{};
 const url=safeLink(item.external_url);
 const summary=loc(item,'body',lang);
 return `<article class="sv-g-card">
  <h3>${esc(title)}</h3><div class="sv-g-card-content">
  ${summary?`<div class="sv-g-part"><strong>${esc(cfg(v,'schemes_summary_label',lang,'थोडक्यात माहिती','Overview'))}:</strong>${paragraphs(summary).map(value=>`<p>${esc(value).replaceAll('\n','<br>')}</p>`).join('')}</div>`:''}
  ${infoBlock(v,item,'eligibility','schemes_eligibility_label',lang,'लाभार्थी पात्रता','Eligibility','list')}
  ${infoBlock(v,item,'benefits','schemes_benefits_label',lang,'लाभाचे स्वरूप','Benefits')}
  ${infoBlock(v,item,'documents','schemes_documents_label',lang,'कागदपत्रे','Required documents','list')}
  ${infoBlock(v,item,'process','schemes_process_label',lang,'अर्ज प्रक्रिया','How to apply','list')}
  ${infoBlock(v,item,'note','schemes_note_label',lang,'महत्त्वाची सूचना','Important note')}
  </div>
  ${url?`<a class="sv-g-card-link" href="${esc(url)}" rel="noopener noreferrer" target="_blank">${esc(cfg(v,'schemes_link_label',lang,'अधिकृत माहिती पाहा','Open official website'))} ↗</a>`:''}
 </article>`;
}
const schemeBase=v=>v.id==='demo'?'/demo':`/v/${encodeURIComponent(v.slug)}`;
const beneficiaryLink=(v,lang,active=false)=>`<a class="sv-g-tab sv-g-beneficiary-tab ${active?'active':''}" href="${schemeBase(v)}/beneficiaries" ${active?'aria-current="page"':''}>${esc(cfg(v,'schemes_tab_beneficiaries',lang,'लाभार्थी यादी','Beneficiary Lists'))}</a>`;
const schemeNav=(v,lang,selected,asSubpage=false)=>`<div class="sv-g-nav"><div class="sv-g-tabs" ${asSubpage?'aria-label="'+esc(tr(lang,'योजनांचे प्रकार','Scheme categories'))+'"':'role="tablist" aria-label="'+esc(tr(lang,'योजनांचे प्रकार','Scheme categories'))+'"'}>
 ${tabs.map(([id])=>asSubpage
  ?`<a class="sv-g-tab" href="${schemeBase(v)}/schemes?schemeTab=${id}">${esc(tabName(v,id,lang))}</a>`
  :`<button type="button" id="schemes-tab-${id}" class="sv-g-tab ${id===selected?'active':''}" role="tab" data-action="scheme-tab" data-tab="${id}" aria-controls="schemes-panel-${id}" aria-selected="${id===selected}" tabindex="${id===selected?'0':'-1'}">${esc(tabName(v,id,lang))}</button>`).join('')}
 </div>${beneficiaryLink(v,lang,asSubpage)}</div>`;
function section(v,items,id,lang){
 const list=ordered(items).filter(x=>cleanType(x)===id);
 return `<section class="sv-g-section sv-g-${id}"><h2><span class="sv-g-medal" aria-hidden="true">♙</span>${esc(heading(v,id,lang))}</h2>
 ${list.length?`<div class="sv-g-grid">${list.map(x=>card(v,x,lang)).join('')}</div>`:
 `<p class="sv-g-empty">${esc(cfg(v,`schemes_empty_${id}`,lang,'अद्याप कोणतीही योजना प्रकाशित झालेली नाही.','No schemes have been published yet.'))}</p>`}
 </section>`;
}
export function renderSchemesPage(v,items,lang,preview=false){
 const schemes=mergeReferenceSchemes(items,preview);
 const query=new URLSearchParams(location.search||'').get('schemeTab');
 const selected=tabs.some(t=>t[0]===query)?query:'all';
 return `<div class="sv-schemes-page">
  <header class="sv-g-intro sv-wrap">
   <h1>${esc(cfg(v,'schemes_page_title',lang,'शासकीय योजना','Government Schemes'))}</h1>
   <p>${esc(cfg(v,'schemes_intro',lang,'ग्रामपंचायतीशी संबंधित महत्त्वाच्या शासकीय योजनांची माहिती','Important government schemes relevant to the Gram Panchayat'))}</p>
   ${schemeNav(v,lang,selected)}
  </header>
  <main class="sv-g-content sv-wrap">
   ${tabs.map(([id])=>`<div class="sv-g-tabpanel" id="schemes-panel-${id}" role="tabpanel" aria-labelledby="schemes-tab-${id}" ${id===selected?'':'hidden'}>${id==='all'?section(v,schemes,'individual',lang)+section(v,schemes,'public',lang):section(v,schemes,id,lang)}</div>`).join('')}
  </main>
 </div>`;
}

/** The beneficiary list is a subpage within the Yojana menu, not a separate
 * top-level website section. The URL remains stable for links and SEO. */
export function renderYojanaBeneficiariesPage(v,items,lang='mr'){
 return `<div class="sv-schemes-page sv-yojana-beneficiaries">
  <header class="sv-g-intro sv-wrap"><h1>${esc(cfg(v,'schemes_page_title',lang,'शासकीय योजना','Government Schemes'))}</h1>
  <p>${esc(cfg(v,'schemes_intro',lang,'ग्रामपंचायतीशी संबंधित महत्त्वाच्या शासकीय योजनांची माहिती','Important government schemes relevant to the Gram Panchayat'))}</p>
  ${schemeNav(v,lang,'beneficiaries',true)}</header>
  <main class="sv-g-content sv-wrap">${renderBeneficiarySections(v,items,lang)}</main>
 </div>`;
}

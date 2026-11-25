/**
 * Shamvadi About Gram Panchayat page: six reference-aligned tabs.
 * Every village-specific fact, official, committee, facility and duty comes from
 * villages/site_settings or published content_items; no real village facts live here.
 */
import {esc,loc,imageURL,safeLink} from './utils.js';
import {FIXED_MISSION_MR,FIXED_MISSION_EN,FIXED_VALUES_MR,FIXED_VALUES_EN,FIXED_DUTIES} from './about-reference.js';
const tr=(l,m,e)=>l==='mr'?m:e;
const cfg=(v,key,l)=>String(v.site_settings?.[`${key}_${l}`]||v.site_settings?.[`${key}_${l==='mr'?'en':'mr'}`]||'');
const meta=(x,key,l)=>String(x?.details?.[`${key}_${l}`]||x?.details?.[`${key}_${l==='mr'?'en':'mr'}`]||'');
const all=(items,kind)=>items.filter(x=>x.kind===kind).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
const photo=(u,label)=>{const url=imageURL(u);return url?`<img src="${esc(url)}" alt="${esc(label)}" loading="lazy" decoding="async">`:`<img class="sv-a-avatar-placeholder" src="/assets/placeholders/portrait.svg" alt="" loading="lazy">`;};
const text=(s)=>esc(String(s||''));
const rows=(value)=>String(value||'').split('\n').map(s=>s.replace(/^\s*[-•]\s*/,'').trim()).filter(Boolean);
const bulletList=(value)=>rows(value).length?`<ul>${rows(value).map(line=>`<li>${text(line)}</li>`).join('')}</ul>`:'';
const empty=(l,v)=>`<p class="sv-a-empty">${text(v?.site_settings?.['about_empty_message_'+l]||tr(l,'या विभागासाठी माहिती ॲडमिनमधून प्रकाशित करा.','Publish information for this section from the admin.'))}</p>`;
const title=(v,k,l,fallbackMr,fallbackEn)=>cfg(v,k,l)||tr(l,fallbackMr,fallbackEn);
const tabs=[
 ['info','सर्व माहिती','All Information'],['officials','पदाधिकारी','Office Bearers'],
 ['staff','कर्मचारी','Staff'],['committees','ग्रामपंचायत समित्या','Committees'],
 ['facilities','ग्राम पायाभूत सुविधा','Village Facilities'],['duties','भूमिका व जबाबदाऱ्या','Roles & Duties']
];
function renderFacts(v,items,l){
 const facts=all(items,'about_facts');
 const fixed=[
  [tr(l,'ग्रामपंचायतीचे नाव','Gram Panchayat'),loc(v,'name',l)],
  [tr(l,'तालुका','Taluka'),loc(v,'taluka',l)],
  [tr(l,'जिल्हा','District'),loc(v,'district',l)]
 ].filter(([,value])=>value);
 const split=(type)=>facts.filter(f=>(f.details?.group||'basic')===type).map(x=>[loc(x,'title',l),meta(x,'value',l)||x.details?.value||loc(x,'body',l)]).filter(([k,val])=>k&&val);
 const list=(pairs)=>pairs.length?`<ul class="sv-a-facts">${pairs.map(([name,value])=>`<li><span>${text(name)} :</span> ${text(value)}</li>`).join('')}</ul>`:`<ul class="sv-a-facts sv-a-facts-empty"><li>${text(tr(l,'अधिक माहिती ॲडमिनमधून प्रकाशित करा.','Publish additional information from the admin.'))}</li></ul>`;
 const prim=split('basic'),pop=split('population');
 return `<section class="sv-a-primary sv-about-info sv-about-section">
   <h2 class="sv-a-heading">${text(cfg(v,'about_information_heading',l)||cfg(v,'about_info_heading',l)||tr(l,'ग्रामपंचायत माहिती','Gram Panchayat Information'))}</h2>
   <div class="sv-a-factgrid"><div><h3>${text(title(v,'about_primary_heading',l,'प्राथमिक माहिती','Basic Information'))}</h3>${list([...fixed,...prim])}</div>
   <div><h3>${text(title(v,'about_population_heading',l,'लोकसंख्या माहिती','Population Information'))}</h3>${list(pop)}</div></div>
  </section>`;
}
/** Fixed template bullets cannot be removed via village settings; admin fields append only. */
function renderMission(v,l){
 const extrasMission=v.id==='demo'?[]:rows(cfg(v,'about_mission',l));
 const extrasValues=v.id==='demo'?[]:rows(cfg(v,'about_vision',l));
 const first=(l==='mr'?FIXED_MISSION_MR:FIXED_MISSION_EN);
 const second=(l==='mr'?FIXED_VALUES_MR:FIXED_VALUES_EN);
 return `<section class="sv-about-pillars sv-about-section sv-a-pillars">
    <article><h2 class="sv-a-heading">◎ ${text(tr(l,'दृष्टिकोन व ध्येय','Vision and Mission'))}</h2>${bulletList([...first,...extrasMission].join('\n'))}</article>
    <article><h2 class="sv-a-heading">♧ ${text(tr(l,'मूलभूत मूल्ये','Core Values'))}</h2>${bulletList([...second,...extrasValues].join('\n'))}</article>
  </section>`;
}
/** Plain-text extra information. No nested cards and no photographs on All Information. */
function renderExtra(v,items,l){
 const list=all(items,'about_sections').filter(x=>loc(x,'title',l)||loc(x,'body',l));
 if(!list.length)return '';
 return `<section class="sv-about-section sv-a-extra-plain">
   <h2 class="sv-a-heading">${text(cfg(v,'about_sections_heading',l)||tr(l,'ग्रामपंचायतीची अधिक माहिती','More About the Village'))}</h2>
   ${list.map(x=>`<div class="sv-a-extra-entry">
     ${loc(x,'title',l)?`<h3>${text(loc(x,'title',l))}</h3>`:''}
     ${rows(loc(x,'body',l)).map(line=>`<p>${text(line)}</p>`).join('')}
   </div>`).join('')}
  </section>`;
}
function people(v,items,l,group){
 const candidates=all(items,'officials');
 const filtered=candidates.filter(x=>group==='staff'?x.details?.about_group==='staff':x.details?.about_group!=='staff');
 const placeholder=()=>`<article class="sv-a-person sv-a-person-placeholder"><img class="sv-a-avatar-placeholder" src="/assets/placeholders/portrait.svg" alt="" loading="lazy"><p class="sv-a-placeholder-label">${text(tr(l,'नाव अद्याप उपलब्ध नाही','Name not available'))}</p><p>${text(tr(l,'पद उपलब्ध नाही','Designation not available'))}</p></article>`;
 return filtered.length?`<div class="sv-a-people-grid">${filtered.map(x=>{
   const role=loc(x,'subtitle',l),ward=meta(x,'ward',l),phone=x.details?.phone||'', date=x.details?.elected_date||'';
   return `<article class="sv-a-person">${photo(x.image_url,loc(x,'title',l))}<h3>${text(loc(x,'title',l))}</h3>${role?`<span class="sv-a-role">${text(role)}</span>`:''}
    ${ward?`<p>${text(title(v,'about_label_ward',l,'वॉर्ड क्र.','Ward'))}: ${text(ward)}</p>`:''}
    ${phone?`<p>☎ <a href="tel:${esc(String(phone).replace(/[^+0-9]/g,''))}">${text(phone)}</a></p>`:''}
    ${date?`<p>${text(title(v,'about_label_elected',l,'निवड','Appointed'))}: ${text(date)}</p>`:''}</article>`;
  }).join('')}${Array.from({length:Math.max(0,3-filtered.length)},placeholder).join('')}</div>`:`<div class="sv-a-people-grid sv-a-people-grid-empty" aria-label="${tr(l,'अद्याप पदाधिकाऱ्यांची माहिती नाही','No officials published yet')}">
    ${Array.from({length:3},(_,i)=>`<article class="sv-a-person sv-a-person-placeholder" >
       <img class="sv-a-avatar-placeholder" src="/assets/placeholders/portrait.svg" alt="" loading="lazy">
       <p class="sv-a-placeholder-label">${text(tr(l,'नाव अद्याप उपलब्ध नाही','Name not available'))}</p><p>${text(tr(l,'पद उपलब्ध नाही','Designation not available'))}</p>
    </article>`).join('')}
  </div>`;
}
function committeeTables(v,items,l){
 const records=all(items,'committees'), declared=all(items,'committee_groups');
 const grouped=new Map();
 // A committee can exist with zero members. Its heading is managed independently.
 for(const group of declared){
   grouped.set(group.slug,{label:loc(group,'title',l),rows:[],order:group.sort_order||0});
 }
 for(const x of records){
   const heading=meta(x,'committee_title',l)||tr(l,'ग्रामपंचायत समिती','Panchayat Committee');
   const key=x.details?.committee_key||heading;
   if(!grouped.has(key))grouped.set(key,{label:heading,rows:[],order:x.sort_order||0});
   grouped.get(key).rows.push(x);
 }
 if(!grouped.size)return `<div class="sv-a-committee-empty sv-about-section"><div class="sv-a-table-scroll"><table class="sv-a-table"><thead><tr>
    <th>${text(title(v,'about_column_no',l,'अ.','No.'))}</th>
    <th>${text(title(v,'about_column_name',l,'नाव','Name'))}</th>
    <th>${text(title(v,'about_column_designation',l,'पदनाम','Designation'))}</th>
    <th>${text(title(v,'about_column_role',l,'समितीतील पद','Committee Role'))}</th>
   </tr></thead><tbody><tr><td colspan="4" class="sv-a-table-placeholder">${empty(l,v)}</td></tr></tbody></table></div></div>`;
 return [...grouped.values()].sort((a,b)=>a.order-b.order).map((g,i)=>`<section class="sv-a-committee sv-about-section"><h2 class="sv-a-heading">${i+1}) ${text(g.label)}</h2>
  ${g.rows.length?`<div class="sv-a-table-scroll"><table class="sv-a-table"><thead><tr>
    <th>${text(title(v,'about_column_no',l,'अ.','No.'))}</th><th>${text(title(v,'about_column_name',l,'नाव','Name'))}</th><th>${text(title(v,'about_column_designation',l,'पदनाम','Designation'))}</th><th>${text(title(v,'about_column_role',l,'समितीतील पद','Committee Role'))}</th>
   </tr></thead><tbody>${g.rows.map((x,j)=>`<tr><td>${j+1}</td><td>${text(loc(x,'title',l))}</td><td>${text(loc(x,'subtitle',l))}</td><td>${text(meta(x,'committee_role',l))}</td></tr>`).join('')}</tbody></table></div>`:empty(l,v)}</section>`).join('');
}
/**
 * The four reference infrastructure headings are always visible, in the same
 * order as the supplied village website screenshot. Numbers only come from
 * that village's published records or specifically assigned village settings.
 * An empty field is shown as "No Data", never another village's values.
 * Additional published cards are appended without replacing these headings.
 */
const INFRASTRUCTURE_LABELS = Object.freeze([
 {key:'population',mr:'ग्रामपंचायतीची लोकसंख्या',en:'Gram Panchayat Population',aliases:['population','total-population','village-population','लोकसंख्या']},
 {key:'households',mr:'एकूण कुटुंब संख्या',en:'Total Households',aliases:['households','total-households','families','कुटुंब']},
 {key:'job_card_households',mr:'जॉबकार्ड धारक कुटुंब संख्या',en:'Job Card Holder Households',aliases:['job-card','job-card-households','jobcard','जॉबकार्ड']},
 {key:'cctv',mr:'बसविण्यात आलेले CCTV',en:'Installed CCTV Cameras',aliases:['cctv','cctv-cameras','installed-cctv','सीसीटीव्ही']}
]);
const hasMetricValue=value=>value!==null&&value!==undefined&&String(value).trim()!=='';
function facilityCards(v,items,l){
 const saved=[...all(items,'about_facilities'),...all(items,'facilities')];
 const settings=v.site_settings||{};
 const used=new Set();
 const matches=(x,metric)=>{
   const tokens=[x.details?.reference_key,x.details?.facility_key,x.slug,x.title_mr,x.title_en]
      .filter(Boolean).map(t=>String(t).toLowerCase().trim());
   const keys=[metric.key,metric.mr,metric.en,...metric.aliases].map(s=>s.toLowerCase());
   // Exact aliases prevent job-card household metrics being mistaken for total households.
   return tokens.some(token=>keys.includes(token));
 };
 const card=(label,value,empty=false)=>`<article class="sv-a-facility${empty?' sv-a-facility-placeholder':''}"><h3>${text(label)}</h3><strong class="${empty?'sv-a-no-data':''}">${text(empty?'No Data':value)}</strong></article>`;
 const standard=INFRASTRUCTURE_LABELS.map(metric=>{
   const index=saved.findIndex((x,i)=>!used.has(i)&&matches(x,metric));
   const record=index>=0?saved[index]:null;
   if(index>=0)used.add(index);
   const stored=record ? (meta(record,'value',l)||record.details?.value||loc(record,'body',l)) : undefined;
   const configured=settings?.infrastructure_metrics?.[metric.key] ?? settings?.[`facility_${metric.key}`];
   const value=hasMetricValue(stored)?stored:configured;
   return card(metric[l],value,!hasMetricValue(value));
 });
 const extra=saved.flatMap((x,i)=>used.has(i)?[]:[card(loc(x,'title',l),meta(x,'value',l)||x.details?.value||loc(x,'body',l)||'—')]);
 return `<div class="sv-a-facility-background"><div class="sv-a-facility-grid">${[...standard,...extra].join('')}</div></div>`;
}

const palette=['#bf392b','#e86100','#974db6','#34495e','#149f88','#2983be','#eb7f1e','#20a85a'];
/** All eight reference responsibility cards are immutable; village records add to them. */
function dutyCards(v,items,l){
 const custom=all(items,'duties').filter(x=>!String(x.id||'').startsWith('demo-')&&!String(x.id||'').startsWith('v10-'));
 const assigned=new Set();
 const card=(x,i)=>{
  const color=/^#[0-9a-fA-F]{6}$/.test(x.accent||'')?x.accent:'#34495e';
  const symbol=String(x.icon||'●').slice(0,5);
  const heading=x['title_'+l]||x.title_mr;
  const supplement=custom.filter((it,index)=>{
   const same=String(it.title_mr||'').trim()===x.title_mr || String(it.details?.reference_key||'')===x.key;
   if(same)assigned.add(index);
   return same;
  }).flatMap(it=>rows(loc(it,'body',l)));
  const originals=l==='mr'?x.bullets_mr:x.bullets_en;
  return `<article class="sv-a-duty sv-about-section sv-a-duty-reference" data-reference-card="${text(x.key)}" style="--a-accent:${color}"><h3><span class="sv-a-duty-icon">${text(symbol)}</span>${text(heading)}</h3>${bulletList([...originals,...supplement].join('\n'))}</article>`;
 };
 const fixed=FIXED_DUTIES.map((x,i)=>card(x,i));
 const extras=custom.filter((_,i)=>!assigned.has(i)).map((x,i)=>{
  const color=/^#[0-9a-fA-F]{6}$/.test(x.details?.accent||'')?x.details.accent:'#34495e';
  const symbol=String(x.details?.icon||'●').slice(0,5);
  return `<article class="sv-a-duty sv-about-section sv-a-duty-extra" style="--a-accent:${color}"><h3><span class="sv-a-duty-icon">${text(symbol)}</span>${text(loc(x,'title',l))}</h3>${bulletList(loc(x,'body',l))}</article>`;
 });
 const both=[...fixed,...extras];
 return `<div class="sv-a-duties-grid"><div class="sv-a-duty-column">${both.filter((_,i)=>i%2===0).join('')}</div><div class="sv-a-duty-column">${both.filter((_,i)=>i%2===1).join('')}</div></div>`;
}
const aboutTabs=['info','officials','staff','committees','facilities','duties'];
const allowedElements=['text','bullets','table','tiles','image','heading'];
/** Extra editable page elements. Text is always escaped, never interpreted as HTML. */
function aboutElements(items,l,tab){
 const parts=all(items,'about_blocks').filter(x=>x.details?.about_tab===tab && !(tab==='info' && x.details?.element==='image'));
 return parts.map(x=>{
   const type=allowedElements.includes(x.details?.element)?x.details.element:'text';
   const heading=loc(x,'title',l),body=loc(x,'body',l),lines=rows(body);
   const image=tab==='info'?'':imageURL(x.image_url);
   let contents='';
   if(type==='bullets')contents=bulletList(body);
   else if(type==='table'){
     const header=meta(x,'columns',l).split('|').map(s=>s.trim()).filter(Boolean).slice(0,8);
     const records=lines.map(s=>s.split('|').map(v=>v.trim()).slice(0,8));
     const n=header.length||Math.max(1,...records.map(row=>row.length));
     contents=`<div class="sv-a-table-scroll"><table class="sv-a-table">${header.length?`<thead><tr>${header.map(h=>`<th>${text(h)}</th>`).join('')}</tr></thead>`:''}<tbody>${records.map(row=>`<tr>${Array.from({length:n},(_,i)=>`<td>${text(row[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
   } else if(type==='tiles')contents=`<div class="sv-a-custom-tiles">${lines.map(s=>{const [label,value]=s.split('|').map(y=>y.trim());return `<div class="sv-a-facility"><h3>${text(label)}</h3>${value?`<strong>${text(value)}</strong>`:''}</div>`;}).join('')}</div>`;
   else if(type==='image')contents=image?`<img class="sv-a-custom-image" loading="lazy" decoding="async" src="${esc(image)}" alt="${text(heading)}">`:`<img class="sv-a-custom-image" src="/assets/placeholders/photo.svg" alt="">`;
   else if(type==='text')contents=lines.length?`<div class="sv-a-custom-text">${lines.map(s=>`<p>${text(s)}</p>`).join('')}</div>`:'';
   const link=safeLink(x.external_url);
   return `<section class="sv-a-block sv-about-section sv-a-block-${type}">${heading?`<h2 class="sv-a-heading">${text(heading)}</h2>`:''}${contents}${type!=='image'&&image?`<img class="sv-a-custom-image" loading="lazy" decoding="async" src="${esc(image)}" alt="${text(heading)}">`:''}${link?`<a href="${esc(link)}" rel="noopener noreferrer" target="_blank">${tr(l,'अधिक माहिती','More information')} ↗</a>`:''}</section>`;
 }).join('');
}
export function renderAboutPage(v,items,l){
 const heading=title(v,'about_page_title',l,'ग्रामपंचायतीबद्दल','About Gram Panchayat');
 const intro=cfg(v,'about_intro',l)||loc(v,'tagline',l)||tr(l,'आम्ही आपल्या गावाच्या शाश्वत व समृद्ध विकासासाठी कटिबद्ध आहोत.','We are committed to the sustainable and prosperous development of our village.');
 const initial=new URLSearchParams(location.search||'').get('tab');
 const active=tabs.some(x=>x[0]===initial)?initial:'info';
 const tablabel=(id,m,e)=>title(v,`about_tab_${id}`,l,m,e);
 const content={
  info:`${renderFacts(v,items,l)}${renderMission(v,l)}
    <section class="sv-about-section sv-a-info-subsection"><h2 class="sv-a-heading">${text(title(v,'about_representatives_heading',l,'निवडून आलेले पदाधिकारी','Elected Representatives'))}</h2>${people(v,items,l,'representatives')}</section>
    <section class="sv-about-section sv-a-info-subsection"><h2 class="sv-a-heading">${text(title(v,'about_staff_heading',l,'कर्मचारी माहिती','Staff Information'))}</h2>${people(v,items,l,'staff')}</section>
    <section class="sv-about-section sv-a-info-subsection"><h2 class="sv-a-heading">${text(title(v,'about_committees_heading',l,'ग्रामपंचायत समित्या','Gram Panchayat Committees'))}</h2>${committeeTables(v,items,l)}</section>
    <section class="sv-about-section sv-a-info-subsection"><h2 class="sv-a-heading">${text(title(v,'about_facilities_heading',l,'ग्राम पायाभूत सुविधा','Village Facilities'))}</h2>${facilityCards(v,items,l)}</section>
    ${renderExtra(v,items,l)}${aboutElements(items,l,'info')}`,
  officials:`<h2 class="sv-a-heading">${text(title(v,'about_representatives_heading',l,'निवडून आलेले पदाधिकारी','Elected Representatives'))}</h2>${people(v,items,l,'representatives')}${aboutElements(items,l,'officials')}`,
  staff:`<h2 class="sv-a-heading">${text(title(v,'about_staff_heading',l,'कर्मचारी माहिती','Staff Information'))}</h2>${people(v,items,l,'staff')}${aboutElements(items,l,'staff')}`,
  committees:`<h2 class="sv-a-heading">${text(title(v,'about_committees_heading',l,'ग्रामपंचायत समित्या','Gram Panchayat Committees'))}</h2>${committeeTables(v,items,l)}${aboutElements(items,l,'committees')}`,
  facilities:`<h2 class="sv-a-heading">${text(title(v,'about_facilities_heading',l,'ग्राम पायाभूत सुविधा','Village Facilities'))}</h2>${facilityCards(v,items,l)}${aboutElements(items,l,'facilities')}`,
  duties:`<h2 class="sv-a-heading">${text(tr(l,'भूमिका व जबाबदाऱ्या','Roles & Responsibilities'))}</h2><p class="sv-a-duties-intro">${text(tr(l,'(कोण काय करते?)','Who does what?'))}</p>${dutyCards(v,items,l)}${aboutElements(items,l,'duties')}`
 };
 return `<div class="sv-about-page sv-about-v9 sv-about-shared sv-template-about">
  <section class="sv-about-pagebar sv-a-pagehead sv-wrap"><h1>${text(heading)}</h1>${intro?`<p>${text(intro)}</p>`:''}
   <div class="sv-a-tablist" role="tablist" aria-label="${text(heading)}">${tabs.map(([id,m,e])=>`<button type="button" data-action="about-tab" data-tab="${id}" role="tab" id="about-tab-${id}" aria-controls="about-panel-${id}" aria-selected="${id===active}" tabindex="${id===active?'0':'-1'}" class="sv-a-tab ${id===active?'active':''}">${text(tablabel(id,m,e))}</button>`).join('')}</div>
  </section>
  <div class="sv-wrap sv-about-content sv-a-content">${tabs.map(([id])=>`<section class="sv-a-tabpanel" id="about-panel-${id}" role="tabpanel" aria-labelledby="about-tab-${id}" ${id===active?'':'hidden'}>${content[id]}</section>`).join('')}</div>
 </div>`;
}

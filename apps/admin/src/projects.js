/** GramOS v2.7 - Editable Shamvadi Development Projects page */
import {esc,loc,imageURL} from './utils.js?v=6.9.3';
const tr=(l,m,e)=>l==='mr'?m:e;
const setting=(v,key,l)=>String(v.site_settings?.[`${key}_${l}`]||v.site_settings?.[`${key}_${l==='mr'?'en':'mr'}`]||'');
const cfg=(v,key,l,m,e)=>setting(v,key,l)||tr(l,m,e);
const sorted=items=>items.filter(i=>i.kind==='projects').sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
const tabs=[['all','सर्व माहिती','All Information'],['ongoing','सुरू असलेले प्रकल्प','Ongoing Projects'],['completed','पूर्ण झालेले प्रकल्प','Completed Projects'],['upcoming','आगामी प्रकल्प','Upcoming Projects']];
const validStatus=x=>['ongoing','completed','upcoming'].includes(x?.details?.project_status)?x.details.project_status:'unclassified';
const title=(v,id,l)=>{const t=tabs.find(x=>x[0]===id);return cfg(v,`projects_tab_${id}`,l,t[1],t[2]);};
const heading=(v,id,l)=>{
 const fallback={ongoing:['सुरू असलेले प्रकल्प','Ongoing Projects'],completed:['पूर्ण झालेले प्रकल्प','Completed Projects'],upcoming:['आगामी प्रकल्प','Upcoming Projects'],other:['इतर प्रकल्प','Projects awaiting classification']}[id];
 return cfg(v,`projects_section_${id}`,l,fallback[0],fallback[1]);
};
const empty=(v,id,l)=>{
 const fallback={ongoing:['कोणतेही प्रकल्प उपलब्ध नाहीत.','No ongoing projects available.'],completed:['कोणतेही पूर्ण प्रकल्प उपलब्ध नाहीत.','No completed projects available.'],upcoming:['आगामी प्रकल्प उपलब्ध नाहीत.','No upcoming projects available.'],other:['प्रकल्प स्थिती ॲडमिनमधून निवडा.','Set the project status from the admin dashboard.']}[id];
 return `<p class="sv-p-empty">${esc(cfg(v,`projects_empty_${id}`,l,fallback[0],fallback[1]))}</p>`;
};
function card(v,x,l){
 const image=imageURL(x.image_url);
 const d=x.details||{};
 const pair=(key)=>String(d[`${key}_${l}`]||d[`${key}_${l==='mr'?'en':'mr'}`]||'');
 const rows=[
   [cfg(v,'projects_name_label',l,'कामाचे नाव','Work name'),loc(x,'title',l)],
   [cfg(v,'projects_scheme_label',l,'योजना','Scheme'),pair('scheme')||loc(x,'subtitle',l)],
   [cfg(v,'projects_year_label',l,'वर्ष','Year'),d.project_year],
   [cfg(v,'projects_location_label',l,'ठिकाण','Location'),pair('location')],
   [cfg(v,'projects_info_label',l,'अधिक माहिती','More Information'),loc(x,'body',l)]
 ].filter(([,val])=>val!==undefined&&val!==null&&String(val).trim());
 return `<article class="sv-p-card">${image?`<div class="sv-p-image"><img src="${esc(image)}" alt="${esc(loc(x,'title',l))}" loading="lazy" decoding="async" width="340" height="240"></div>`:'<div class="sv-p-image"><img src="/assets/placeholders/photo.svg" alt=""></div>'}
  <div class="sv-p-card-body"><ul>${rows.map(([label,value])=>`<li><span class="sv-p-label">${esc(label)}:</span> ${esc(String(value))}</li>`).join('')}</ul></div></article>`;
}
function section(v,items,id,l){
 const filtered=sorted(items).filter(x=>validStatus(x)===id);
 return `<section class="sv-p-section sv-p-${id}"><h2>${esc(heading(v,id,l))}</h2>${filtered.length?`<div class="sv-p-grid">${filtered.map(x=>card(v,x,l)).join('')}</div>`:`<div class="sv-p-grid">${Array.from({length:3},()=>`<article class="sv-p-card"><div class="sv-p-image"><img src="/assets/placeholders/photo.svg" alt=""></div>${empty(v,id,l)}</article>`).join('')}</div>`}</section>`;
}
export function renderProjectsPage(v,items,l){
 const activeParam=new URLSearchParams(location.search||'').get('projectTab');
 const active=tabs.some(x=>x[0]===activeParam)?activeParam:'all';
 const included=['ongoing','completed','upcoming'];
 if(sorted(items).some(x=>validStatus(x)==='unclassified'))included.push('other');
 const all=included.map(id=>section(v,items,id,l)).join('');
 return `<div class="sv-projects-page"><header class="sv-p-intro sv-wrap"><h1>${esc(cfg(v,'projects_page_title',l,'विकास कामे व प्रकल्प','Development Works & Projects'))}</h1><p>${esc(cfg(v,'projects_intro',l,'ग्रामपंचायतीमार्फत केल्या जाणाऱ्या विकास कामे व प्रकल्पांची माहिती.','Information about development works and projects undertaken by the Gram Panchayat.'))}</p>
 <div class="sv-p-tabs" role="tablist" aria-label="${esc(tr(l,'प्रकल्प वर्ग','Project status'))}">${tabs.map(([id])=>`<button type="button" role="tab" id="projects-tab-${id}" class="sv-p-tab ${id===active?'active':''}" data-action="project-tab" data-tab="${id}" aria-controls="projects-panel-${id}" aria-selected="${id===active}" tabindex="${id===active?'0':'-1'}">${esc(title(v,id,l))}</button>`).join('')}</div></header>
 <main class="sv-p-content sv-wrap">${tabs.map(([id])=>`<div class="sv-project-tabpanel" role="tabpanel" id="projects-panel-${id}" aria-labelledby="projects-tab-${id}" ${id===active?'':'hidden'}>${id==='all'?all:section(v,items,id,l)}</div>`).join('')}</main></div>`;
}

import {esc,loc,imageURL,safeLink} from './utils.js?v=6.9.3';
export const PAGE_TARGETS=Object.freeze(['home','about','services','schemes','beneficiaries','projects','notices','news','gallery','contact','staff','leaders','facilities','pages']);
export const ELEMENT_TYPES=Object.freeze(['text','heading','list','image','link','stat']);
/** Safe HTML only; never allow an editor to inject arbitrary HTML or JS. */
export function renderPageElements(items,page,language='mr'){
  const blocks=(items||[]).filter(x=>x.kind==='page_elements'&&x.status==='published'&&x.details?.page_target===page)
    .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  if(!blocks.length)return '';
  return `<section class="sv-page-elements sv-wrap" aria-label="अधिक माहिती">${blocks.map(item=>{
    const type=item.details?.element || 'text', title=esc(loc(item,'title',language)),body=esc(loc(item,'body',language));
    if(type==='heading')return `<h2 class="sv-h2">${title}</h2>`;
    if(type==='list')return `<section class="sv-element"><h3>${title}</h3><ul>${String(loc(item,'body',language)||'').split('\n').map(v=>v.trim()).filter(Boolean).map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section>`;
    if(type==='image'){const url=imageURL(item.image_url);return `<figure class="sv-element"><img loading="lazy" decoding="async" src="${esc(url||'/assets/placeholders/photo.svg')}" alt="${title}"><figcaption>${title}</figcaption></figure>`;}
    if(type==='link'){const url=safeLink(item.external_url);return url?`<div class="sv-element"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${title} ↗</a></div>`:'';}
    if(type==='stat')return `<div class="sv-element sv-element-stat"><strong>${title}</strong><span>${body}</span></div>`;
    return `<section class="sv-element"><h3>${title}</h3><p>${body.replace(/\n/g,'<br>')}</p></section>`;
  }).join('')}</section>`;
}

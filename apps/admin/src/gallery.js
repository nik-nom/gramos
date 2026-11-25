/** GramOS v3.0 — editable image/video gallery grouped like the reference. */
import {esc,loc,imageURL,safeLink} from './utils.js?v=6.9.2';
import {gallerySlots,missingMediaSlots} from './media-slots.js?v=6.9.2';
const tr=(l,m,e)=>l==='mr'?m:e;
const get=(v,k,l)=>String(v.site_settings?.[`${k}_${l}`]||v.site_settings?.[`${k}_${l==='mr'?'en':'mr'}`]||'');
const cfg=(v,k,l,m,e)=>get(v,k,l)||tr(l,m,e);
export const GALLERY_TYPES=['meetings','campaigns','development','cultural','press','videos'];
const spec={all:['सर्व पहा','View all'],meetings:['सभा','Meetings'],campaigns:['अभियान उपक्रम','Campaigns & Initiatives'],development:['विकासकामे / योजना','Development / Schemes'],cultural:['सामाजिक व सांस्कृतिक कार्यक्रम','Social & Cultural Events'],press:['पेपर कात्रणे','Newspaper Clippings'],videos:['व्हिडिओ गॅलरी','Video Gallery']};
const category=x=>GALLERY_TYPES.includes(x.details?.gallery_type)?x.details.gallery_type:'meetings';
const ordered=items=>items.filter(i=>i.kind==='gallery'||i.kind==='videos').sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
const image=(x)=>imageURL(x.image_url)?`<img src="${esc(imageURL(x.image_url))}" loading="lazy" decoding="async" alt="${esc(loc(x,'title','mr')||loc(x,'title','en'))}">`:'<img src="/assets/placeholders/photo.svg" alt="" loading="lazy">';
const section=(v,items,l,type)=>{
 const isVideo=type==='videos'; const records=items.filter(x=>isVideo?x.kind==='videos':x.kind==='gallery'&&category(x)===type);
 const name=cfg(v,`gallery_section_${type}`,l,...spec[type]);
 const samples=type==='meetings'?missingMediaSlots(gallerySlots,records):[];
 const sampleTiles=samples.map(s=>`<figure class="sv-gallery-tile"><img src="${esc(s.sample_image)}" alt="" loading="lazy"><figcaption>${tr(l,'नमुना फोटो — गावाचा अधिकृत फोटो नाही','Sample photo — not an official village photo')}</figcaption></figure>`).join('');
 return `<section class="sv-gallery-group"><h2>${esc(name)}</h2>
 ${records.length||samples.length?`<div class="sv-gallery-tile-grid">${records.map(x=>{
 const url=isVideo?safeLink(x.external_url):imageURL(x.image_url);
 return `<figure class="sv-gallery-tile">${url?`<a ${isVideo?'target="_blank" rel="noopener noreferrer"':''} href="${esc(url)}" aria-label="${esc(loc(x,'title',l))}">${image(x)}${isVideo?'<span class="sv-gallery-play">▶</span>':''}</a>`:`<div class="sv-gallery-picture">${image(x)}</div>`}<figcaption>${esc(loc(x,'title',l))}</figcaption></figure>`;}).join('')}${sampleTiles}</div>`:
  `<div class="sv-gallery-tile-grid">${Array.from({length:3},()=>`<figure class="sv-gallery-tile"><img src="/assets/placeholders/photo.svg" alt=""><figcaption>${tr(l,'फोटो अद्याप उपलब्ध नाही','Media not available')}</figcaption></figure>`).join('')}</div>`}</section>`;
};
export function renderGalleryPage(v,items,l){const query=new URLSearchParams(location.search||'').get('galleryTab');const selected=query&&spec[query]?query:'all';const all=ordered(items);
return `<div class="sv-gallery-page"><header class="sv-gallery-intro sv-wrap"><h1>${esc(cfg(v,'gallery_page_title',l,'फोटो - व्हिडिओ गॅलरी आणि मीडिया','Photos, Videos & Media'))}</h1>${get(v,'gallery_page_intro',l)?`<p>${esc(get(v,'gallery_page_intro',l))}</p>`:''}
<div class="sv-gallery-tabs" role="tablist" aria-label="${tr(l,'फोटो गॅलरी विभाग','Media gallery categories')}">${Object.entries(spec).map(([key,label])=>`<button type="button" class="sv-gallery-tab ${key===selected?'active':''}" data-action="gallery-tab" data-tab="${key}" id="gallery-tab-${key}" role="tab" aria-controls="gallery-panel-${key}" aria-selected="${key===selected}" tabindex="${key===selected?'0':'-1'}">${esc(cfg(v,`gallery_tab_${key}`,l,...label))}</button>`).join('')}</div></header>
<main class="sv-gallery-content sv-wrap">${Object.keys(spec).map(key=>`<div class="sv-gallery-tabpanel" id="gallery-panel-${key}" role="tabpanel" aria-labelledby="gallery-tab-${key}" ${key===selected?'':'hidden'}>${key==='all'?GALLERY_TYPES.map(k=>section(v,all,l,k)).join(''):section(v,all,l,key)}</div>`).join('')}</main></div>`;}

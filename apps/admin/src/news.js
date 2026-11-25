/** GramOS v3.0 — Shamvadi-style news list and full-article page. */
import {esc,loc,imageURL,safeLink,formatDate} from './utils.js?v=6.9.2';
const tr=(l,m,e)=>l==='mr'?m:e;
const value=(v,k,l)=>String(v.site_settings?.[`${k}_${l}`]||v.site_settings?.[`${k}_${l==='mr'?'en':'mr'}`]||'');
const cfg=(v,k,l,m,e)=>value(v,k,l)||tr(l,m,e);
const base=v=>v.slug==='demo'?'/demo':`/v/${encodeURIComponent(v.slug)}`;
const ordered=items=>items.filter(i=>i.kind==='news').sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)||String(b.details?.event_date||b.created_at||'').localeCompare(String(a.details?.event_date||a.created_at||'')));
const pubDate=(i,l)=>i.details?.event_date?`${i.details.event_date.slice(8,10)}-${i.details.event_date.slice(5,7)}-${i.details.event_date.slice(0,4)}`:formatDate(i.created_at,l);
const writer=(i,l)=>i.details?.[`author_${l}`]||i.details?.[`author_${l==='mr'?'en':'mr'}`]||loc(i,'subtitle',l);
const photo=(i,cls)=>imageURL(i.image_url)?`<img class="${cls}" src="${esc(imageURL(i.image_url))}" loading="lazy" decoding="async" alt="${esc(loc(i,'title','mr')||loc(i,'title','en'))}">`:`<img class="${cls}" src="/assets/placeholders/photo.svg" alt="" loading="lazy">`;
const detailLink=(v,i)=>`${base(v)}/news/${encodeURIComponent(i.slug)}`;
const relatedLinks=(text)=>String(text||'').split('\n').map(row=>{const [title,...urlParts]=row.split('|');const url=safeLink(urlParts.join('|').trim());return title?.trim()&&url?{title:title.trim(),url}:null}).filter(Boolean).slice(0,8);
const short=(t,n=295)=>String(t||'').length>n?String(t).slice(0,n).trimEnd()+'…':String(t||'');
const shortCard=(v,i,l)=>`<article class="sv-news-list-card">
 <a class="sv-news-image-link" href="${detailLink(v,i)}">${photo(i,'sv-news-main-photo')}</a>
 <div class="sv-news-list-body"><h2><a href="${detailLink(v,i)}">${esc(loc(i,'title',l))}</a></h2>
 <time>${esc(pubDate(i,l))}</time>${writer(i,l)?`<h3>${esc(writer(i,l))}</h3>`:''}
 <p>${esc(short(loc(i,'body',l))).replaceAll('\n',' ')}</p>
 <a class="sv-news-read" href="${detailLink(v,i)}">${esc(cfg(v,'news_read_label',l,'वाचा','Read'))}</a></div></article>`;
const sidebar=(v,all,l,active='')=>`<aside class="sv-news-sidebar"><h2>${esc(cfg(v,'news_sidebar_heading',l,'बातम्या व मार्गदर्शक लेख','News & Guidance Articles'))}</h2><div class="sv-news-sidebar-rows">${all.slice(0,12).map(i=>`<a class="sv-news-sidebar-row ${i.slug===active?'is-current':''}" href="${detailLink(v,i)}">${photo(i,'sv-news-thumb')}<strong>${esc(loc(i,'title',l))}</strong></a>`).join('')||`<p class="sv-news-empty">${tr(l,'सध्या कोणत्याही बातम्या नाहीत.','No published news yet.')}</p>`}</div><div class="sv-news-pages" aria-label="News pages"><span>1</span></div></aside>`;
export function renderNewsPage(v,items,l){const all=ordered(items);const heading=cfg(v,'news_page_title',l,'बातम्या व मार्गदर्शक लेख','News & Guidance Articles');return `<div class="sv-news-page"><header class="sv-news-intro sv-wrap"><h1>${esc(heading)}</h1><p>${esc(cfg(v,'news_page_intro',l,'ग्रामपंचायत उपक्रम, कार्यक्रम बातम्या, महत्वाचे मार्गदर्शक लेख','Gram Panchayat activities, local events, news and important guidance'))}</p></header><main class="sv-news-layout sv-wrap"><section class="sv-news-main-grid" aria-label="${esc(heading)}">${all.length?all.map(i=>shortCard(v,i,l)).join(''):`${Array.from({length:3},()=>`<article class="sv-news-list-card"><img class="sv-news-main-photo" src="/assets/placeholders/photo.svg" alt=""><div class="sv-news-list-body"><p>${tr(l,'बातमी अद्याप उपलब्ध नाही','No news published yet')}</p></div></article>`).join('')}`}</section>${sidebar(v,all,l)}</main></div>`;}
export function renderNewsDetail(v,items,l,slug){const all=ordered(items);const i=all.find(i=>i.slug===slug);if(!i)return `<main class="sv-news-page sv-news-missing sv-wrap"><h1>${tr(l,'लेख सापडला नाही.','Article not found.')}</h1><a href="${base(v)}/news">← ${tr(l,'बातम्या','News')}</a></main>`;
 const body=loc(i,'body',l); const paragraphs=body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
 return `<div class="sv-news-detail-background"><div class="sv-news-detail-layout sv-wrap"><article class="sv-news-detail-article">
 <div class="sv-news-detail-image">${photo(i,'sv-news-featured')}${pubDate(i,l)?`<time class="sv-news-date-ribbon">▣ ${esc(pubDate(i,l))}</time>`:''}</div>
 <div class="sv-news-article-content"><h1>${esc(loc(i,'title',l))}</h1>${writer(i,l)?`<p class="sv-news-author">◉ ${esc(writer(i,l))}</p>`:''}
 <div class="sv-news-article-text">${paragraphs.map(x=>`<p>${esc(x).replaceAll('\n','<br>')}</p>`).join('')||'<p>—</p>'}</div>
 ${safeLink(i.external_url)?`<p><a class="sv-news-source-link" target="_blank" rel="noopener noreferrer" href="${esc(safeLink(i.external_url))}">${esc(i.details?.[`source_title_${l}`]||cfg(v,'news_source_label',l,'संबंधित माहिती','Related information'))} ↗</a></p>`:''}
 <nav class="sv-news-related" aria-label="संबंधित दुवे"><h2>${esc(cfg(v,'news_related_heading',l,'संबंधित लेख व दुवे','Related stories and links'))}</h2>
 <div class="sv-news-related-grid">${relatedLinks(i.details?.[`related_links_${l}`]||'').map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a>`).join('')}${all.filter(x=>x.slug!==i.slug).slice(0,3).map(x=>`<a href="${detailLink(v,x)}">${esc(loc(x,'title',l))} →</a>`).join('')}</div>
 <a class="sv-news-back" href="${base(v)}/news">← ${tr(l,'सर्व बातम्या पहा','View all news')}</a></nav>
 <div class="sv-news-share"><strong>${tr(l,'शेअर करा','Share')}</strong><button type="button" data-action="news-share" data-share="${esc(detailLink(v,i))}">${tr(l,'लेखाची लिंक कॉपी करा','Copy article link')}</button></div></div></article>${sidebar(v,all,l,slug)}</div></div>`;
}

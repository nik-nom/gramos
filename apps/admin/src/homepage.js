/**
 * GramOS / Shamvadi homepage.  Everything village-specific is read from
 * villages columns, villages.site_settings, or published content_items.
 * No village content is hardcoded into this renderer.
 */
import {esc,loc,icon,imageURL,safeLink,formatDate} from './utils.js';
import {socialUrl,SOCIAL_FIELDS} from './social.js';
import {MARATHI_SOCIAL_HEADING,platformLegalNotice} from './branding.js';
import {renderPageElements} from './page-elements.js';
const tr=(l,m,e)=>l==='mr'?m:e;
const get=(v,k,l)=>String(v.site_settings?.[`${k}_${l}`]||v.site_settings?.[`${k}_${l==='mr'?'en':'mr'}`]||'');
const linkFor=(v,key)=>`${v.slug==='demo'?'/demo':`/v/${encodeURIComponent(v.slug)}`}${key==='home'?'':`/${key}`}`;
const titles={home:['मुखपृष्ठ','Home'],about:['ग्रामपंचायतीबद्दल','About'],services:['लोकसेवा','Citizen Services'],projects:['विकासकामे','Development Works'],schemes:['योजना','Schemes'],beneficiaries:['लाभार्थी यादी','Beneficiary Lists'],notices:['नोटीस बोर्ड','Notice Board'],news:['बातम्या','News'],gallery:['फोटो गॅलरी','Photo Gallery'],contact:['संपर्क','Contact'],staff:['पदाधिकारी','Office Bearers'],leaders:['माननीय मंत्री व पदाधिकारी','Honourable Leaders'],facilities:['ग्राम पायाभूत सुविधा','Village Facilities'],pages:['महत्त्वाची पाने','Important Pages']};
const label=(key,l)=>(titles[key]||[key,key])[l==='mr'?0:1];
const by=(items,key)=>items.filter(x=>x.kind===key).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
const detail=(x,key,l)=>x.details?.[`${key}_${l}`]||x.details?.[`${key}_${l==='mr'?'en':'mr'}`]||'';
const img=(u,extra='',priority=false)=>imageURL(u)?`<img src="${esc(imageURL(u))}" ${extra} loading="${priority?'eager':'lazy'}" decoding="async" ${priority?'fetchpriority="high"':'fetchpriority="low"'}>`:`<img src="/assets/placeholders/photo.svg" ${extra} loading="lazy" decoding="async">`;
const heading=(text,extra='')=>`<h2 class="sv-h2">${esc(text)} ${extra}</h2>`;
const pill=(v,key,l,text='')=>`<a class="sv-pill" href="${linkFor(v,key)}">${esc(text||tr(l,'सर्व पहा','View all'))}</a>`;
function parseLines(s){return String(s||'').split('\n').map(x=>{const [a,...rest]=x.split('|');return {a:a?.trim(),b:rest.join('|').trim()};}).filter(x=>x.a);}
const xlink=(link,labelText)=>{const url=safeLink(link);return url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(labelText)}</a>`:'';};
export function homeTicker(v,l){
 const quote=get(v,'quote',l)||tr(l,'गोष्टी तशाच राहतात; जोपर्यंत त्या कुणी बदलत नाही.','Things remain unchanged until someone changes them.');
 // Screen-readers hear the announcement once, while the visual text moves.
 return `<div class="sv-ticker" role="region" aria-label="${esc(quote)}"><span class="sv-ticker-track" aria-hidden="true">${esc(quote)}</span></div>`;
}
export function homeHeader(v,l,navLanguage=l){
 const navText=get(v,'nav',navLanguage), parsed=parseLines(navText);
 const brandTitle=get(v,'brand_title',l)||tr(l,'ग्रामपंचायत ','Gram Panchayat ')+loc(v,'name',l);
 const brandSubtitle=get(v,'brand_subtitle',l)||tr(l,'ता. ','Tal. ')+loc(v,'taluka',l)+' '+tr(l,'जि. ','Dist. ')+loc(v,'district',l);
 const nav=parsed.length?parsed.map(x=>({key:x.a,label:x.b||label(x.a,navLanguage)})).filter(x=>titles[x.key]&&x.key!=='beneficiaries'):['home','about','services','projects','schemes','notices','news','gallery','contact'].map(key=>({key,label:label(key,navLanguage)}));
 // The header logo is configured per village, and used on ALL of that village's pages.
 const hs=v.site_settings||{};
 const logoURL=imageURL(hs.nav_logo_url)||imageURL(v.logo_url)||'/assets/gp-mark.svg';
 const logoSize=[40,52,64,72,84].includes(Number(hs.nav_logo_size))?Number(hs.nav_logo_size):72;
 const mobileLogoSize=[36,40,44,48,52,56,64].includes(Number(hs.nav_logo_mobile_size))?Number(hs.nav_logo_mobile_size):48;
 const fit=['cover','contain'].includes(hs.nav_logo_fit)?hs.nav_logo_fit:'contain';
 const shape=['square','rounded','circle'].includes(hs.nav_logo_shape)?hs.nav_logo_shape:'rounded';
 const position=['left','center','right'].includes(hs.nav_logo_position)?hs.nav_logo_position:'center';
 const logoHTML=img(logoURL,`class="sv-logo sv-nav-logo sv-nav-logo-${shape}" style="--gramos-nav-logo-size:${logoSize}px;--gramos-nav-mobile-logo-size:${mobileLogoSize}px;object-fit:${fit};object-position:${position}" alt="${esc(brandTitle)}" width="${logoSize}" height="${logoSize}"`,true);
 return `<header class="sv-header"><div class="sv-head-main"><a href="${linkFor(v,'home')}" class="sv-brand">${logoHTML}<span><strong>${esc(brandTitle)}</strong><small>${esc(brandSubtitle)}</small></span></a><button id="mobileMenu" class="sv-mobile" type="button" aria-label="Toggle menu">☰</button><nav id="publicNavItems" class="sv-menu" aria-label="Village navigation">${nav.map(x=>`<a href="${linkFor(v,x.key)}">${esc(x.label)}</a>`).join('')}<details class="sv-lang-picker"><summary class="sv-lang" aria-label="Select navigation language">${icon('globe')} <span class="sv-lang-name">${navLanguage==='mr'?'मराठी':'English'}</span><span aria-hidden="true">▾</span></summary><div class="sv-lang-options"><button type="button" data-action="set-nav-language" data-lang="mr" aria-current="${navLanguage==='mr'?'true':'false'}">मराठी</button><button type="button" data-action="set-nav-language" data-lang="en" aria-current="${navLanguage==='en'?'true':'false'}">English</button></div></details></nav></div></header>${homeTicker(v,l)}${v.id==='demo'?'<div class="sv-demo-warning">नमुना संकेतस्थळ — या पानावरील माहिती अधिकृत नाही.</div>':''}`;
}
function carousel(id,slides,cls,l){
 if(!slides.length)slides=Array.from({length:id==='svHero'?3:1},()=>({image_url:'/assets/placeholders/photo.svg',title_mr:'फोटो अद्याप उपलब्ध नाही',title_en:'Photo not available'}));
 return `<div class="${cls} sv-carousel" id="${id}" data-index="0" role="region" aria-label="${esc(tr(l,'फोटो स्लाइडशो','Photo slideshow'))}" aria-roledescription="carousel" tabindex="0">${slides.map((x,i)=>`<figure class="sv-slide ${i===0?'active':''}" aria-hidden="${i===0?'false':'true'}">${img(x.image_url,`alt="${esc(loc(x,'title',l)||'Slide')}"`,i===0&&id==='svHero')}</figure>`).join('')}<div class="sv-slide-dots">${slides.map((x,i)=>`<button type="button" aria-label="Show slide ${i+1}" aria-pressed="${i===0?'true':'false'}" class="${i===0?'active':''}" data-action="sv-dot" data-index="${i}" data-slider="${id}"></button>`).join('')}</div><div class="sv-carousel-buttons"><button type="button" aria-label="Previous photograph" data-action="sv-prev" data-slider="${id}">‹</button><button type="button" aria-label="Next photograph" data-action="sv-next" data-slider="${id}">›</button></div></div>`;
}
function hero(v,items,l){
 const banners=by(items,'banners').filter(x=>imageURL(x.image_url));
 if(!banners.length&&imageURL(v.hero_image_url))banners.push({id:'single',image_url:v.hero_image_url,title_mr:loc(v,'name','mr'),title_en:loc(v,'name','en')});
 return `${carousel('svHero',banners,'sv-hero',l)}<section class="sv-welcome"><h1>${esc(get(v,'welcome_title',l)||tr(l,'ग्रामपंचायत ','Gram Panchayat ')+loc(v,'name',l))}</h1><p>${esc(get(v,'welcome_subtitle',l)||loc(v,'tagline',l)||tr(l,'या अधिकृत संकेतस्थळावर आपले स्वागत आहे','Welcome to the official website'))}</p><a class="sv-welcome-button" href="${linkFor(v,'about')}">${esc(get(v,'welcome_button',l)||label('about',l))}</a></section>`;
}
function notices(v,items,l){return `<aside class="sv-notices">${heading('🔔 '+(get(v,'notices_heading',l)||label('notices',l)))}<div class="sv-notice-list">${by(items,'notices').slice(0,3).map(x=>`<a href="${linkFor(v,'notices')}"><strong>${esc(loc(x,'title',l))}</strong><small>${esc(x.details?.event_date||formatDate(x.created_at,l))}</small></a>`).join('')||`<div class="sv-empty">${tr(l,'सूचना उपलब्ध नाहीत','No notices published')}</div>`}</div>${pill(v,'notices',l)}</aside>`;}
function galleryNotice(v,items,l){return `<section class="sv-wrap sv-gallery-row"><div class="sv-gallery-area">${heading(get(v,'gallery_heading',l)||label('gallery',l))}${carousel('svGallery',by(items,'gallery').filter(x=>imageURL(x.image_url)),'sv-gallery-carousel',l)}<div class="sv-center">${pill(v,'gallery',l,tr(l,'सर्व फोटो पहा','View all photos'))}</div></div>${notices(v,items,l)}</section>`;}
function peopleCards(v,items,kind,l){
 const list=by(items,kind);
 const placeholder=()=>`<article class="sv-profile sv66-profile-placeholder"><img class="sv-profile-photo" src="/assets/placeholders/portrait.svg" alt="" width="132" height="170"><strong>${tr(l,'नाव अद्याप उपलब्ध नाही','Name not available')}</strong><small>${tr(l,'पद उपलब्ध नाही','Designation not available')}</small></article>`;
 if(!list.length)return `<div class="sv-profile-grid sv-profile-${kind}">${Array.from({length:3},placeholder).join('')}</div>`;
 const card=x=>`<a class="sv-profile" href="${linkFor(v,kind==='leaders'?'leaders':'staff')}">${img(imageURL(x.image_url)||'/assets/placeholders/portrait.svg',`class="sv-profile-photo" alt="${esc(loc(x,'title',l))}" width="132" height="170"`)}<strong>${esc(loc(x,'title',l))}</strong><small>${esc(loc(x,'subtitle',l))}</small></a>`;
 if(kind!=='leaders'||list.length<=3)return `<div class="sv-profile-grid sv-profile-${kind}">${list.map(card).join('')}${Array.from({length:Math.max(0,3-list.length)},placeholder).join('')}</div>`;
 const groups=[];for(let i=0;i<list.length;i+=3){const start=Math.min(i,list.length-3);groups.push(list.slice(start,start+3));}
 return `<div class="sv-profile-carousel" id="svLeaders" data-index="0" role="region" aria-label="${esc(label('leaders',l))}" tabindex="0">${groups.map((group,i)=>`<div class="sv-profile-grid sv-profile-leaders sv-profile-page" ${i?'hidden':''}>${group.map(card).join('')}</div>`).join('')}<div class="sv-profile-controls"><button type="button" data-action="profile-prev" aria-label="${tr(l,'मागील','Previous')}">‹</button>${groups.map((_,i)=>`<button type="button" data-action="profile-dot" data-index="${i}" aria-pressed="${i===0}" aria-label="${tr(l,'गट','Group')} ${i+1}" class="sv-profile-dot"></button>`).join('')}<button type="button" data-action="profile-next" aria-label="${tr(l,'पुढील','Next')}">›</button></div></div>`;
}
function leaderColumns(v,items,l){
 const schemes=[['individual','वैयक्तिक लाभाच्या योजना','Individual benefit schemes','users'],['public','सार्वजनिक विकासाच्या योजना','Public development schemes','document']];
 const s=v.site_settings||{};
 const contactInfo=[['⌂',tr(l,'ग्रामपंचायत','Gram Panchayat'),loc(v,'name',l)],['▥',tr(l,'तालुका','Taluka'),loc(v,'taluka',l)],['📍',tr(l,'जिल्हा','District'),loc(v,'district',l)]];
 const weatherUrl=safeLink(s.weather_embed_url||'');
 const main=`
   <section class="sv-people-panel">${heading(get(v,'leaders_heading',l)||label('leaders',l))}${peopleCards(v,items,'leaders',l)}</section>
   <section class="sv-people-panel">${heading(get(v,'officials_heading',l)||tr(l,'ग्रामपंचायत पदाधिकारी आणि कर्मचारी','Panchayat Officials and Staff'))}${peopleCards(v,items,'officials',l)}<div class="sv-center">${pill(v,'staff',l)}</div></section>
  `;
 const side=`
   <section class="sv-info-box sv-schemes-box">${heading('♜ '+(get(v,'schemes_heading',l)||tr(l,'शासकीय योजना','Government Schemes')))}<div class="sv-info-rows">${schemes.map(([key,mr,en,ico])=>`<a href="${linkFor(v,'schemes')}?schemeTab=${key}"><span class="sv-info-symbol" aria-hidden="true">${icon(ico)}</span><strong>${esc(tr(l,mr,en))}</strong><span class="sv-arrow" aria-hidden="true">›</span></a>`).join('')}</div><div class="sv-center">${pill(v,'schemes',l)}</div></section>
   <section class="sv-info-box sv-contact-box">${heading('▣ '+(get(v,'contact_heading',l)||tr(l,'संपर्क माहिती','Contact Information')))}<div class="sv-contact-list">${contactInfo.map(([ico,labelText,value])=>`<div class="sv-contact-detail"><span class="sv-info-symbol" aria-hidden="true">${ico}</span><span><small>${esc(labelText)}</small><strong>${esc(value||'—')}</strong></span></div>`).join('')}</div><div class="sv-center">${pill(v,'contact',l)}</div></section>
   <section class="sv-weather-box">${heading(get(v,'weather_heading',l)||tr(l,'लाईव्ह हवामान','Live Weather'))}${weatherUrl?`<a href="${esc(weatherUrl)}" target="_blank" rel="noopener noreferrer" class="sv-weather-link">${esc(get(v,'weather_link_label',l)||tr(l,'हवामान तपशील पहा','View weather details'))} ↗</a>`:`<p>${esc(get(v,'weather_placeholder',l)||tr(l,'अद्याप हवामान विजेट जोडलेले नाही.','No weather widget added yet.'))}</p>`}</section>
  `;
 return {main,side};
}
function aboutLeaders(v,items,l){
 const {main,side}=leaderColumns(v,items,l);
 return `<section class="sv-wrap sv-people-area"><div class="sv-people-main">${main}</div><aside class="sv-people-side">${side}</aside></section>`;
}
function servicesVideoColumns(v,items,l){
 const services=by(items,'services');const videos=by(items,'videos');
 const main=`<h2 class="sv-h2">${esc(get(v,'services_heading',l)||label('services',l))}</h2><div class="sv-services-grid">${services.slice(0,4).map(x=>`<article class="sv-service"><span class="sv-service-icon">${esc(x.details?.icon||'▤')}</span><div class="sv-service-copy"><h3>${esc(loc(x,'title',l))}</h3><p>${esc(loc(x,'body',l))}</p><a class="sv-news-home-read" href="${linkFor(v,'services')}">${tr(l,'सेवा माहिती पहा','View service details')} →</a></div></article>`).join('')||`<div class="sv-services-empty">${esc(tr(l,'लोकसेवेची माहिती ॲडमिनमधून प्रकाशित करा.','Publish citizen-service cards from the admin.'))}</div>`}</div><div class="sv-center">${pill(v,'services',l)}</div>`;
 const video=`<div class="sv-video-heading">${heading(get(v,'videos_heading',l)||tr(l,'व्हिडिओ गॅलरी','Video Gallery'))}</div><div class="sv-video-content">${videos.length?videos.slice(0,2).map(x=>`<a href="${esc(safeLink(x.external_url)||linkFor(v,'gallery'))}" target="_blank" rel="noopener noreferrer">${img(x.image_url,`alt="${esc(loc(x,'title',l))}"`)}<strong>${esc(loc(x,'title',l))}</strong></a>`).join(''):`<img src="/assets/placeholders/photo.svg" alt="" class="sv66-video-placeholder"><p class="sv-empty">${tr(l,'सध्या कोणतेही व्हिडिओ उपलब्ध नाहीत.','No videos available currently.')}</p>`}</div>`;
 return {main,video};
}
function servicesVideo(v,items,l){
 const {main,video}=servicesVideoColumns(v,items,l);
 return `<section class="sv-wrap sv-service-video" aria-label="${esc(get(v,'services_heading',l)||label('services',l))}"><div class="sv-service-column">${main}</div><aside class="sv-video">${video}</aside></section>`;
}
/** Staff and Lokseva share the LEFT track; weather and video share the RIGHT track.
 * Each track flows naturally to avoid blank rows and overlapping boxes. */
function leadersAndServices(v,items,l){
 const people=leaderColumns(v,items,l);
 const citizen=servicesVideoColumns(v,items,l);
 return `<section class="sv-wrap sv-people-area sv-joined-layout" aria-label="${esc(tr(l,'पदाधिकारी, लोकसेवा आणि हवामान','Village people and citizen services'))}">
   <div class="sv-people-main">${people.main}<div class="sv-service-video-main"><div class="sv-service-column">${citizen.main}</div></div></div>
   <aside class="sv-people-side">${people.side}<div class="sv-service-video-side"><div class="sv-video">${citizen.video}</div></div></aside>
  </section>`;
}
function news(v,items,l){return `<section class="sv-wrap sv-news"><h2 class="sv-h2">${esc(get(v,'news_heading',l)||label('news',l))}</h2><div class="sv-news-cards">${by(items,'news').slice(0,3).map(x=>`<article class="sv-news-card"><a href="${linkFor(v,'news')}/${encodeURIComponent(x.slug)}">${img(x.image_url,`alt="${esc(loc(x,'title',l))}"`)}</a><div class="sv-news-card-body"><h3><a href="${linkFor(v,'news')}/${encodeURIComponent(x.slug)}">${esc(loc(x,'title',l))}</a></h3><small>${esc(x.details?.event_date||formatDate(x.created_at,l))}</small><h4>${esc(detail(x,'author',l)||loc(x,'subtitle',l))}</h4><p>${esc(loc(x,'body',l))}</p></div></article>`).join('')||Array.from({length:3},()=>`<article class="sv-news-card"><img src="/assets/placeholders/photo.svg" alt=""><div class="sv-news-card-body"><p>${tr(l,'बातमी अद्याप उपलब्ध नाही','No news published yet')}</p></div></article>`).join('')}</div><div class="sv-center">${pill(v,'news',l)}</div></section>`;}
function projects(v,items,l){return `<section class="sv-wrap sv-projects">${heading(get(v,'projects_heading',l)||label('projects',l))}<div class="sv-project-grid">${by(items,'projects').slice(0,4).map(x=>`<article class="sv-project-card">${img(x.image_url,`alt="${esc(loc(x,'title',l))}"`)}<ul><li>${tr(l,'कामाचे नाव','Work')}: ${esc(loc(x,'title',l))}</li><li>${tr(l,'योजना','Scheme')}: ${esc(detail(x,'scheme',l))}</li><li>${tr(l,'वर्ष','Year')}: ${esc(x.details?.project_year||'')}</li><li>${tr(l,'ठिकाण','Location')}: ${esc(detail(x,'location',l))}</li><li>${tr(l,'अधिक माहिती','More information')}: ${String(loc(x,'body',l)).length>170?`<span>${esc(String(loc(x,'body',l)).slice(0,150))}…</span><details class="sv-more-panel"><summary>${tr(l,'पूर्ण माहिती पहा','Read more')}</summary><p>${esc(loc(x,'body',l))}</p></details>`:esc(loc(x,'body',l))}</li></ul></article>`).join('')||Array.from({length:4},()=>`<article class="sv-project-card"><img src="/assets/placeholders/photo.svg" alt=""><p>${tr(l,'प्रकल्प अद्याप उपलब्ध नाही','No project published yet')}</p></article>`).join('')}</div><div class="sv-center">${pill(v,'projects',l,tr(l,'सर्व प्रकल्प पहा','View all projects'))}</div></section>`;}
function facilities(v,items,l){
 const metrics=by(items,'metrics');return `<section class="sv-facilities"><div class="sv-wrap">${heading(get(v,'statistics_heading',l)||get(v,'facilities_heading',l)||tr(l,'ग्राम पायाभूत सुविधा','Village Infrastructure'))}<div class="sv-metric-cards">${metrics.map(x=>`<article class="sv-metric"><strong>${esc(loc(x,'title',l))}</strong><span>${esc(x.details?.value??'')}</span><small>${esc(loc(x,'body',l))}</small></article>`).join('')||'<p class="sv-empty">—</p>'}</div><div class="sv-center">${pill(v,'facilities',l)}</div></div></section>`;
}
/** Page-bottom logo lives in its own white band, OUTSIDE the footer. */
export function homeBottomLogo(v,l){
 const configured=v.site_settings?.footer_logos;
 // Only uploaded bottom logos belong in this strip. Never insert the village
 // name, emblem or other village's image as a placeholder on a real site.
 // The legacy footer_logo_url remains supported for existing villages.
 const urls=Array.isArray(configured)?configured.filter(url=>typeof url==='string'&&imageURL(url)).slice(0,12):[imageURL(v.site_settings?.footer_logo_url)].filter(Boolean);
 const logos=urls.length?urls:(v.id==='demo'?[imageURL(v.logo_url)].filter(Boolean):[]);
 if(!logos.length)return '';
 return `<section class="sv-page-logo-band" aria-label="${esc(tr(l,'संस्थांचे लोगो','Organization logos'))}"><div class="sv-wrap sv-page-logo-inner"><div class="sv-page-logo-grid" data-logo-count="${logos.length}">${logos.map((url,index)=>`<a href="${linkFor(v,'home')}" aria-label="${esc(tr(l,'लोगो','Logo'))} ${index+1}">${img(url,`class="sv-page-logo" alt="${esc(tr(l,'संस्थेचा लोगो','Organization logo'))} ${index+1}" width="90" height="90"`)}</a>`).join('')}</div></div></section>`;
}

/** The public Marathi section name uses Devanagari, not the old generic phrase. */
export function socialMediaHeading(v,l){
 const raw=String(v.site_settings?.[`footer_social_heading_${l}`]||'').trim();
 if(l==='mr')return MARATHI_SOCIAL_HEADING;
 return raw || tr(l,'सोशल मीडिया','Social Media');
}
export function footerLegalLine(v,l){
 // This legal imprint is platform-owned and intentionally cannot be changed
 // by village settings, drafts or the language selector.
 return {notice:platformLegalNotice(),credit:''};
}
export function homeFooter(v,l){
 const genericLinks=l==='mr'?
   'ग्रामविकास विभाग|https://rdd.maharashtra.gov.in/\nमहाराष्ट्र शासन|https://maharashtra.gov.in/\nई-ग्रामस्वराज|https://egramswaraj.gov.in/\nमनरेगा|https://nrega.dord.gov.in/\nशासन निर्णय|https://gr.maharashtra.gov.in/':
   'Rural Development|https://rdd.maharashtra.gov.in/\nMaharashtra Government|https://maharashtra.gov.in/\neGramSwaraj|https://egramswaraj.gov.in/';
 const links=parseLines(get(v,'links',l)||genericLinks);
 const pages=parseLines(get(v,'footer_pages',l));
 const nav=pages.length?pages.map(x=>({key:x.a,label:x.b||label(x.a,l)})).filter(x=>titles[x.key]&&x.key!=='beneficiaries'):['home','about','services','projects','schemes','notices','news','gallery','contact'].map(key=>({key,label:label(key,l)}));
 const socials=Object.keys(SOCIAL_FIELDS).filter(k=>socialUrl(k,v.site_settings?.[k]));
 const address=loc(v,'address',l).trim(), hours=get(v,'office_hours',l).trim();
 const contact=[
  address?`<p class="sv-footer-address"><span class="sv-footer-icon" aria-hidden="true">${icon('pin')}</span><span>${esc(address).replaceAll('\n','<br>')}</span></p>`:'',
  v.phone?`<p><span class="sv-footer-icon" aria-hidden="true">${icon('phone')}</span><a href="tel:${esc(String(v.phone).replace(/[^0-9+]/g,''))}">${esc(v.phone)}</a></p>`:'',
  v.email?`<p><span class="sv-footer-icon" aria-hidden="true">${icon('mail')}</span><a href="mailto:${esc(v.email)}">${esc(v.email)}</a></p>`:'',
  hours?`<p><span class="sv-footer-icon" aria-hidden="true">${icon('clock')}</span><span>${esc(hours)}</span></p>`:''
 ].filter(Boolean);
 const legal=footerLegalLine(v,l);
 const socialBodySaved=get(v,'footer_social_body',l);
 const oldDefaults=['ग्रामपंचायत कार्यालयाची अधिकृत समाज माध्यमे','ग्रामपंचायत कार्यालयाची अधिकृत सामाजिक माध्यमे','ग्रामपंचायतीची अधिकृत सोशल मीडिया खाती'];
 const socialBody=l==='mr'
   ? (!socialBodySaved.trim()||oldDefaults.includes(socialBodySaved.trim())?'ग्रामपंचायतीची अधिकृत समाजमाध्यम खाती':socialBodySaved)
   : socialBodySaved||'Official social media of the village office';
 return `<footer class="sv-footer"><div class="sv-wrap sv-footer-grid"><div class="sv-footer-column sv-footer-social"><h3><a href="${linkFor(v,'contact')}?contactTab=social">${esc(socialMediaHeading(v,l))}</a></h3><p>${esc(socialBody)}</p>${socials.length?socials.map(key=>xlink(socialUrl(key,v.site_settings[key]),SOCIAL_FIELDS[key].label)).join(''):`<a class="sv-footer-social-fallback" href="${linkFor(v,'contact')}?contactTab=social">${tr(l,'संपर्क करा','Contact us')} →</a>`}</div><div class="sv-footer-column sv-footer-useful"><h3><a href="${linkFor(v,'services')}">${esc(get(v,'footer_links_heading',l)||tr(l,'महत्वाची संकेतस्थळे','Important Websites'))}</a></h3><ul>${links.map(x=>`<li>${xlink(x.b,x.a)}</li>`).join('')}</ul></div><div class="sv-footer-column sv-footer-pages"><h3><a href="${linkFor(v,'about')}">${esc(get(v,'footer_pages_heading',l)||tr(l,'महत्वाची पाने','Important Pages'))}</a></h3><ul>${nav.map(x=>`<li><a href="${linkFor(v,x.key)}">${esc(x.label)}</a></li>`).join('')}<li><a href="${linkFor(v,'contact')}?contactTab=form">${tr(l,'नागरिक फॉर्म','Citizen form')}</a></li><li><a href="${linkFor(v,'services')}?serviceTab=forms">${tr(l,'PDF अर्ज','PDF forms')}</a></li><li class="sv-footer-yojana-child"><a href="${linkFor(v,'beneficiaries')}">${esc(label('beneficiaries',l))}</a></li></ul></div><div class="sv-footer-column sv-footer-contact"><h3><a href="${linkFor(v,'contact')}">${esc(get(v,'footer_contact_heading',l)||tr(l,'संपर्क माहिती','Contact Information'))}</a></h3>${contact.join('')||`<p class="sv-footer-contact-pending">${tr(l,'पत्ता, फोन किंवा ईमेल ॲडमिनमधून जोडा.','Add address, phone or email in Admin.')}</p>`}</div></div><div class="sv-wrap sv-copyright"><span class="sv-copyright-text">${esc(legal.notice)}${legal.credit?` <span class="sv-copyright-credit">${esc(legal.credit)}</span>`:''}</span><a class="sv-footer-admin" href="/admin/login">${esc(tr(l,'प्रशासन','Admin'))}</a></div></footer>`;
}

const blocks={gallery_notice:galleryNotice,leaders_schemes:aboutLeaders,services_video:servicesVideo,news,projects,facilities};
export const homeBlockKeys=Object.keys(blocks);
export function renderShamvadiHomepage(v,items,l,preview,navLanguage=l){
 const chosen=Array.isArray(v.home_sections)?v.home_sections.filter(x=>blocks[x]):homeBlockKeys;
 const rendered=[];
 for(let i=0;i<chosen.length;i++){
   if(chosen[i]==='leaders_schemes' && chosen[i+1]==='services_video'){
     rendered.push(leadersAndServices(v,items,l)); i++; continue;
   }
   rendered.push(blocks[chosen[i]](v,items,l));
 }
 return `<div class="sv-site">${homeHeader(v,l,navLanguage)}${preview?'<p class="sv-preview">Private preview: unpublished changes may be visible.</p>':''}<main id="main">${hero(v,items,l)}${rendered.join('')}${renderPageElements(items,'home',l)}</main>${homeBottomLogo(v,l)}${homeFooter(v,l)}<button class="sv-to-top" type="button" data-action="sv-top" aria-label="Back to top">⌃</button></div>`;
}

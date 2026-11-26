// Per-village metadata. Stored in villages.site_settings.seo, independently for each page.
// This module deliberately never sends private or unpublished record data to meta tags.
export const SEO_PAGES=Object.freeze(['home','about','services','projects','schemes','beneficiaries','notices','news','gallery','contact','staff','leaders','facilities','pages']);
export const SEO_LABELS=Object.freeze({
 home:'मुखपृष्ठ',about:'ग्रामपंचायतीबद्दल',services:'उपलब्ध लोकसेवा',
 projects:'विकास कामे व प्रकल्प',schemes:'शासकीय योजना',beneficiaries:'लाभार्थी यादी',notices:'नोटीस बोर्ड',
 news:'बातम्या व मार्गदर्शक लेख',gallery:'फोटो - व्हिडिओ गॅलरी आणि मीडिया',contact:'संपर्क',
 staff:'पदाधिकारी व कर्मचारी',leaders:'माननीय मंत्री व पदाधिकारी',facilities:'ग्राम पायाभूत सुविधा',pages:'महत्वाची पाने'
});
// Visible page headings are the SEO defaults whenever the admin leaves the Google title empty.
// This follows the actual reference design, and keeps a village's browser title
// synchronized with its editable on-page heading.
const HEADING_FIELDS=Object.freeze({
 about:'about_page_title_mr',services:'services_page_title_mr',projects:'projects_page_title_mr',
 schemes:'schemes_page_title_mr',beneficiaries:'beneficiaries_page_title_mr',notices:'notices_page_title_mr',news:'news_page_title_mr',
 gallery:'gallery_page_title_mr',contact:'contact_page_title_mr'
});
const safeHTTPS=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:'';}catch{return '';}};
export function resolveSEO(v,page='home',{origin='',preview=false,article=null,domainRoot=false}={}){
 const pageKey=SEO_PAGES.includes(page)?page:'home';
 const site=v?.site_settings||{};
 const meta=site.seo?.[pageKey]||{};
 const village=String(v?.name_mr||v?.name_en||'').trim();
 const villageTitle=`ग्रामपंचायत ${village}`.trim();
 const articleTitle=article?.title_mr||article?.title_en||'';
 const visibleHeading=String(site[HEADING_FIELDS[pageKey]]||SEO_LABELS[pageKey]||'').trim();
 const title=String(articleTitle?`${articleTitle} | ${villageTitle}`:(meta.title|| (pageKey==='home'?villageTitle:`${visibleHeading} | ${villageTitle}`))).trim().slice(0,150);
 const desc=String((article?.body_mr||article?.body_en||'').slice(0,190) || meta.description || (v?.tagline_mr||v?.tagline_en||'').trim() || `${villageTitle} — ${SEO_LABELS[pageKey]} आणि अधिकृत ग्रामपंचायत माहिती.`).trim().slice(0,320);
 const keywords=String(meta.keywords||'').trim().slice(0,350);
 const picture=safeHTTPS(article?.image_url||'')||safeHTTPS(meta.image_url||'')||safeHTTPS(pageKey==='home'?(v?.hero_image_url||v?.logo_url):(v?.logo_url||v?.hero_image_url));
 const canonicalBase=domainRoot?'':v?.slug==='demo'?'/demo':`/v/${encodeURIComponent(v?.slug||'')}`;
 const path=canonicalBase+(pageKey==='home'?'':`/${pageKey}`)+(article?.slug?`/${encodeURIComponent(article.slug)}`:'');
 const canonical=/^https?:\/\//.test(origin)?origin.replace(/\/$/,'')+(path||'/'):'';
 const robots=(preview||v?.slug==='demo'||v?.status!=='published'||meta.noindex===true||Boolean(article&&article.status!=='published'))?'noindex,nofollow':'index,follow';
 return {title,description:desc,keywords,image:picture,icon:safeHTTPS(v?.logo_url)||'/assets/gp-mark.svg',canonical,robots};
}
const setMeta=(name,content,attribute='name')=>{
 let node=[...document.querySelectorAll('meta')].find(m=>m.getAttribute(attribute)===name);
 if(!node){node=document.createElement('meta');node.setAttribute(attribute,name);document.head.appendChild(node);}
 node.setAttribute('content',content||'');
};
export function applyPublicMetadata(v,page,options={}){
 const data=resolveSEO(v,page,{...options,domainRoot:typeof document!=='undefined'&&!!document.querySelector?.('meta[name="gramos-domain-village"]'),origin:typeof location==='undefined'?'':location.origin});
 document.title=data.title;
 if(typeof document.querySelectorAll!=='function'||!document.head)return data;
 let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon);}
 favicon.href=data.icon;favicon.removeAttribute('type');
 setMeta('description',data.description);setMeta('keywords',data.keywords);
 setMeta('robots',data.robots);
 setMeta('og:title',data.title,'property');setMeta('og:description',data.description,'property');
 setMeta('og:type',options.article?'article':'website','property');setMeta('og:image',data.image,'property');
 setMeta('og:url',data.canonical,'property');setMeta('twitter:card',data.image?'summary_large_image':'summary');
 setMeta('twitter:title',data.title);setMeta('twitter:description',data.description);setMeta('twitter:image',data.image);
 let canonical=document.querySelector('link[rel="canonical"]');
 if(!canonical){canonical=document.createElement('link');canonical.setAttribute('rel','canonical');document.head.appendChild(canonical);}
 if(data.canonical)canonical.setAttribute('href',data.canonical);else canonical.removeAttribute('href');
 return data;
}
export function clearPublicMetadata(admin=false){
 document.title=admin?'GramOS Admin':'GramOS – Village directory';
 if(typeof document.querySelectorAll!=='function'||!document.head)return;
 const favicon=document.querySelector('link[rel="icon"]');if(favicon){favicon.href='/assets/gp-mark.svg';favicon.type='image/svg+xml';}
 setMeta('robots','noindex,nofollow');setMeta('description','');setMeta('keywords','');
 for(const property of ['og:title','og:description','og:image','og:url','og:type'])setMeta(property,'','property');
 for(const name of ['twitter:title','twitter:description','twitter:image'])setMeta(name,'');
 document.querySelector('link[rel="canonical"]')?.removeAttribute('href');
}

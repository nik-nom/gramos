import {api,accessRole,getSession} from './data.js?v=6.9.3';
const renderPublic=async(...args)=>(await import('./public.js?v=6.9.8')).renderPublic(...args);
import {renderAdmin,submitAdminForm,adminAction,imageUpload,documentUpload,excelUpload} from './admin.js?v=6.10.4';
import {previewCSV} from './admin-experience.js?v=6.9.3';
import {esc,notif} from './utils.js?v=6.9.3';

const app=document.getElementById('app');
const getLanguage=()=>{try{return localStorage.getItem('gramos-language')==='en'?'en':'mr';}catch{return 'mr';}};
const saveLanguage=value=>{try{localStorage.setItem('gramos-language',value);}catch{}};
let lang=getLanguage();
let role={admin:false,ids:[],editorIds:[],reviewerIds:[]};
let pendingRender=0;
let inboxTimer=null;
let currentRoute=[];
let publicLongText=new Map();
// Slideshow state is reset on every client-side navigation (no duplicate timers).
let carouselTimers=[];
let revealObserver=null;
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
/** Public website only: clamp overly long cards and give their complete text
 * a readable modal. The admin editor is intentionally untouched. */
function enablePublicReadMore(){
 publicLongText.clear();
 const site=app.querySelector('.sv-site');if(!site)return;
 let number=0;
 const attachButton=(source,full)=>{
   const id=`more-${number++}`;publicLongText.set(id,full);
   const button=document.createElement('button');button.type='button';button.className='sv-public-more-button';
   button.dataset.action='public-read-more';button.dataset.id=id;
   button.textContent=lang==='mr'?'संपूर्ण माहिती पहा':'Read more';
   source.insertAdjacentElement('afterend',button);
 };
 // Older cards used an inline <details> disclosure; opening it stretched the card.
 // Replace its *interaction* with the same modal, retaining the original text untouched.
 site.querySelectorAll('details.sv-more-panel').forEach(details=>{
   const full=details.querySelector('p')?.textContent?.trim()||'';
   if(!full)return;
   attachButton(details,full);details.hidden=true;
 });
 site.querySelectorAll('.sv-service p,.sv-project-card p,.sv-p-card p,.sv-news-card p,.sv-news-list-body p,.sv-notice-card p,.sv-n-card p,.sv-about-detail p,.sv-l-service p,.sv-contact-card p,.sv-about-description').forEach(paragraph=>{
   if(paragraph.closest('details'))return;
   const full=paragraph.textContent?.trim()||'';
   if(full.length<185)return;
   paragraph.classList.add('sv-public-clamped');
   attachButton(paragraph,full);
 });
 // Scheme cards may have several paragraphs and bullet lists. One More button per
 // card opens the COMPLETE text, instead of generating a dozen buttons or an
 // inaccessible scrollbar inside a tiny public card.
 site.querySelectorAll('.sv-g-card').forEach(card=>{
   const body=card.querySelector('.sv-g-card-content');
   if(!body)return;
   const full=(body.textContent||'').trim();
   if(full.length<=320)return;
   card.classList.add('sv-g-is-collapsed');
   attachButton(body,full);
 });
 if(!publicLongText.size)return;
 const dialog=document.createElement('dialog');dialog.id='publicTextModal';dialog.className='sv-public-text-modal';
 const inner=document.createElement('div');inner.className='sv-public-text-modal-body';
 const title=document.createElement('h2');title.textContent=lang==='mr'?'संपूर्ण माहिती':'Full information';
 const close=document.createElement('button');close.type='button';close.className='sv-public-more-close';
 close.dataset.action='public-more-close';close.textContent=lang==='mr'?'बंद करा':'Close';
 const content=document.createElement('p');content.id='publicTextModalContent';content.className='sv-public-modal-text';
 inner.append(title,close,content);dialog.append(inner);site.append(dialog);
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
}
function startCarousels(){
 carouselTimers.forEach(clearInterval);carouselTimers=[];
 if(reducedMotion())return;
 for(const [id,delay] of [['svHero',6500],['svGallery',8500],['svLeaders',6500]]){
   const slider=document.getElementById(id);
   if(!slider||slider.querySelectorAll('.sv-slide,.sv-profile-page').length<2)continue;
   const timer=setInterval(()=>{
     if(!slider.isConnected||document.visibilityState==='hidden'||slider.matches(':hover')||slider.contains(document.activeElement))return;
     slider.querySelector('[data-action="sv-next"],[data-action="profile-next"]')?.click();
   },delay);
   carouselTimers.push(timer);
 }
}
function startReveals(){
 revealObserver?.disconnect();revealObserver=null;
 const host=app.querySelector('.sv-site');if(!host)return;
 const targets=host.querySelectorAll('.sv-welcome,.sv-gallery-row,.sv-compact-widgets,.sv-service-video,.sv-news,.sv-projects,.sv-gallery-group,.sv-news-list-card,.sv-news-detail-article,.sv-news-sidebar,.sv-contact-intro,.sv-contact-panel,.sv-contact-card,.sv-gallery-tile,.sv-facilities,.sv-footer,.sv-about-section,.sv-about-stats,.sv-about-team');
 if(reducedMotion()||!('IntersectionObserver' in window))return;
 targets.forEach(el=>el.classList.add('sv-reveal'));
 revealObserver=new IntersectionObserver((entries)=>{
   entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver?.unobserve(entry.target);}});
 },{threshold:.07,rootMargin:'0px 0px -28px 0px'});
 targets.forEach(el=>revealObserver.observe(el));
 host.classList.add('sv-motion-ready');
}
export function startupDeadline(task,label,ms){
 let timer;return Promise.race([Promise.resolve(task),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out. Check your internet connection and try again.')),ms);})]).finally(()=>clearTimeout(timer));
}
const getRoute=()=>decodeURI(location.pathname).split('/').filter(Boolean);

function navigate(url){if(!url)return;history.pushState({},'',url);window.scrollTo(0,0);render();}
async function render(){
 const run=++pendingRender;
 clearInterval(inboxTimer);inboxTimer=null;
 app.innerHTML='<main class="container" aria-busy="true" style="padding:32px 16px"><h1>GramOS</h1></main>';
 try {
   currentRoute=getRoute();
   window.GRAMOS_BOOT_STAGE='Checking session';
   const session=api&&(currentRoute[0]==='admin'||new URLSearchParams(location.search).get('preview')==='1')?await startupDeadline(getSession(), 'Session check', 12000):null;
   if(run!==pendingRender)return;
   window.GRAMOS_BOOT_STAGE='Checking permissions';
   role=session?.user?await startupDeadline(accessRole(session.user.id), 'Permission check', 15000):{admin:false,ids:[]};
   if(run!==pendingRender)return;
   window.GRAMOS_BOOT_STAGE='Loading page data';
   const html=await startupDeadline(currentRoute[0]==='admin'?renderAdmin(currentRoute,lang,role,session?.user):renderPublic(currentRoute,lang,role),'Page data', 20000);
   if(run!==pendingRender)return;
   document.documentElement.lang=currentRoute[0]==='admin'?lang:'mr';
   app.innerHTML=html;
   window.GRAMOS_BOOT_STAGE='Rendering page';
   if(currentRoute[0]==='admin'){
     const content=app.querySelector('.admin-content');const heading=content?.querySelector('.admin-page-top');if(heading&&heading.parentElement===content)content.prepend(heading);
     // Move controls without cloning or disabling them: FormData and the upload handlers
     // still see the original fields, names, values and validation rules.
     const t=(mr,en)=>lang==='mr'?mr:en;
     const disclose=(title,open=false)=>{const d=document.createElement('details');d.className='gx62-disclosure';d.open=open;const summary=document.createElement('summary');summary.textContent=title;d.append(summary);return d;};
     const menu=app.querySelector('.gx62-navigation');if(menu&&window.matchMedia('(max-width: 820px)').matches)menu.open=false;
     // Secondary page settings stay available, but records are the first task.
     const pageForms=['aboutSettingsForm','serviceSettingsForm','schemeSettingsForm','beneficiarySettingsForm','noticeSettingsForm','newsSettingsForm','gallerySettingsForm','projectSettingsForm'];
     for(const id of pageForms){
       const form=document.getElementById(id),panel=form?.closest('section.admin-panel');if(!panel)continue;
       const title=panel.querySelector('h2')?.textContent||t('पानाची सेटिंग्ज','Page settings');
       const details=disclose(title,new URLSearchParams(location.search).get('view')==='settings');panel.before(details);details.append(panel);panel.classList.add('gx62-inner-panel');
     }
     // Homepage deep links open exactly one editor. Inactive controls are excluded
     // from FormData so saving a banner never writes announcements or other drafts.
     const home=document.getElementById('homeForm');
     if(home){
       const parts=['banner','announcement','welcome','headings','navigation','weather','order'];
       const requested=new URLSearchParams(location.search).get('part');
       const active=parts.includes(requested)?requested:'banner';
       home.dataset.homePart=active;
       for(const [index,panel] of [...home.querySelectorAll(':scope > section.admin-panel')].entries()){
         if(parts[index]!==active){panel.hidden=true;for(const input of panel.querySelectorAll('input,select,textarea,button'))input.disabled=true;continue;}
         panel.classList.add('gx63-focus-panel');
         const title=panel.querySelector('h2')?.textContent?.replace(/^\d+\.\s*/, '');
         if(title&&heading)heading.querySelector('h1').textContent=title;
         if(heading)heading.querySelector('p').textContent=t('हा विभाग बदलून जतन करा.','Edit this section, then save your changes.');
         for(const inner of panel.querySelectorAll('details.admin-edit-advanced'))inner.open=true;
       }
     }
     const preview=app.querySelector('.admin-preview-wide');if(preview){const d=disclose(t('वेबसाइट पूर्वावलोकन','Website preview'));preview.before(d);d.append(preview);const frame=preview.querySelector('iframe');if(frame)frame.loading='lazy';}
     // Collapse redundant legacy reference links (all individual records remain in the main edit links).
     if(new URLSearchParams(location.search).get('view')==='settings')for(const panel of content?.querySelectorAll(':scope > section.admin-panel')||[]){
       if(panel.matches('.gx6-page-tools,.admin-preview-wide')||panel.querySelector('form')||!panel.querySelector('.sv-about-admin-links'))continue;
       const d=disclose(panel.querySelector('h2')?.textContent||t('अधिक पर्याय','More options'));panel.before(d);d.append(panel);
     }
     if(currentRoute[3]==='content'){
       const params=new URLSearchParams(location.search);
       for(const a of content?.querySelectorAll('a[href]')||[]){
         const url=new URL(a.href,location.origin);if(url.pathname!==location.pathname||url.origin!==location.origin)continue;
         for(const key of ['from','category'])if(params.has(key))url.searchParams.set(key,params.get(key));
         a.href=url.pathname+url.search;
       }
     }
     const record=document.getElementById('contentForm');
     if(record){
       const kind=record.dataset.kind, actions=record.querySelector('.gx-save-actions');
       const advanced=disclose(t('अधिक पर्याय','More options'));advanced.classList.add('gx6-advanced');
       const primarySubtitle=['officials','leaders','committees','gallery','banners','about_facts'].includes(kind);
       const directLink=['service_forms','services','service_links','notices','videos','page_elements'].includes(kind);
       const optional=['sort_order','image_url',...(!primarySubtitle?['subtitle_mr','subtitle_en']:[]),...(!directLink?['external_url']:[]),...(['gallery','banners','metrics','leaders','officials','about_facts','committees','service_forms'].includes(kind)?['body_mr','body_en']:[]),... (kind==='news'?['source_title_mr','source_title_en','related_links_mr','related_links_en']:[])];
       for(const name of optional){const field=record.querySelector(`[name="${name}"]`)?.closest('label.field');if(field)advanced.append(field);}
       if(actions&&advanced.children.length>1)actions.before(advanced);
       // Put Marathi/English counterparts side by side at desktop widths.
       const stack=record.querySelector('.stacked-form');if(stack)for(const f of [...stack.children]){
         if(!f.matches('label.field'))continue;const input=f.querySelector('[name$="_mr"]');if(!input)continue;
         const partner=record.querySelector(`[name="${input.name.slice(0,-3)}_en"]`)?.closest('label.field');if(!partner||partner.parentElement!==stack)continue;
         const pair=document.createElement('div');pair.className='gx62-language-pair';f.before(pair);pair.append(f,partner);
       }
     }
     // Clear field groups and friendly labels; no extra Save buttons inside fields.
     if(record){
       const stack=record.querySelector('.stacked-form');
       if(stack){
         const actions=stack.querySelector('.gx-save-actions');
         const createGroup=(title)=>{const el=document.createElement('section');el.className='gx63-field-group';const h=document.createElement('h3');h.textContent=title;el.append(h);actions.before(el);return el;};
         if(actions){
           const basics=createGroup(t('१. नाव व माहिती','1. Name & information'));
           const extra=createGroup(t('२. विभागाची माहिती','2. Item details'));
           const media=createGroup(t('३. फोटो व कागदपत्रे','3. Photos & documents'));
           const mediaNames=new Set(['image_url','external_url','file_path','public_file_approved']);
           const basicNames=new Set(['title_mr','title_en','subtitle_mr','subtitle_en','body_mr','body_en']);
           for(const el of [...stack.children]){
             if(el.matches('.gx63-field-group,.gx6-advanced,.gx-save-actions,small,input[type="hidden"]'))continue;
             const inputs=[...el.querySelectorAll('input,textarea,select')];
             const isMedia=el.matches('.upload-box,.admin-pdf-existing')||inputs.some(i=>i.type==='file'||mediaNames.has(i.name));
             const isBasic=inputs.some(i=>basicNames.has(i.name));
             (isMedia?media:isBasic?basics:extra).append(el);
           }
           for(const group of [basics,extra,media])if(group.children.length===1)group.remove();
           const advanced=stack.querySelector('.gx6-advanced');if(advanced)actions.before(advanced);
           const simpleLabels={title_mr:t('नाव / शीर्षक — मराठी','Name / title — Marathi'),title_en:t('नाव / शीर्षक — इंग्रजी','Name / title — English'),body_mr:t('माहिती — मराठी','Description — Marathi'),body_en:t('माहिती — इंग्रजी','Description — English'),external_url:t('वेबसाइट / PDF लिंक','Website / PDF link')};
           for(const [key,title] of Object.entries(simpleLabels)){const label=record.querySelector(`[name="${key}"]`)?.closest('label.field')?.querySelector(':scope > span');if(label)label.textContent=title;}
         }
       }
     }
     // Make invalid controls in collapsed sections visible before the browser focuses them.
     for(const form of app.querySelectorAll('form:not(#visitorForm)'))form.addEventListener('invalid',event=>{for(let el=event.target.parentElement;el&&el!==app;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;},true);
     // All upload controls retain their real inputs and handlers; show the selected file name.
     for(const input of app.querySelectorAll('input[type="file"][data-target]')){
       const label=input.closest('label');if(!label)continue;const status=document.createElement('small');status.className='gx62-file-status';status.setAttribute('aria-live','polite');label.after(status);
       const target=input.closest('form')?.querySelector(`[name="${input.dataset.target}"]`);if(target?.value)status.textContent=t('फाइल जोडली आहे','File attached');
       input.addEventListener('change',()=>{status.textContent=input.files?.[0]?.name||'';});
     }
     const forms=['seoSettingsForm','contactSettingsForm','newsSettingsForm','gallerySettingsForm','aboutSettingsForm','serviceSettingsForm','schemeSettingsForm','beneficiarySettingsForm','noticeSettingsForm','projectSettingsForm'];
     for(const id of forms){
       const form=document.getElementById(id),publish=form?.querySelector('button[type="submit"]');
       if(!publish||form.querySelector('[data-save-mode="draft"]'))continue;
       publish.dataset.saveMode='publish';
       publish.textContent=lang==='mr'?'जतन करा व वेबसाइटवर दाखवा':'Save and show on website';
       const draft=document.createElement('button');draft.type='submit';draft.className='button-lite gx-draft-option';draft.dataset.saveMode='draft';
       draft.textContent=lang==='mr'?'मसुदा जतन करा':'Save draft';
       publish.insertAdjacentElement('beforebegin',draft);
     }
     for(const form of app.querySelectorAll('form')){
       const draft=form.querySelector('[data-save-mode="draft"]'),publish=form.querySelector('[data-save-mode="publish"]');if(!draft||!publish)continue;
       draft.classList.remove('btn','btn-dark');draft.classList.add('button-lite');draft.textContent=lang==='mr'?'मसुदा जतन करा':'Save draft';
       publish.classList.remove('button-lite');publish.classList.add('btn','btn-dark');publish.textContent=lang==='mr'?'जतन करा व प्रकाशित करा':'Save & publish';
     }
   }
   // Keep private editor previews private while navigating within the same village.
   if(currentRoute[0]==='v'&&new URLSearchParams(location.search).get('preview')==='1'){
     for(const a of app.querySelectorAll('a[href]')){const u=new URL(a.href,location.origin);const parts=u.pathname.split('/').filter(Boolean);if(u.origin===location.origin&&parts[0]==='v'&&parts[1]===currentRoute[1]){u.searchParams.set('preview','1');a.href=u.pathname+u.search+u.hash;}}
   }
   enablePublicReadMore();
   startCarousels();
   startReveals();
   if(document.getElementById('turnstile-mount'))initTurnstile();
   // Forms refresh only on request, so opening a private form is never interrupted.
 }catch(error){
   if(run!==pendingRender)return;
   console.error('GramOS render failure:',error);
   app.innerHTML=`<div class="error-screen"><img src="/assets/mark.svg" alt=""/><h1>Unable to load this page</h1><p>${esc(error?.message||'Unknown error')}</p><p>Your database connection may be unavailable. The public demo can still be viewed.</p><button type="button" class="btn btn-dark" data-action="retry-startup">Retry</button> <a class="button-lite" href="/admin/login">Admin login</a> <a class="button-lite" href="/demo">Open demo</a></div>`;
 }
}

app.addEventListener('click',async e=>{
 const actionButton=e.target.closest('[data-action]');
 if(actionButton){e.preventDefault();const action=actionButton.dataset.action;
   if(action==='retry-startup'){location.reload();return;}
   if(action==='public-read-more'){const modal=document.getElementById('publicTextModal');const text=publicLongText.get(actionButton.dataset.id);if(modal&&text){document.getElementById('publicTextModalContent').textContent=text;modal.showModal();}return;}
   if(action==='public-more-close'){document.getElementById('publicTextModal')?.close();return;}
   if(action==='sv-top'){window.scrollTo({top:0,behavior:reducedMotion()?'auto':'smooth'});return;}
   if(['profile-prev','profile-next','profile-dot'].includes(action)){
     const slider=actionButton.closest('.sv-profile-carousel');if(!slider)return;
     const pages=[...slider.querySelectorAll('.sv-profile-page')];if(!pages.length)return;
     const old=Number(slider.dataset.index)||0;
     const next=action==='profile-dot'?Number(actionButton.dataset.index):(old+(action==='profile-next'?1:-1)+pages.length)%pages.length;
     if(!Number.isInteger(next)||next<0||next>=pages.length)return;
     slider.dataset.index=String(next);pages.forEach((page,i)=>page.hidden=i!==next);
     slider.querySelectorAll('.sv-profile-dot').forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===next)));return;
   }
   if(action==='sv-prev'||action==='sv-next'||action==='sv-dot'){
     const slider=document.getElementById(actionButton.dataset.slider);
     if(!slider)return;
     const slides=[...slider.querySelectorAll('.sv-slide')];
     if(slides.length<2)return;
     const oldIndex=Number(slider.dataset.index)||0;
     const nextIndex=action==='sv-dot'?Number(actionButton.dataset.index):(oldIndex+(action==='sv-next'?1:-1)+slides.length)%slides.length;
     slider.dataset.index=String(nextIndex);
     slides.forEach((slide,i)=>{slide.classList.toggle('active',i===nextIndex);slide.setAttribute('aria-hidden',String(i!==nextIndex));});
     slider.querySelectorAll('.sv-slide-dots button').forEach((dot,i)=>{dot.classList.toggle('active',i===nextIndex);dot.setAttribute('aria-pressed',String(i===nextIndex));});
     return;
   }
   if(action==='service-tab'){
     const tab=actionButton.dataset.tab;
     const tablist=actionButton.closest('[role="tablist"]');
     if(!tablist||!['all','available','steps','forms','links','qr'].includes(tab))return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;});
     document.querySelectorAll('.sv-service-tabpanel').forEach(panel=>{panel.hidden=panel.id!==`services-panel-${tab}`;});
     const url=new URL(location.href);url.searchParams.set('serviceTab',tab);
     history.replaceState({},'',url.pathname+url.search+url.hash);
     return;
   }
   if(action==='scheme-tab'){
     const tab=actionButton.dataset.tab;
     const tablist=actionButton.closest('[role="tablist"]');
     if(!tablist||!['all','individual','public'].includes(tab))return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;});
     document.querySelectorAll('.sv-g-tabpanel').forEach(panel=>{panel.hidden=panel.id!==`schemes-panel-${tab}`;});
     const url=new URL(location.href);url.searchParams.set('schemeTab',tab);
     history.replaceState({},'',url.pathname+url.search+url.hash);
     return;
   }
   if(action==='contact-tab'){
     const tab=actionButton.dataset.tab;
     if(!['details','map','social','form'].includes(tab))return;
     const tablist=actionButton.closest('[role="tablist"]');if(!tablist)return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;});
     document.querySelectorAll('.sv-contact-tabpanel').forEach(p=>{p.hidden=p.id!==`contact-panel-${tab}`;});
     const url=new URL(location.href);url.searchParams.set('contactTab',tab);history.replaceState({},'',url.pathname+url.search+url.hash);
     startReveals();return;
   }
   if(action==='news-share'){const path=actionButton.dataset.share||'';if(!path.startsWith('/'))return;const url=new URL(path,location.origin).href;try{await navigator.clipboard.writeText(url);notif(lang==='mr'?'लेखाची लिंक कॉपी झाली.':'Article link copied.');}catch(e){notif('Copy this link: '+url);}return;}
   if(action==='gallery-tab'){
     const tab=actionButton.dataset.tab;
     if(!['all','meetings','campaigns','development','cultural','press','videos'].includes(tab))return;
     const tablist=actionButton.closest('[role="tablist"]');if(!tablist)return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;});
     document.querySelectorAll('.sv-gallery-tabpanel').forEach(p=>{p.hidden=p.id!==`gallery-panel-${tab}`;});
     const url=new URL(location.href);url.searchParams.set('galleryTab',tab);history.replaceState({},'',url.pathname+url.search+url.hash);
     return;
   }
   if(action==='notice-tab'){
     const tab=actionButton.dataset.tab;
     const tablist=actionButton.closest('[role="tablist"]');
     if(!tablist||!['notice','financial','rti','resolutions'].includes(tab))return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;});
     document.querySelectorAll('.sv-n-tabpanel').forEach(panel=>{panel.hidden=panel.id!==`notices-panel-${tab}`;});
     const url=new URL(location.href);url.searchParams.set('noticeTab',tab);
     history.replaceState({},'',url.pathname+url.search+url.hash);
     return;
   }
   if(action==='project-tab'){
     const tab=actionButton.dataset.tab;
     const tablist=actionButton.closest('[role="tablist"]');
     if(!tablist||!['all','ongoing','completed','upcoming'].includes(tab))return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{const selected=btn.dataset.tab===tab;btn.classList.toggle('active',selected);btn.setAttribute('aria-selected',String(selected));btn.tabIndex=selected?0:-1;});
     document.querySelectorAll('.sv-project-tabpanel').forEach(panel=>{panel.hidden=panel.id!==`projects-panel-${tab}`;});
     const url=new URL(location.href);url.searchParams.set('projectTab',tab);
     history.replaceState({},'',url.pathname+url.search+url.hash);
     return;
   }
   if(action==='about-tab'){
     const tab=actionButton.dataset.tab;
     const tablist=actionButton.closest('[role="tablist"]');
     if(!tablist||!['info','officials','staff','committees','facilities','duties'].includes(tab))return;
     tablist.querySelectorAll('[role="tab"]').forEach(btn=>{
       const selected=btn.dataset.tab===tab;
       btn.classList.toggle('active',selected);
       btn.setAttribute('aria-selected',String(selected));
       btn.tabIndex=selected?0:-1;
     });
     document.querySelectorAll('.sv-a-tabpanel').forEach(panel=>{
       panel.hidden=panel.id!==`about-panel-${tab}`;
     });
     const url=new URL(location.href);url.searchParams.set('tab',tab);
     history.replaceState({},'',url.pathname+url.search+url.hash);
     startReveals();
     return;
   }
   if(action==='set-nav-language'){const selected=actionButton.dataset.lang;if(!['mr','en'].includes(selected))return;lang=selected;saveLanguage(lang);render();return;}
   if(action==='lang'){lang=lang==='mr'?'en':'mr';saveLanguage(lang);render();return;}
   try{actionButton.disabled=true;await adminAction(actionButton,currentRoute,role,navigate,render);}
   catch(error){notif(error.message||'Action failed',true);}
   finally{if(actionButton.isConnected)actionButton.disabled=false;}
   return;
 }
 const mobile=e.target.closest('#mobileMenu');
 if(mobile){document.getElementById('publicNavItems')?.classList.toggle('nav-open');return;}
 const a=e.target.closest('a[href]');
 if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
 const url=new URL(a.href,location.origin);if(url.origin!==location.origin)return;
 e.preventDefault();if(location.pathname.startsWith('/demo')&&!url.pathname.startsWith('/demo')){location.assign(url.href);return;}navigate(url.pathname+url.search+url.hash);
});

app.addEventListener('keydown',e=>{
 const slider=e.target.closest?.('.sv-carousel,.sv-profile-carousel');
 if(!slider||!['ArrowLeft','ArrowRight'].includes(e.key))return;
 e.preventDefault();
 const next=e.key==='ArrowRight';slider.querySelector(`[data-action="${next?'sv-next':'sv-prev'}"],[data-action="${next?'profile-next':'profile-prev'}"]`)?.click();
});

// No hidden background saving: make it obvious which changes still need Save.
app.addEventListener('input',e=>{
 const form=e.target.closest?.('form');
 if(!form||!['homeForm','footerForm','navbarBrandingForm','settingsForm'].includes(form.id))return;
 form.dataset.dirty='true';
 const hint=form.querySelector('.admin-save-hint');if(hint)hint.hidden=false;
 if(form.id==='navbarBrandingForm' && e.target.matches('input[name="nav_logo_url"]')){
   const picture=form.querySelector('.admin-v47-logo-preview img');
   if(picture){const url=e.target.value.trim();let valid=false;try{const p=new URL(url);valid=p.protocol==='https:';}catch{}
     picture.src=valid?url:(picture.dataset.fallback||'/assets/gp-mark.svg');
   }
 }
 if(['footerForm'].includes(form.id) && e.target.matches('input[name^="footer_logo_"]')){
   const row=e.target.closest('[data-logo-row]');
   const thumb=row?.querySelector('.admin-footer-logo-thumb');
   const placeholder=row?.querySelector('.admin-footer-logo-placeholder');
   if(thumb){const url=e.target.value.trim();let valid=false;try{const parsed=new URL(url);valid=parsed.protocol==='https:';}catch{}if(valid){thumb.src=url;thumb.hidden=false;}else{thumb.hidden=true;}if(placeholder)placeholder.hidden=valid;}
 }
});

app.addEventListener('change',async e=>{
 if(e.target.matches('input[data-gx-csv-input]')){
   try{await previewCSV(e.target);}catch(error){notif(error.message||'CSV could not be opened',true);}
 }else if(e.target.matches('input[data-image-input]')){
   try{await imageUpload(e.target);}catch(error){notif(error.message||'Upload failed',true);}
 }else if(e.target.matches('input[data-excel-input]')){
   try{await excelUpload(e.target);}catch(error){notif(error.message||'Excel upload failed',true);}
 }else if(e.target.matches('input[data-document-input]')){
   try{await documentUpload(e.target);}catch(error){notif(error.message||'PDF upload failed',true);}
 }
});

app.addEventListener('submit',async e=>{
 const form=e.target;
 if(!['domainForm','googleVerifyForm','grantSuperAdminForm','navbarBrandingForm','homeForm','footerForm','seoSettingsForm','contactSettingsForm','loginForm','recoverPasswordForm','setPasswordForm','settingsForm','aboutSettingsForm','serviceSettingsForm','projectSettingsForm','schemeSettingsForm','beneficiarySettingsForm','noticeSettingsForm','newsSettingsForm','gallerySettingsForm','createVillageForm','createStaffLoginForm','clientRecordForm','contentForm','staffAccessForm','visitorForm'].includes(form.id))return;
 e.preventDefault();
 if(form.querySelector('[data-uploading="true"]')){notif('Image upload is still in progress. Save after it finishes.',true);return;}
 const button=e.submitter||form.querySelector('[type="submit"]');if(button?.disabled)return;
 form.dataset.saveMode=e.submitter?.dataset.saveMode||'publish';
 const submitButtons=[...form.querySelectorAll('[type="submit"]')];submitButtons.forEach(x=>x.disabled=true);
 try{
   if(form.id==='visitorForm')await sendSubmission(form);
   else await submitAdminForm(form,currentRoute,role,navigate,render);
 }catch(error){const status=form.querySelector('[data-form-status]');if(status)status.textContent=error?.message||'Submission failed';notif(error?.message||'Something went wrong',true);}
 finally{submitButtons.forEach(x=>{if(x.isConnected)x.disabled=false;});}
});

function fileAsBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Cannot read attachment'));reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.readAsDataURL(file);});}
async function sendSubmission(form){
 const config=window.GRAMOS_CONFIG||{};
 // Normal form: a server-side rate limiter and honeypot protect submissions without a CAPTCHA.
 const token=String(new FormData(form).get('cf-turnstile-response')||'');
 const fd=new FormData(form), attachment=fd.get('attachment');
 let data=null;
 if(attachment instanceof File && attachment.size){
   if(attachment.size>2*1024*1024||!['image/jpeg','image/png','image/webp'].includes(attachment.type))throw new Error('Only JPG, PNG or WebP images up to 2 MB are allowed.');
   data={mime:attachment.type,base64:await fileAsBase64(attachment)};
 }
 const payload={village_id:form.dataset.village,sender_name:String(fd.get('sender_name')||'').trim(),sender_email:String(fd.get('sender_email')||'').trim(),subject:String(fd.get('subject')||'general').trim(),message:String(fd.get('message')||'').trim(),turnstile_token:token,website:String(fd.get('website')||''),attachment:data};
 const res=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const answer=await res.json().catch(()=>({error:'Server did not return JSON'}));
 if(!res.ok)throw new Error(answer.error||'Submission failed');
 form.reset();window.turnstile?.reset?.();const status=form.querySelector('[data-form-status]');const message='आपला संदेश तपासणीसाठी पाठवला आहे. / Your form was submitted successfully.';if(status)status.textContent=message;notif(message);
}

let turnstileScriptPromise;
async function initTurnstile(){
 const mount=document.getElementById('turnstile-mount');const siteKey=window.GRAMOS_CONFIG?.turnstileSiteKey;
 if(!mount||!siteKey)return;
 if(!turnstileScriptPromise){turnstileScriptPromise=new Promise((resolve,reject)=>{
   if(window.turnstile?.render)return resolve();
   const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('Security verification unavailable'));document.head.append(script);
 });}
 try{await turnstileScriptPromise;if(mount.isConnected)window.turnstile.render(mount,{sitekey:siteKey});}
 catch(error){mount.textContent='Security verification failed to load. Please refresh the page.';}
}

window.addEventListener('popstate',render);
export const initialRender=render();

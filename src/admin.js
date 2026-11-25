import {SEO_PAGES,SEO_LABELS,resolveSEO,clearPublicMetadata} from './seo.js';
import {esc,loc,slugify,icon,formatDate,notif,imageURL} from './utils.js';
import {api,configured,call,adminVillages,villageById,itemsFor,uploadPublicImage,getSiteDraft,saveSiteDraft,publishSiteDraft,discardSiteDraft,withVillageDraft} from './data.js';

import {buildShamvadiVillage, SHAMVADI_TEMPLATE_LABEL} from './templates.js';
import {FIXED_DUTIES,FIXED_MISSION_MR,FIXED_VALUES_MR} from './about-reference.js';
import {referenceServices,referenceSteps,referenceForms,referenceLinks} from './services-reference.js';
import {referenceSchemes} from './schemes-reference.js';
import {referenceRTI} from './notices-reference.js';
import {officialSlots,slideSlots,gallerySlots,missingMediaSlots} from './media-slots.js';
import {referenceLeaderCards} from './demo.js';
import {SOCIAL_FIELDS,validateSocialSettings} from './social.js';
import {platformLegalNotice} from './branding.js';
import {PAGE_TARGETS,ELEMENT_TYPES} from './page-elements.js';
import {newVillagePage,clientsPage,staffPage,createVillageWithClient,saveClientRecord,createStaffLogin,exportClients} from './client-admin.js';
import {recentAdminActivity,csvImportPage,downloadCSVTemplate,commitCSVImport} from './admin-experience.js';
import {CSV_KINDS} from './admin-csv.mjs';

const csvControls=(v,kind,lang,trash)=>`<details class="gx62-list-menu"><summary>${tr(lang,'अधिक पर्याय','More options')}</summary><span class="gx-list-controls">${CSV_KINDS.includes(kind)?`<a class="button-lite" href="/admin/villages/${esc(v.id)}/import/${kind}">+ ${tr(lang,'CSV आयात','Import CSV')}</a>`:''}<a class="button-lite" href="/admin/villages/${esc(v.id)}/content/${kind}${trash?'':'?trash=1'}">${trash?tr(lang,'सामान्य यादी','Active list'):tr(lang,'काढलेल्या नोंदी','Restore items')}</a></span></details>`;
const itemControls=(v,i,kind,lang,trash)=>trash?`<span class="status status-draft">${tr(lang,'काढले','Removed')}</span><button class="button-lite" data-action="restore-item" data-id="${esc(i.id)}">${tr(lang,'परत आणा','Restore draft')}</button>`:`${pill(i.status)}<a class="button-lite gx6-edit-button" href="/admin/villages/${esc(v.id)}/content/${kind}?edit=${esc(i.id)}" title="Edit">${tr(lang,'संपादन','Edit')}</a><details class="gx62-row-menu"><summary>${tr(lang,'अधिक','More')}</summary><button data-action="item-status" data-id="${esc(i.id)}" data-next="${i.status==='published'?'draft':'published'}">${i.status==='published'?tr(lang,'मसुदा','Draft'):tr(lang,'प्रकाशित','Publish')}</button><button class="danger-text" data-action="delete-item" data-id="${esc(i.id)}">${tr(lang,'काढा','Remove')}</button></details>`;
const kinds=['page_elements','service_steps','service_forms','service_links','about_facts','committee_groups','committees','about_facilities','duties','about_blocks','about_sections','banners','gallery','notices','beneficiary_lists','services','videos','news','projects','metrics','schemes','leaders','officials','facilities','pages'];
const names={page_elements:['पानावर नवीन घटक','Add elements to any page'],service_links:['नागरिक सेवा लिंक','Lokseva — Citizen Links'],service_steps:['अर्ज प्रक्रियेचे टप्पे','Lokseva — Application Steps'],service_forms:['अर्ज नमुना / डाउनलोड','Lokseva — Forms and Downloads'],committee_groups:['समितीची शीर्षके','About — Committee Sections'],about_facilities:['ग्राम पायाभूत सुविधा','About — Facility Tiles'],about_blocks:['अधिक पान घटक','About — Add Page Elements'],about_facts:['ग्रामपंचायत / लोकसंख्या माहिती','About — Village Facts'],committees:['ग्रामपंचायत समित्या','About — Committees'],duties:['भूमिका व जबाबदाऱ्या','About — Roles and Duties'],about_sections:['ग्रामपंचायतीबद्दल — अतिरिक्त माहिती','About — Additional Sections'],banners:['मुख्य बॅनर स्लाइड','Homepage Sliders'],videos:['व्हिडिओ गॅलरी','Video Gallery'],metrics:['गावाचे आकडे','Village Statistics'],news:['बातम्या','News'],notices:['सूचना फलक','Notice board'],beneficiary_lists:['लाभार्थी यादी — Excel','Beneficiary Lists — Excel'],services:['लोकसेवा','Services'],schemes:['शासकीय योजना — नोंदी','Government Schemes — Records'],projects:['विकासकामे','Development works'],leaders:['माननीय मंत्री व पदाधिकारी','State leadership'],officials:['पदाधिकारी','Officials'],gallery:['फोटो गॅलरी','Photo gallery'],facilities:['सुविधा','Facilities'],pages:['पाने','Custom pages']};
const tr=(lang,mr,en)=>lang==='mr'?mr:en;
const label=(lang,kind)=>names[kind]?.[lang==='mr'?0:1]||kind;
const adminHead=(lang)=>`<header class="admin-top"><a class="admin-wordmark" href="/admin"><img src="/assets/gp-mark.svg" alt=""/>GramOS<span> / ग्रामपंचायत प्रशासन</span></a><div class="admin-top-right"><details class="admin-lang-picker"><summary class="admin-lang" aria-label="Choose admin language">${icon('globe')} ${lang==='mr'?'मराठी':'English'} ▾</summary><div class="admin-lang-options"><button type="button" data-action="set-nav-language" data-lang="mr" aria-current="${lang==='mr'?'true':'false'}">मराठी</button><button type="button" data-action="set-nav-language" data-lang="en" aria-current="${lang==='en'?'true':'false'}">English</button></div></details><a href="/admin/security" class="button-lite" title="Change your password">${tr(lang,'खाते सुरक्षा','Account security')}</a><a href="/demo" target="_blank" rel="noopener noreferrer">${tr(lang,'डेमो पहा','View demo')} ↗</a><button class="logout-button" data-action="logout">${tr(lang,'लॉगआऊट','Sign out')}</button></div></header>`;
const pill=s=>`<span class="status status-${esc(s)}">${esc(s)}</span>`;
const field=(name,title,value='',opts={})=>`<label class="field ${opts.wide?'wide':''}"><span>${title}</span>${opts.textarea?`<textarea rows="${opts.rows||4}" name="${name}" ${opts.required?'required':''}>${esc(value)}</textarea>`:`<input name="${name}" type="${opts.type||'text'}" ${opts.required?'required':''} ${opts.readonly?'readonly':''} value="${esc(value)}" placeholder="${esc(opts.placeholder||'')}"/>`}</label>`;
const back=(url,title)=>`<a class="backlink" href="${url}">← ${title}</a>`;
const adminSetupGuide=()=>`<div class="admin-guide"><h3>First-time access / प्रथम प्रवेश</h3><p>There is no default admin password. A project owner must invite a Super Admin through Supabase Auth and assign their database role. See <code>ADMIN_AUDIT_v491.md</code> and the one-time <code>scripts/invite-superadmin.mjs</code> setup tool. Never paste private API keys or passwords into a chat or GitHub.</p><p>If you already have an account, use the password-recovery link above.</p></div>`;
const unavailable=()=>`<div class="admin-setup"><img src="/assets/gp-mark.svg" alt=""/><h1>Connect Supabase first</h1><p>Your frontend is loading correctly. To enable the admin dashboard, create the new Supabase project, run <code>database/01_setup.sql</code>, then add the URL and publishable key to <code>config.js</code>. See <code>START_HERE.md</code>.</p><a class="btn btn-dark" href="/demo">Explore the working public demo ${icon('arrow')}</a></div>`;

export async function renderAdmin(route,lang,role,user){
 clearPublicMetadata(true);
 if(!configured) return unavailable();
 if(!user && route[1]==='recover') return `<div class="login-page"><div class="login-intro"><h1>GramOS account recovery</h1><p>Use your verified email. Supabase will email a secure reset link if the account exists.</p></div><div class="login-form-panel"><form id="recoverPasswordForm" class="login-form"><h2>Reset your password</h2>${field('email','Email address','',{required:true,type:'email'})}<button class="btn btn-dark wide-button" type="submit">Send password reset link</button><a class="button-lite" href="/admin/login">← Back to sign in</a></form></div></div>`;
 if(user && route[1]==='security')return `${adminHead(lang)}<main class="admin-shell container"><div class="admin-page-top"><h1>Account security / खाते सुरक्षा</h1></div><section class="admin-panel form-panel"><h2>Set or change your password</h2><p>This is also where you set a permanent password after accepting an email invitation.</p><form id="setPasswordForm" class="stacked-form">${field('password','New password (14+ characters)','',{type:'password',required:true})}${field('confirm_password','Confirm new password','',{type:'password',required:true})}<button type="submit" class="btn btn-dark">Save new password</button></form><a class="button-lite" href="/admin">← Back to dashboard</a></section></main>`;
 if(!user) return `<div class="login-page"><div class="login-intro"><img src="/assets/gp-mark.svg" alt=""/><p class="eyebrow">GRAMOS / WEBSITE MANAGEMENT</p><h1>Gram Panchayat<br/><em>Website Management.</em></h1><p>${tr(lang,'सुरक्षित प्रवेश. मसुदे, प्रकाशन व नागरिक संदेश व्यवस्थापन.','Secure access. Manage drafts, publishing and citizen messages.')}</p></div><div class="login-form-panel"><form id="loginForm" class="login-form"><p class="eyebrow">ADMINISTRATOR LOGIN</p><h2>${tr(lang,'आपले स्वागत आहे','Welcome back')}</h2><p>${tr(lang,'Supabase मध्ये तयार केलेला ईमेल आणि पासवर्ड वापरा.','Use the email and password created in Supabase Authentication.')}</p>${field('email','Email address','',{required:true,type:'email'})}${field('password','Password','',{required:true,type:'password'})}<button class="btn btn-dark wide-button" type="submit">${tr(lang,'लॉगिन करा','Sign in')} ${icon('arrow')}</button><p class="small-muted">Only users granted an admin or editor role can manage villages.</p><a class="button-lite" href="/admin/recover">Forgot password?</a>${adminSetupGuide()}</form></div></div>`;
 if(!role.admin && !role.ids.length) return `${adminHead(lang)}<div class="admin-shell container"><div class="admin-setup"><h1>No admin access</h1><p>Your Supabase account is signed in, but it does not have a platform admin or village editor role yet. Create/verify your user in the same <code>gramos-clean</code> Supabase project, then run the role grant SQL in <code>ADMIN_SETUP.md</code>. Signing in alone does not grant platform-admin privileges.</p></div></div>`;
 const vId=route[2];
 if(!vId){if(route[1]==='clients'&&role.admin)return `${adminHead(lang)}${await clientsPage(lang,role)}`;if(route[1]==='new-village'&&role.admin)return `${adminHead(lang)}${newVillagePage(lang)}`;if(route[1]==='staff'&&role.admin)return `${adminHead(lang)}${await staffPage(lang,role)}`;if(route[1]==='branding')return `${adminHead(lang)}<main class="admin-shell container"><h1>${tr(lang,'लोगो प्रत्येक गावासाठी स्वतंत्र आहेत','Logos now belong to each village')}</h1><p>${tr(lang,'गाव निवडा, मग लोगो आणि फूटर उघडा.','Choose a village, then open Header logo or Footer logos.')}</p><a class="button-lite" href="/admin">${tr(lang,'गावे निवडा','Choose village')} →</a></main>`;if(route[1]==='users'&&role.admin)return `${adminHead(lang)}${await superAdminUsersEditor(lang)}`;return `${adminHead(lang)}${await dashboard(lang,role,user)}`;}
 const village=await villageById(vId);
 if(!village || (!role.admin && !role.ids.includes(vId))) return `${adminHead(lang)}<main class="admin-shell container"><h2>Village not accessible</h2><a href="/admin">← Dashboard</a></main>`;
 const section=route[3]||'settings',kind=route[4]||'news';
 const reviewerOnly=!role.admin && !role.editorIds?.includes(vId);
 if(reviewerOnly&&section!=='submissions')return `${adminHead(lang)}<div class="admin-layout"><aside class="admin-sidebar"><a class="sidebar-back" href="/admin">← All villages</a><a href="/admin/villages/${esc(vId)}/submissions">${icon('mail')} Visitor inbox</a></aside><main class="admin-content"><p class="admin-blue-note">Your role is read-only complaint reviewer. Open the inbox to view assigned village submissions.</p></main></div>`;
 const [items,draft]=reviewerOnly||section==='submissions'?[[],null]:await Promise.all([itemsFor(vId),getSiteDraft(vId)]);
 const working=withVillageDraft(village,draft?.changes);
 const base=`/admin/villages/${esc(vId)}`;
 const nav=(path,mr,en,glyph)=>`<a class="${path===section||path===`${section}/${kind}`||(path==='overview'&&section==='overview')||(path==='settings'&&section==='settings')||(section==='content'&&path===safeParent(kind,new URLSearchParams(location.search)))?'selected':''}" href="${base}/${path}">${icon(glyph)}<span>${tr(lang,mr,en)}</span></a>`;
 const sidebar=`<aside class="admin-sidebar admin-sidebar-v42 gx62-sidebar" aria-label="Village navigation"><a class="sidebar-back" href="/admin">← ${tr(lang,'सर्व गावे','All websites')}</a><div class="sidebar-village"><h3>${esc(loc(village,'name',lang)||village.slug)}</h3>${pill(village.status)}</div><details class="gx62-navigation" open><summary>${tr(lang,'मेनू','Menu')}</summary><nav class="gx62-nav-items">${reviewerOnly?nav('submissions','आलेले अर्ज','Received forms','mail'):`${nav('overview','आढावा','Overview','home')}${nav('submissions','आलेले अर्ज','Received forms','mail')}<p class="sidebar-label">${tr(lang,'वेबसाइटची पाने','Website pages')}</p>${nav('home','मुख्यपृष्ठ','Homepage','home')}${nav('about','गावाबद्दल','About & officials','users')}${nav('services','लोकसेवा','Services','document')}${nav('content/service_forms','PDF अर्ज','PDF forms','document')}${nav('schemes','योजना','Schemes','document')}${nav('projects','विकासकामे','Projects','document')}${nav('news','बातम्या','News','document')}${nav('notices','सूचना','Notices','bell')}${nav('gallery','गॅलरी','Gallery','image')}${nav('contact','संपर्क','Contact','mail')}<details class="gx62-nav-settings" ${['settings','branding','footer','domains','seo','members'].includes(section)?'open':''}><summary>${tr(lang,'सेटिंग्ज','Settings')}</summary>${nav('settings','गाव माहिती','Village details','settings')}${nav('branding','वरचा लोगो','Header logo','image')}${nav('footer','तळाचे लोगो','Footer & logos','image')}${nav('content/pages','इतर पाने','Custom pages','document')}${nav('content/page_elements','नवीन घटक','Page elements','plus')}${role.admin?`${nav('domains','डोमेन','Domain','globe')}${nav('seo','Google शोध','Google & SEO','document')}${nav('members','परवानग्या','Permissions','users')}<a href="/admin/staff">${icon('users')} ${tr(lang,'कर्मचारी','Staff accounts')}</a><a href="/admin/clients">${icon('document')} ${tr(lang,'ग्राहक','Customers')}</a>`:''}</details><a href="/v/${esc(village.slug)}?preview=1" target="_blank" rel="noopener noreferrer">${icon('arrow')} ${tr(lang,'वेबसाइट पहा','Preview website')} ↗</a>`}</nav></details></aside>`;
 
 const main=section==='import'&&CSV_KINDS.includes(kind)?csvImportPage(village,kind,lang):section==='overview'?overviewEditor(village,lang,items,draft,role):section==='home'?homeEditor(working,lang):section==='branding'?navbarBrandingEditor(working,lang):section==='footer'?footerEditor(working,lang):section==='settings'?settings(working,lang,role):section==='domains'&&role.admin?await domainsEditor(village,lang):section==='seo'&&role.admin?seoEditor(working,lang):section==='about'?aboutEditor(working,lang):section==='services'?servicesEditor(working,lang):section==='projects'?projectsEditor(working,lang):section==='schemes'?schemesEditor(working,lang):section==='news'?newsEditor(working,lang):section==='gallery'?galleryEditor(working,lang):section==='contact'?contactEditor(working,lang):section==='notices'?noticesEditor(working,lang):section==='content'&&kinds.includes(kind)?await contentEditor(village,items,kind,lang):section==='submissions'?await inbox(village,lang,!role.admin&&!role.editorIds?.includes(vId)):section==='members'&&role.admin?await membersEditor(village,lang):`<div class="empty-data">Page not found</div>`;
 const params=new URLSearchParams(location.search);
 const tools=reviewerOnly?'':section==='content'||section==='import'?'':pageContentTools(vId,section,lang,village.slug);
 const isHub=Boolean(tools)&&params.get('view')!=='settings';
 const parent=section==='content'||section==='import'?safeParent(kind,params):section;
 const crumb=reviewerOnly||section==='overview'?'':`<nav class="gx63-crumb" aria-label="${tr(lang,'पानाचा मार्ग','Page path')}"><a href="${base}/overview">${tr(lang,'सर्व पाने','All pages')}</a>${(section==='content'||section==='import'||(tools&&!isHub))&&parent!=='overview'?`<span aria-hidden="true">›</span><a href="${base}/${esc(parent)}">${esc(pageName(parent,lang))}</a>`:''}</nav>`;
 const history=section==='overview'&&!reviewerOnly?await recentAdminActivity(role,vId,lang):'';
 return `${adminHead(lang)}<div class="admin-layout gx62-layout">${sidebar}<main class="admin-content gx62-content">${crumb}${isHub?tools:main}${history}</main></div>`;
}


async function superAdminUsersEditor(lang){
 const users=await call(api.from('platform_admins').select('user_id,created_at').order('created_at',{ascending:true}));
 return `<main class="admin-shell container"><div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'फक्त मुख्य प्रशासक','SUPER ADMIN ONLY')}</p><h1>${tr(lang,'मुख्य प्रशासक व्यवस्थापन','Super Admin permissions')}</h1><p>${tr(lang,'येथे विद्यमान Supabase Auth खात्याला संपूर्ण परवानगी द्या. सामान्य Admin वापरकर्ते येथे प्रवेश करू शकत नाहीत.','Grant full access to an existing Supabase Auth account. Normal Admin users cannot open this page.')}</p></div><a class="button-lite" href="/admin">← Dashboard</a></div><div class="dashboard-grid"><section class="admin-panel"><h2>${tr(lang,'विद्यमान मुख्य प्रशासक','Existing Super Admins')}</h2>${users.map(u=>`<div class="village-admin-row"><code>${esc(u.user_id)}</code></div>`).join('')}</section><section class="admin-panel form-panel"><h2>${tr(lang,'नवीन मुख्य प्रशासक जोडा','Grant Super Admin')}</h2><form id="grantSuperAdminForm" class="stacked-form">${field('user_id','Existing Supabase Auth User ID','',{required:true})}<button class="btn btn-dark" type="submit">${tr(lang,'संपूर्ण प्रवेश द्या','Grant full access')}</button></form><p class="small-muted">${tr(lang,'ही कृती पूर्ण वेबसाइट व गावांवर प्रवेश देते. आधी Supabase → Auth → Users मध्ये खाते तयार करा.','This grants full village, staff and platform access. Create or invite the account using Supabase Authentication first.')}</p></section></div></main>`;
}

// A page is a menu of tasks, never a wall of unrelated fields.
const pageNames={home:['मुख्यपृष्ठ','Homepage'],about:['ग्रामपंचायतीबद्दल','About'],services:['लोकसेवा','Citizen services'],schemes:['शासकीय योजना','Government schemes'],projects:['विकासकामे','Development projects'],news:['बातम्या','News'],notices:['सूचना फलक','Notice board'],gallery:['गॅलरी','Photo & video gallery'],contact:['संपर्क','Contact']};
const recordCategories={
 officials:['about_group','representatives',[['representatives','पदाधिकारी','Office bearers'],['staff','कर्मचारी','Staff']]],
 notices:['notice_type','notice',[['notice','नोटीस / सूचना','Notices'],['financial','जमा खर्च अहवाल','Financial reports'],['rti','माहितीचा अधिकार','RTI documents'],['resolutions','शासन निर्णय','Government resolutions']]],
 gallery:['gallery_type','meetings',[['meetings','सभा','Meetings'],['campaigns','अभियान','Campaigns'],['development','विकासकामे','Development'],['cultural','सामाजिक व सांस्कृतिक','Social & cultural'],['press','पेपर कात्रणे','Newspaper clippings']]],
 schemes:['scheme_type','individual',[['individual','वैयक्तिक योजना','Individual schemes'],['public','सार्वजनिक योजना','Public development schemes']]],
 beneficiary_lists:['beneficiary_type','individual',[['individual','वैयक्तिक लाभार्थी','Individual beneficiaries'],['public','सार्वजनिक लाभार्थी','Public scheme beneficiaries']]],
 projects:['project_status','unclassified',[['ongoing','चालू','Ongoing'],['completed','पूर्ण','Completed'],['upcoming','आगामी','Upcoming'],['unclassified','इतर','Unclassified']]]
};
const recordParent={banners:'home',metrics:'home',leaders:'home',facilities:'home',officials:'about',about_facts:'about',committee_groups:'about',committees:'about',about_facilities:'about',duties:'about',about_blocks:'about',about_sections:'about',services:'services',service_steps:'services',service_forms:'services',service_links:'services',schemes:'schemes',beneficiary_lists:'schemes',projects:'projects',news:'news',notices:'notices',gallery:'gallery',videos:'gallery'};
const pageName=(section,lang)=>pageNames[section]?tr(lang,...pageNames[section]):tr(lang,'वेबसाइटची पाने','Website pages');
const safeParent=(kind,params)=>Object.hasOwn(pageNames,params.get('from')||'')?params.get('from'):recordParent[kind]||'overview';
const categoryFor=(kind,params)=>recordCategories[kind]?.[2].some(([key])=>key===params.get('category'))?params.get('category'):'';
function pageContentTools(vId,section,lang,slug){
 const base=`/admin/villages/${esc(vId)}`;
 const rec=(kind,mr,en,category='')=>[`${base}/content/${kind}?from=${section}${category?`&category=${category}`:''}`,mr,en,'document'];
 const setting=(mr,en,part='')=>[`${base}/${section}?view=settings${part?`&part=${part}`:''}`,mr,en,'settings'];
 const link=(path,mr,en,glyph='document')=>[`${base}/${path}`,mr,en,glyph];
 const cats=kind=>recordCategories[kind][2].map(([key,mr,en])=>rec(kind,mr,en,key));
 const groups={
 home:[['मुख्य भाग','Main area',[setting('मुख्य बॅनर फोटो','Main banner photo','banner'),rec('banners','स्लाइड फोटो','Banner slides'),setting('धावती सूचना','Scrolling message','announcement'),setting('स्वागत मजकूर','Welcome text','welcome')]],['मुख्यपृष्ठावरील माहिती','Homepage content',[rec('gallery','फोटो','Photos'),rec('notices','सूचना','Notices'),rec('leaders','मंत्री व राज्य पदाधिकारी','Ministers & state leaders'),rec('officials','पदाधिकारी','Village officials'),rec('schemes','योजना','Schemes'),rec('services','सेवा','Services'),rec('videos','व्हिडिओ','Videos'),rec('news','बातम्या','News'),rec('projects','विकासकामे','Projects'),rec('metrics','गावाचे आकडे','Village statistics'),rec('facilities','सुविधा','Facilities')]],['दिसणे व क्रम','Layout & appearance',[setting('विभागांचा क्रम','Show / hide & reorder sections','order'),setting('विभागांची शीर्षके','Section headings','headings'),setting('वरचा मेनू','Header & navigation','navigation'),setting('हवामान','Weather box','weather'),link('branding','वरचा लोगो','Header logo','image'),link('footer','फूटर व लोगो','Footer & logos','image')]]],
 about:[['गावाची माहिती','Village information',[rec('about_facts','गाव व लोकसंख्या','Village facts & population'),link('settings','गावाचे नाव व पत्ता','Village name & address','settings'),rec('about_sections','अतिरिक्त माहिती','Additional information')]],['पदाधिकारी व कर्मचारी','People',[...cats('officials')]],['समित्या','Committees',[rec('committee_groups','समितीची नावे','Committee names'),rec('committees','समिती सदस्य','Committee members')]],['इतर विभाग','Other sections',[rec('about_facilities','ग्राम सुविधा','Village facilities'),rec('duties','अतिरिक्त जबाबदाऱ्या','Additional duties'),rec('about_blocks','मजकूर व इतर घटक','Extra text, tables & images')]]],
 services:[['लोकसेवेचे विभाग','Service tabs',[rec('services','सेवा व कागदपत्रे','Services & required documents'),rec('service_steps','अर्ज प्रक्रिया','Application steps'),rec('service_forms','PDF अर्ज','Downloadable PDF forms'),rec('service_links','नागरिक सेवा लिंक','Citizen service links')]],['कर भरणा','Tax payment',[setting('QR कोड व पानाचे मजकूर','Payment QR & page text')]]],
 schemes:[['योजना','Scheme tabs',cats('schemes')],['लाभार्थी यादी','Beneficiary lists',cats('beneficiary_lists')]],
 projects:[['प्रकल्पांची स्थिती','Project status',cats('projects')]],
 news:[['बातम्या','News articles',[rec('news','बातम्या जोडा / बदला','Add or edit news')]]],
 notices:[['सूचना फलकाचे विभाग','Notice board tabs',cats('notices')]],
 gallery:[['फोटोचे विभाग','Photo categories',cats('gallery')],['व्हिडिओ','Videos',[rec('videos','व्हिडिओ जोडा / बदला','Add or edit videos')]]],
 contact:[['संपर्क माहिती','Office details',[link('settings','पत्ता, फोन व ईमेल','Address, phone & email','settings'),setting('नकाशा व संपर्क पान','Map & contact page text')]],['नागरिक अर्ज','Citizen forms',[link('submissions','आलेले अर्ज पहा','View received forms','mail'),[`/v/${esc(slug)}/contact?preview=1&contactTab=form`,'नागरिक फॉर्म पहा','Preview citizen form','document',true]]]]
 }[section];if(!groups)return '';
 const advanced=section==='home'||section==='contact'?[]:[['पानाचे सेटिंग्ज','Page settings',[setting('शीर्षके व टॅबची नावे','Page headings & tab labels')]]];
 const groupHtml=([mr,en,links])=>`<section class="gx63-group"><h2>${tr(lang,mr,en)}</h2><div class="gx63-task-grid">${links.map(([url,m,e,g,external])=>`<a class="gx63-task" href="${esc(url)}" ${external?'target="_blank" rel="noopener noreferrer"':''}><span class="gx63-task-icon">${icon(g)}</span><span>${esc(tr(lang,m,e))}</span><span aria-hidden="true">${external?'↗':'›'}</span></a>`).join('')}</div></section>`;
 return `<div class="gx63-page-hub"><div class="admin-page-top"><div><h1>${esc(pageName(section,lang))}</h1><p>${tr(lang,'काय बदलायचे आहे? खाली एक विभाग निवडा.','Choose the part you want to edit. Each part opens separately.')}</p></div><a class="button-lite" href="/v/${esc(slug)}${section==='home'?'':'/'+section}?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'पान पहा','View page')} ↗</a></div>${[...groups,...advanced].map(groupHtml).join('')}<details class="gx63-extra"><summary>${tr(lang,'या पानावर अधिक घटक','More page options')}</summary><a class="button-lite" href="${base}/content/page_elements?page=${section}&from=${section}">+ ${tr(lang,'नवीन घटक जोडा','Add element to this page')}</a><a class="button-lite" href="${base}/content/page_elements?from=${section}">${tr(lang,'आधीचे घटक बदला','Edit existing elements')}</a></details></div>`;
}
async function dashboard(lang,role,user){
 const villages=await adminVillages(role);
 if(!role.admin&&!role.editorIds?.length)return `<main class="admin-shell container"><div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'वापरकर्ता — फक्त वाचन','USER — READ ONLY')}</p><h1>${tr(lang,'तक्रार पाहणी','Complaint viewer')}</h1><p>${tr(lang,'तुम्ही फक्त नेमलेल्या गावांच्या नागरिक तक्रारी पाहू शकता.','You can only view complaints for assigned villages.')}</p></div></div><section class="admin-panel"><h2>${tr(lang,'माझ्या तक्रारी','Assigned complaint inboxes')}</h2>${villages.map(v=>`<div class="village-admin-row"><strong>${esc(loc(v,'name',lang))}</strong><a class="button-lite" href="/admin/villages/${esc(v.id)}/submissions">${tr(lang,'तक्रारी पहा','View complaints')} →</a></div>`).join('')||tr(lang,'गावे नेमलेली नाहीत.','No villages assigned.')}</section></main>`;
 return `<main class="admin-shell container gx62-dashboard"><div class="admin-page-top"><div><h1>${tr(lang,'माझ्या वेबसाइट','Village websites')}</h1><p>${tr(lang,'गाव निवडा किंवा नवीन वेबसाइट तयार करा.','Choose a website to edit, or create a new one.')}</p></div>${role.admin?`<a class="btn btn-dark" href="/admin/new-village">+ ${tr(lang,'नवीन वेबसाइट','New website')}</a>`:''}</div><section class="admin-panel gx62-sites"><div class="panel-heading"><h2>${tr(lang,'सर्व वेबसाइट','All websites')} (${villages.length})</h2></div>${villages.length?`<div class="gx62-site-grid">${villages.map(v=>{const editable=role.admin||role.editorIds?.includes(v.id),base=`/admin/villages/${esc(v.id)}`;return `<article class="gx62-site-card"><div class="gx62-site-title"><span class="gx62-site-icon">${icon('home')}</span>${pill(v.status)}</div><h2>${esc(loc(v,'name',lang)||v.slug)}</h2><p>/v/${esc(v.slug)} · ${esc(loc(v,'district',lang))}</p><div class="gx62-site-actions">${editable?`<a class="btn btn-dark" href="${base}/overview">${tr(lang,'वेबसाइट संपादित करा','Edit website')} →</a><a class="button-lite" href="${base}/submissions">${tr(lang,'अर्ज पहा','Forms')}</a>`:`<a class="btn btn-dark" href="${base}/submissions">${tr(lang,'अर्ज पहा','View forms')} →</a>`}</div>${editable?`<details class="gx62-list-menu"><summary>${tr(lang,'अधिक','More')}</summary><a class="button-lite" href="/v/${esc(v.slug)}?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्वावलोकन','Preview')} ↗</a>${role.admin?`<button class="button-danger" type="button" data-action="archive-site" data-id="${esc(v.id)}" data-village-name="${esc(v.slug)}">${v.status==='archived'?tr(lang,'परत आणा','Restore'):tr(lang,'वेबसाइट काढा','Remove website')}</button>`:''}</details>`:''}</article>`}).join('')}</div>`:`<p class="empty-data">${tr(lang,'अजून वेबसाइट नाहीत.','No websites yet.')}</p>`}</section>${role.admin?`<nav class="gx62-platform"><a class="button-lite" href="/admin/clients">${tr(lang,'ग्राहक नोंदवही','Customers')}</a><a class="button-lite" href="/admin/staff">${tr(lang,'कर्मचारी खाते','Staff accounts')}</a><a class="button-lite" href="/admin/users">${tr(lang,'मुख्य प्रशासक','Super Admin users')}</a></nav>`:''}</main>`;
}

// Every homepage text, navigation label and footer field is editable.
// Content lists (banner slides, news, gallery etc.) are edited through sidebar collections.
const extraSiteGroups=[
 ['ABOUT PAGE / ग्रामपंचायतीबद्दल',[
  ['about_page_title_mr','Page heading — Marathi'],['about_page_title_en','Page heading — English'],
  ['about_overview_heading_mr','Introduction heading — Marathi'],['about_overview_heading_en','Introduction heading — English'],
  ['about_intro_mr','Introduction line — Marathi','textarea'],['about_intro_en','Introduction line — English','textarea'],
  ['about_info_heading_mr','Information card title — Marathi'],['about_info_heading_en','Information card title — English'],
  // Only ADDITIONS are editable. The reference mission and values are locked in source.
  ['about_mission_mr','अतिरिक्त ध्येय मुद्दे — Marathi (one per line)','textarea'],['about_mission_en','Additional mission points — English (one per line)','textarea'],
  ['about_vision_mr','अतिरिक्त मूलभूत मूल्ये — Marathi (one per line)','textarea'],['about_vision_en','Additional values — English (one per line)','textarea'],
  ['about_sections_heading_mr','Additional sections heading — Marathi'],['about_sections_heading_en','Additional sections heading — English'],
  ['about_team_heading_mr','Staff/officials heading — Marathi'],['about_team_heading_en','Staff/officials heading — English'],
  ...[['info','सर्व माहिती','All Information'],['officials','पदाधिकारी','Office Bearers'],['staff','कर्मचारी','Staff'],['committees','ग्रामपंचायत समित्या','Committees'],['facilities','ग्राम पायाभूत सुविधा','Facilities'],['duties','भूमिका व जबाबदाऱ्या','Roles and Duties']].flatMap(([key,mr,en])=>[[`about_tab_${key}_mr`,`${mr} — tab label (Marathi)`],[`about_tab_${key}_en`,`${en} — tab label (English)`]]),
  ...['about_information_heading','about_primary_heading','about_population_heading','about_representatives_heading','about_staff_heading','about_committees_heading','about_facilities_heading','about_column_no','about_column_name','about_column_designation','about_column_role','about_empty_message','about_label_ward','about_label_elected'].flatMap(key=>[[`${key}_mr`,`${key.replaceAll('_',' ')} — Marathi`],[`${key}_en`,`${key.replaceAll('_',' ')} — English`]])]],

 ['LOKSEVA / CITIZEN SERVICES PAGE',[
  ['services_page_title_mr','Page heading — Marathi'],['services_page_title_en','Page heading — English'],
  ['services_all_heading_mr','View all tab — Marathi'],['services_all_heading_en','View all tab — English'],
  ['services_documents_label_mr','Documents label — Marathi'],['services_documents_label_en','Documents label — English'],
  ['services_process_label_mr','Process label — Marathi'],['services_process_label_en','Process label — English'],
  ['services_fee_label_mr','Fee label — Marathi'],['services_fee_label_en','Fee label — English'],
  ['services_time_label_mr','Time label — Marathi'],['services_time_label_en','Time label — English'],
  ['services_intro_mr','Page subtitle — Marathi','textarea'],['services_intro_en','Page subtitle — English','textarea'],
  ['services_payment_qr_url','Tax payment QR image URL (HTTPS; specific to this village)'],
  ...['available','steps','forms','links','qr'].flatMap(k=>[[`services_${k}_heading_mr`,`${k} heading — Marathi`],[`services_${k}_heading_en`,`${k} heading — English`]])]],
 ['GOVERNMENT SCHEMES PAGE / शासकीय योजना',[
   ...[['schemes_page_title','Page title'],['schemes_intro','Introductory subtitle'],
        ['schemes_tab_all','All Schemes tab'],['schemes_tab_individual','Individual Benefits tab'],['schemes_tab_public','Public Development tab'],['schemes_tab_beneficiaries','Beneficiary Lists subpage tab'],
        ['schemes_section_individual','Individual section heading'],['schemes_section_public','Public section heading'],
        ['schemes_empty_individual','Individual empty message'],['schemes_empty_public','Public empty message'],
        ['schemes_summary_label','Overview label'],['schemes_eligibility_label','Eligibility label'],
        ['schemes_benefits_label','Benefits label'],['schemes_documents_label','Required documents label'],
        ['schemes_process_label','How to apply label'],['schemes_note_label','Important note label'],
        ['schemes_link_label','Official link button']]
        .flatMap(([key,title])=>[[`${key}_mr`,`${title} — Marathi`,key.includes('intro')||key.includes('empty')?'textarea':undefined],
                                  [`${key}_en`,`${title} — English`,key.includes('intro')||key.includes('empty')?'textarea':undefined]])]],
 ['BENEFICIARY LISTS PAGE / लाभार्थी यादी',[
   ...[['beneficiaries_page_title','Page title'],['beneficiaries_page_intro','Page subtitle'],['beneficiaries_lists_heading','List section heading'],['beneficiaries_schemes_heading','Other schemes heading']].flatMap(([key,title])=>[[`${key}_mr`,`${title} — Marathi`],[`${key}_en`,`${title} — English`]])]],
 ['NEWS PAGE / बातम्या',[
   ...[['news_page_title','Page title'],['news_page_intro','Page subtitle'],['news_sidebar_heading','Right sidebar heading'],['news_read_label','Read article button'],['news_source_label','Source link label'],['news_related_heading','Related articles section heading'],['news_empty','Empty page message']].flatMap(([k,title])=>[[`${k}_mr`,`${title} — Marathi`,k.includes('intro')?'textarea':undefined],[`${k}_en`,`${title} — English`,k.includes('intro')?'textarea':undefined]])]],
 ['CONTACT PAGE / संपर्क',[
  ...[['contact_page_title','Page heading'],['contact_page_intro','Page subtitle'],
  ['contact_address_heading','Address section heading'],['contact_map_heading','Map section heading'],
  ['contact_social_heading','Social section heading'],['contact_form_heading','Message / complaint form heading'],
  ...['details','map','social','form'].map(k=>[`contact_tab_${k}`,`Contact ${k} tab`])
  ].flatMap(([key,title])=>[[`${key}_mr`,`${title} — Marathi`,key==='contact_page_intro'?'textarea':undefined],[`${key}_en`,`${title} — English`,key==='contact_page_intro'?'textarea':undefined]]),
  ['contact_map_url','Google Maps direction link (HTTPS)'],
  ['contact_map_embed_url','Google Maps embed URL (Google domains only)']]],
 ['GALLERY PAGE / फोटो गॅलरी',[
   ...[['gallery_page_title','Page title'],['gallery_page_intro','Page subtitle'],['gallery_empty','Empty category message'],
     ...['all','meetings','campaigns','development','cultural','press','videos'].map(k=>[`gallery_tab_${k}`,`${k} tab label`]),
     ...['meetings','campaigns','development','cultural','press','videos'].map(k=>[`gallery_section_${k}`,`${k} section heading`])
   ].flatMap(([k,title])=>[[`${k}_mr`,`${title} — Marathi`],[`${k}_en`,`${title} — English`]])]],
 ['NOTICE BOARD PAGE / नोटीस बोर्ड',[
   ...[['notices_page_title','Page title'],['notices_intro','Introductory subtitle'],
        ['notices_tab_notice','Notices tab'],['notices_tab_financial','Income and Expense Reports tab'],
        ['notices_tab_rti','RTI tab'],['notices_tab_resolutions','Government Resolutions tab'],
        ['notices_section_notice','Notices section heading'],['notices_section_financial','Financial reports section heading'],
        ['notices_section_rti','RTI documents section heading'],['notices_section_resolutions','Government resolutions section heading'],
        ['notices_download_label','PDF download button'],['notices_missing_pdf','Missing PDF message'],
        ['notices_empty','No records available message']].flatMap(([key,title])=>[
          [`${key}_mr`,`${title} — Marathi`,key==='notices_intro'?'textarea':undefined],
          [`${key}_en`,`${title} — English`,key==='notices_intro'?'textarea':undefined]])]],
 ['DEVELOPMENT PROJECTS PAGE / विकासकामे',[
  ...[['projects_page_title','Page title'],['projects_intro','Introductory subtitle'],
      ['projects_tab_all','All Information tab'],['projects_tab_ongoing','Ongoing Projects tab'],
      ['projects_tab_completed','Completed Projects tab'],['projects_tab_upcoming','Upcoming Projects tab'],
      ['projects_section_ongoing','Ongoing section heading'],['projects_section_completed','Completed section heading'],
      ['projects_section_upcoming','Upcoming section heading'],['projects_section_other','Unclassified section heading'],
      ['projects_empty_ongoing','No ongoing projects message'],['projects_empty_completed','No completed projects message'],
      ['projects_empty_upcoming','No upcoming projects message'],['projects_empty_other','Unclassified projects message'],
      ['projects_name_label','Work name label'],['projects_scheme_label','Scheme label'],['projects_year_label','Year label'],
      ['projects_location_label','Location label'],['projects_info_label','Additional information label']
     ].flatMap(([key,title])=>[[`${key}_mr`,`${title} — Marathi`],[`${key}_en`,`${title} — English`]])]],
 ['HEADER / NAVIGATION',[
  ['brand_title_mr','Exact header title — Marathi'],['brand_title_en','Exact header title — English'],
  ['brand_subtitle_mr','Exact header subtitle (Taluka / District) — Marathi'],['brand_subtitle_en','Exact header subtitle — English'],
  ['nav_mr','Navigation — Marathi (one line: page-key | display label)','textarea'],
  ['nav_en','Navigation — English (one line: page-key | display label)','textarea']]],
 ['WELCOME / HERO',[
  ['welcome_title_mr','Blue welcome title — Marathi'],['welcome_title_en','Blue welcome title — English'],
  ['welcome_subtitle_mr','Welcome subtitle — Marathi'],['welcome_subtitle_en','Welcome subtitle — English'],
  ['welcome_button_mr','Welcome button — Marathi'],['welcome_button_en','Welcome button — English']]],
 ['HOMEPAGE SECTION HEADINGS',[
  ...['gallery','notices','leaders','officials','schemes','services','videos','news','projects','facilities','contact','weather','statistics'].flatMap(k=>[
   [`${k}_heading_mr`,`${k} section heading — Marathi`],[`${k}_heading_en`,`${k} section heading — English`]])]],
 ['WEATHER / हवामान',[
  ['weather_placeholder_mr','Weather placeholder — Marathi'],['weather_placeholder_en','Weather placeholder — English'],
  ['weather_link_label_mr','Weather link label — Marathi'],['weather_link_label_en','Weather link label — English'],
  ['weather_embed_url','Optional weather webpage URL (https://...)']]],
 ['FOOTER / LINKS & CONTACT',[
  // Marathi label and the legal imprint are platform-owned, not per-village fields.
  ['footer_social_heading_en','Social Media — Footer heading (English)'],
  ...['footer_social_body','footer_links_heading','footer_pages_heading','footer_contact_heading'].flatMap(k=>[
   [`${k}_mr`,`${k.replaceAll('_',' ')} — Marathi`,k==='footer_social_body'?'textarea':undefined],
   [`${k}_en`,`${k.replaceAll('_',' ')} — English`,k==='footer_social_body'?'textarea':undefined]]),
  ['footer_pages_mr','Footer navigation (page-key | Marathi label)','textarea'],
  ['footer_pages_en','Footer navigation (page-key | English label)','textarea']]]
];
const extraSiteKeys=extraSiteGroups.flatMap(g=>g[1].map(f=>f[0]));
function extraSiteSettings(v,lang){
 const ss=v.site_settings||{};
 return `<div class="admin-blue-note"><strong>${tr(lang,'प्रत्येक विभाग थेट ॲडमिनमधून बदला','Edit every homepage area directly in admin')}</strong><br>${tr(lang,'बॅनर स्लाइड, फोटो, बातम्या, नोटिसा, लोकसेवा, आकडे आणि व्हिडिओ साइडबारमधून व्यवस्थापित करा.','Use the sidebar to add/remove/reorder slideshow images, gallery photos, news, notices, services, statistics, and videos. The fields below control the exact text appearing on the homepage. Empty text fields use interface defaults.')}</div>`+
 extraSiteGroups.map(([group,fields])=>`<section class="admin-panel form-panel"><div class="panel-heading"><h2>${esc(group)}</h2></div><div class="form-grid">${fields.map(([key,title,type])=>field(key,title,ss[key]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div>${group.startsWith('ABOUT PAGE')?`<div class="upload-row"><a class="button-lite" href="/v/${esc(v.slug)}/about?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'About पानाचे प्रिव्ह्यू','Preview About page')} ↗</a><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/about_sections">${tr(lang,'अतिरिक्त About विभाग संपादित करा','Edit plain-text About sections')} →</a></div>`:''}</section>`).join('');
}

const sections=['gallery_notice','leaders_schemes','services_video','news','projects','facilities'];
const sectionNames={gallery_notice:['फोटो गॅलरी आणि नोटीस बोर्ड','Gallery + Notice Board'],leaders_schemes:['पदाधिकारी आणि शासकीय योजना','Leaders + Government Schemes'],services_video:['लोकसेवा आणि व्हिडिओ','Services + Video Gallery'],news:['बातम्या','News'],projects:['विकासकामे','Development Works'],facilities:['ग्राम पायाभूत सुविधा','Village Statistics']};
const sectionLabel=(l,k)=>sectionNames[k]?.[l==='mr'?0:1]||k;
function seoEditor(v,lang){
 const selected=new URLSearchParams(location.search).get('page');
 const page=SEO_PAGES.includes(selected)?selected:'home';
 const data=v.site_settings?.seo?.[page]||{};
 const defaultTitle=resolveSEO(v,page).title;
 const base=`/admin/villages/${encodeURIComponent(v.id)}/seo`;
 const preview=`/v/${encodeURIComponent(v.slug)}${page==='home'?'':'/'+page}?preview=1`;
 return `<div class="admin-page-top"><div><p class="eyebrow">SEO / METADATA</p><h1>${tr(lang,'शोध इंजिन मेटाडेटा','SEO & Page Metadata')}</h1><p>${tr(lang,'प्रत्येक गावाच्या प्रत्येक पानाचे ब्राउझर शीर्षक आणि Google वर्णन वेगळे बदला. पानावर दिसणारे शीर्षक पान संपादकात बदला.','Set a separate browser title, search description and sharing image for each village page. Visible page headings are edited in their page editors.')}</p></div><a class="button-lite" href="${preview}" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्वावलोकन','Preview')} ↗</a></div>
 <div class="admin-blue-note">${tr(lang,'येथे साठवलेला मजकूर फक्त या गावाचा आहे. रिकामे फील्ड गावाचे नाव आणि मूळ संदर्भ शीर्षक वापरतात.','These fields belong only to this village. Blank values use the village name and reference page heading as defaults.')}</div>
 <div class="admin-blue-note"><strong>${tr(lang,'स्वयंचलित Google Sitemap','Automatic Google Sitemap')}</strong><p>${tr(lang,'नवीन प्रकाशित गाव व बातमीची URL साइटमॅपमध्ये आपोआप येईल. मसुदा किंवा Noindex असलेली पाने येणार नाहीत.','Published village pages and news articles are added automatically. Drafts and noindex pages are excluded.')}</p><a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">/sitemap.xml ↗</a> · <a href="/robots.txt" target="_blank" rel="noopener noreferrer">/robots.txt ↗</a></div>
 <nav class="seo-page-tabs" aria-label="Select page to edit">${SEO_PAGES.map(key=>`<a class="${key===page?'active':''}" href="${base}?page=${key}">${esc(SEO_LABELS[key])}</a>`).join('')}</nav>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${esc(SEO_LABELS[page])} — ${tr(lang,'मेटाडेटा','Metadata')}</h2></div>
 <form id="seoSettingsForm" data-id="${esc(v.id)}" data-page="${page}"><div class="form-grid">
 ${field('seo_title',tr(lang,'ब्राउझर / Google शीर्षक','Browser / Google Title'),data.title||'',{placeholder:defaultTitle})}
 ${field('seo_keywords',tr(lang,'कीवर्ड्स (ऐच्छिक)','Keywords (optional)'),data.keywords||'')}
 ${field('seo_description',tr(lang,'शोध वर्णन','Search description'),data.description||'',{textarea:true,rows:4,wide:true})}
 ${field('seo_image_url',tr(lang,'शेअरिंग प्रतिमा URL (HTTPS)','Social sharing image URL (HTTPS)'),data.image_url||'',{type:'url'})}
 <label class="field"><span>${tr(lang,'शोध इंजिनमध्ये दिसावे?','Search engine indexing')}</span><select name="seo_noindex"><option value="false" ${data.noindex?'':'selected'}>${tr(lang,'होय — प्रकाशित पान','Yes — published page')}</option><option value="true" ${data.noindex?'selected':''}>${tr(lang,'नाही — Noindex','No — Noindex')}</option></select></label>
 </div><div class="upload-row"><label class="upload-box">${icon('image')} ${tr(lang,'शेअरिंग प्रतिमा अपलोड करा','Upload sharing image')}<input type="file" data-image-input data-target="seo_image_url" data-village="${esc(v.id)}" accept="image/jpeg,image/png,image/webp" /></label></div>
 <div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'मेटाडेटा जतन करा','Save metadata')}</button></div></form></section>
 <section class="admin-panel"><h2>${tr(lang,'कसे काम करते','How it works')}</h2><p>${tr(lang,'मेटाडेटा प्रत्येक गावासाठी वेगळे आहे. शीर्षक आणि वर्णन सेव्ह केल्यावर सार्वजनिक पानांवर लागू होते. डेमो, मसुदे आणि खाजगी पूर्वावलोकन शोध इंजिनपासून दूर ठेवले जातात.','Metadata is scoped per village. Saved titles and descriptions are applied on public page navigation. Demo, unpublished villages and private previews remain noindex.')}</p><a class="button-lite" href="/admin/villages/${esc(v.id)}">${tr(lang,'दिसणारे शीर्षक बदलण्यासाठी गाव सेटिंग्ज','Village settings for visible headings')} →</a></section></div>`;
}

function overviewEditor(v,lang,items=[],draft=null,role={admin:false}){
 const ss=v.site_settings||{};
 const logos=Array.isArray(ss.footer_logos)?ss.footer_logos.filter(imageURL).length:(imageURL(ss.footer_logo_url)?1:0);
 const notice=String(ss.quote_mr||ss.quote_en||'').trim();const pending=items.filter(x=>x.status==='draft').length;
 const routes=[
  ['submissions','आलेले अर्ज','Received forms','नागरिकांचे अर्ज पहा','Read citizen submissions'],
  ['content/service_forms','PDF अर्ज','PDF forms','अर्ज जोडा व बदला','Add and edit downloadable forms'],
  ['home','मुख्यपृष्ठ','Home page','बॅनर, स्वागत आणि धावती सूचना','Banner, welcome & scrolling message'],
  ['about','ग्रामपंचायतीबद्दल','About','गावाची माहिती आणि पदाधिकारी','Village information & officials'],
  ['services','लोकसेवा','Services','सेवा आणि फॉर्म','Services & forms'],
  ['projects','विकासकामे','Projects','कामे व प्रगती','Projects & progress'],
  ['schemes','योजना','Schemes','योजना व लाभार्थी','Schemes & beneficiaries'],
  ['news','बातम्या','News','बातम्या व लेख','News & articles'],
  ['gallery','फोटो गॅलरी','Gallery','फोटो व व्हिडिओ','Photos & videos'],
  ['contact','संपर्क','Contact','नकाशा व समाजमाध्यमे','Map & social media'],
  ['notices','सूचना','Notices','सूचना व PDF','Notices & PDF'],
  ['branding','वरचा लोगो','Navbar logo','या गावाच्या सर्व पानांवर','Header logo for every page of this village'],
  ['footer','तळाचे लोगो आणि फूटर','Footer & bottom logos','फक्त या गावाच्या सर्व पानांवर','Same on each page of this village']
 ];
 return `<div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'व्यवस्थापन / सुरुवात','MANAGE / START HERE')}</p><h1>${tr(lang,'वेबसाइट संपादन केंद्र','Edit website')}</h1><p>${tr(lang,'एकावेळी एकच पान निवडा. बाकी सर्व सेटिंग्ज आणि माहिती जशी आहे तशीच राहील.','Choose one area at a time. Your existing settings and village content remain unchanged.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्ण वेबसाइट पहा','Open website')} ↗</a></div>
 <section class="admin-panel admin-v42-publishing"><div><span class="eyebrow">${tr(lang,'प्रकाशन केंद्र','PUBLISHING DESK')}</span><h2>${tr(lang,'मसुदे व प्रकाशित वेबसाइट','Drafts & website publishing')}</h2><p>${draft?tr(lang,'जतन केलेले बदल आहेत. प्रकाशित करण्यापूर्वी प्रिव्ह्यू तपासा.','You have saved draft changes. Preview them before publishing.') :tr(lang,'मुख्यपृष्ठ व गावाचे तपशील स्वतंत्र मसुद्यात जतन करता येतात.','Save edits as drafts, then publish when ready.')}</p><div class="admin-draft-pill">${draft?`<strong>${tr(lang,'मसुदा जतन केला','Draft saved')}</strong> · ${esc(new Date(draft.updated_at).toLocaleString())}`:tr(lang,'वेबसाइट मसुदा नाही','No website draft')} · ${pending} ${tr(lang,'सामग्री मसुदे','content drafts')}</div></div><div class="admin-v42-publish-actions">${draft?`<button type="button" class="btn btn-dark" data-action="publish-site-draft">${tr(lang,'जतन केलेले बदल प्रकाशित करा','Publish saved changes')}</button><button type="button" class="button-lite" data-action="discard-site-draft">${tr(lang,'मसुदा टाका','Discard draft')}</button>`:''}<button type="button" class="button-lite" data-action="site-status" data-id="${esc(v.id)}" data-next="${v.status==='published'?'draft':'published'}">${v.status==='published'?tr(lang,'वेबसाइट अप्रकाशित करा','Unpublish website'):tr(lang,'वेबसाइट प्रकाशित करा','Publish website')}</button>${role.admin?`<button type="button" class="button-danger" data-action="archive-site" data-id="${esc(v.id)}">${v.status==='archived'?tr(lang,'गाव पुन्हा सुरू करा','Restore village'):tr(lang,'वेबसाइट काढा (संग्रह)','Remove website (archive)')}</button>`:''}</div></section>
 <div class="admin-overview-metrics"><div><span>${tr(lang,'वेबसाइट स्थिती','Website status')}</span><strong>${esc(v.status)}</strong></div><div><span>${tr(lang,'तळाचे लोगो','Bottom logos')}</span><strong>${logos} / 12</strong></div><div><span>${tr(lang,'धावती सूचना','Scrolling message')}</span><strong>${notice?tr(lang,'सेट केली आहे','Configured'):tr(lang,'अद्याप जोडलेली नाही','Not set')}</strong></div></div>
 <div class="admin-overview-head"><h2>${tr(lang,'काय बदलायचे आहे?','What do you want to edit?')}</h2><p>${tr(lang,'खालील प्रत्येक कार्ड संबंधित पानाच्या संपादकाकडे घेऊन जाते.','Each card opens the editor for that part of the website.')}</p></div>
 <div class="admin-overview-grid">${routes.map(([path,mr,en,descMr,descEn])=>`<a class="admin-overview-card" href="${path.startsWith('/')?path:`/admin/villages/${esc(v.id)}/${path}`}"><span class="admin-overview-icon">${icon('document')}</span><strong>${esc(tr(lang,mr,en))}</strong><small>${esc(tr(lang,descMr,descEn))}</small><span class="admin-overview-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
 <section class="admin-panel admin-overview-note"><div class="panel-heading"><h2>${tr(lang,'धावती सूचना — सर्व पानांवर एकच','One announcement across all pages')}</h2></div><p>${esc(notice||tr(lang,'मुख्यपृष्ठामध्ये संदेश जोडा.','Add a message in the homepage editor.'))}</p><a class="button-lite" href="/admin/villages/${esc(v.id)}/home">${tr(lang,'धावती सूचना संपादित करा','Edit announcement')} →</a></section>
 `;
}

function previewPanel(v,lang,path=''){
 const url=`/v/${encodeURIComponent(v.slug)}${path?`/${path}`:''}?preview=1`;
 return `<section class="admin-panel form-panel admin-preview-wide"><div class="panel-heading"><div><h2>${tr(lang,'मोठे वेबसाइट पूर्वावलोकन','Large website preview')}</h2><p>${tr(lang,'सेव्ह केल्यावर इथे बदल दिसतील. पूर्ण वेबसाइट पाहण्यासाठी बटण वापरा.','Save your changes, then preview here. Open the full page for a closer look.')}</p></div><div class="admin-preview-tools"><button class="button-lite" type="button" data-action="preview-refresh">${tr(lang,'पुन्हा लोड करा','Refresh preview')}</button><a class="button-lite" href="${url}" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्ण पान उघडा','Open full page')} ↗</a></div></div><div class="admin-preview-frame"><iframe title="Saved website preview" src="${url}" loading="lazy"></iframe></div></section>`;
}
const editGroup=(v,lang,title,prefix)=>{
 const fields=extraSiteGroups.find(([name])=>name.startsWith(prefix))?.[1]||[];
 return `<details class="admin-edit-advanced"><summary>${esc(title)}</summary><div class="form-grid">${fields.map(([key,labelText,type])=>field(key,labelText,(v.site_settings||{})[key]||'',{textarea:type==='textarea',rows:4,wide:type==='textarea'})).join('')}</div></details>`;
};
function settings(v,lang,role){
 return `<div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'गाव / माहिती','VILLAGE / INFORMATION')}</p><h1>${tr(lang,'गावाची माहिती','Village information')}</h1><p>${tr(lang,'फक्त गावाचे नाव, पत्ता, संपर्क आणि मुख्य लोगो येथे बदला. मुख्यपृष्ठ स्वतंत्र आहे.','Change the village name, contact information and main logo here. Edit the homepage separately.')}</p></div><a class="button-lite" href="/admin/villages/${esc(v.id)}/home">${tr(lang,'मुख्यपृष्ठ संपादित करा','Edit homepage')} →</a></div>
 <div class="publish-bar"><div><strong>${tr(lang,'वेबसाइट प्रकाशित आहे का?','Website publication status')}</strong><p>${tr(lang,'मसुद्यातील वेबसाइट सामान्य नागरिकांना दिसणार नाही.','A draft website is not publicly visible.')}</p></div>${pill(v.status)}<button type="button" class="btn ${v.status==='published'?'btn-outline':'btn-dark'}" data-action="site-status" data-id="${esc(v.id)}" data-next="${v.status==='published'?'draft':'published'}">${v.status==='published'?tr(lang,'प्रकाशन थांबवा','Unpublish'):tr(lang,'प्रकाशित करा','Publish')}</button></div>
 <form id="settingsForm" data-id="${esc(v.id)}"><section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'गावाचे नाव व पत्ता','Village name & address')}</h2></div><div class="form-grid">
 ${field('slug','Website URL / गावाची लिंक',v.slug,{required:true})}${field('phone',tr(lang,'फोन नंबर','Phone number'),v.phone)}
 ${field('name_mr','गावाचे नाव — मराठी',v.name_mr)}${field('name_en','Village name — English',v.name_en)}
 ${field('tagline_mr','गावाची छोटी ओळ — मराठी',v.tagline_mr)}${field('tagline_en','Short village description — English',v.tagline_en)}
 ${field('taluka_mr','तालुका — मराठी',v.taluka_mr)}${field('taluka_en','Taluka — English',v.taluka_en)}
 ${field('district_mr','जिल्हा — मराठी',v.district_mr)}${field('district_en','District — English',v.district_en)}
 ${field('address_mr','पत्ता — मराठी',v.address_mr,{textarea:true})}${field('address_en','Address — English',v.address_en,{textarea:true})}
 ${field('about_mr','गावाचे वर्णन — मराठी',v.about_mr,{textarea:true,rows:4})}${field('about_en','Village description — English',v.about_en,{textarea:true,rows:4})}
 ${field('email','Email',v.email,{type:'email'})}
 <label class="field"><span>${tr(lang,'सध्याची थीम','Current website design')}</span><select name="template_style"><option value="classic" selected>Shamvadi Blue</option></select></label>
 </div></section><section class="admin-panel form-panel"><div class="panel-heading"><div><h2>${tr(lang,'मुख्य ग्रामपंचायत लोगो','Main village logo')}</h2><p>${tr(lang,'हा लोगो वरच्या पट्टीत दिसतो. खालील १२ लोगो वेगळ्या पानावर संपादित करा.','This logo is shown in the header. For appearance, size and shape open Navbar logo. Bottom logos are separate.')}</p></div></div>
 ${field('logo_url','Logo image URL (HTTPS)',v.logo_url,{type:'url',wide:true})}<div class="admin-logo-preview"><img src="${esc(imageURL(v.logo_url)||'/assets/reference-demo/reference-logo.png')}" width="76" height="76" alt="Village logo"><p>${tr(lang,'लोगो आयतामध्ये न ताणता योग्य प्रमाणात दिसेल.','The logo keeps its original proportions.')}</p></div><label class="upload-box">${icon('image')} ${tr(lang,'लोगो अपलोड करा','Upload logo')}<input type="file" data-image-input data-target="logo_url" data-village="${esc(v.id)}" accept="image/png,image/jpeg,image/webp"></label></section>
 <div class="settings-actions"><button class="btn btn-dark" type="submit" value="draft" data-save-mode="draft">${icon('check')} ${tr(lang,'मसुदा जतन करा','Save draft')}</button><button class="button-lite" type="submit" value="publish" data-save-mode="publish">${tr(lang,'आत्ताच प्रकाशित करा','Save & publish now')}</button>${role?.admin?`<button class="button-danger" type="button" data-action="archive-site" data-id="${esc(v.id)}">${v.status==='archived'?tr(lang,'मसुदा म्हणून पुनर्संचयित करा','Restore draft'):tr(lang,'वेबसाइट संग्रहित करा','Remove (archive) village')}</button>`:''}</div></form>`;
}
function homeEditor(v,lang){
 const ss=v.site_settings||{};
 const homepageGroups=[['WELCOME / HERO','Welcome area text'],['HOMEPAGE SECTION HEADINGS','Section titles'],['HEADER / NAVIGATION','Website header & menu'],['WEATHER /','Weather box']];
 return `<div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'पान १ / मुख्यपृष्ठ','PAGE 1 / HOME')}</p><h1>${tr(lang,'मुख्यपृष्ठ संपादित करा','Edit homepage')}</h1><p>${tr(lang,'बॅनर, वरची धावती सूचना, स्वागत आणि विभाग येथे बदला. हे फक्त या गावासाठी लागू होते.','Edit the banner, scrolling message, welcome text and homepage sections for this village.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'मुख्यपृष्ठ उघडा','View homepage')} ↗</a></div>
 <form id="homeForm" data-id="${esc(v.id)}">
 <section class="admin-panel form-panel"><div class="panel-heading"><div><h2>1. ${tr(lang,'मुख्य बॅनर','Main banner')}</h2><p>${tr(lang,'मुख्य बॅनर फोटो. आणखी फोटो खालील बटणातून जोडा.','Choose a banner picture. Add more sliding pictures from the link below.')}</p></div></div><div class="form-grid">${field('hero_image_url','Main banner image URL (HTTPS)',v.hero_image_url,{type:'url',wide:true})}<div class="gx65-photo-preview"><img data-banner-photo src="${esc(imageURL(v.hero_image_url)||'/assets/reference-demo/hero-tree.webp')}" alt="Main banner preview"></div></div><div class="upload-row"><label class="upload-box">${icon('image')} ${tr(lang,'बॅनर फोटो अपलोड करा','Upload banner picture')}<input type="file" data-image-input data-target="hero_image_url" data-village="${esc(v.id)}" accept="image/png,image/jpeg,image/webp"></label><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/banners">+ ${tr(lang,'अधिक स्लाइड फोटो जोडा','Add more banner slides')}</a></div></section>
 <section class="admin-panel form-panel"><div class="panel-heading"><div><h2>2. ${tr(lang,'सर्व पानांवरची धावती सूचना','Scrolling message — every page')}</h2><p>${tr(lang,'नेव्हिगेशन पट्टीखालील संदेश. या गावाच्या सर्व पानांवर एकच संदेश वापरला जाईल.','One shared scrolling message beneath the navigation on every page of this village.')}</p></div></div><div class="form-grid">${field('quote_mr','धावती सूचना — मराठी',ss.quote_mr||'',{textarea:true,rows:2})}${field('quote_en','Scrolling message — English',ss.quote_en||'',{textarea:true,rows:2})}</div></section>
 ${homepageGroups.map(([prefix,title],i)=>`<section class="admin-panel form-panel"><div class="panel-heading"><h2>${i+3}. ${esc(title)}</h2></div>${editGroup(v,lang,tr(lang,'या विभागातील मजकूर संपादित करा','Edit text in this area'),prefix)}</section>`).join('')}
 <section class="admin-panel form-panel"><div class="panel-heading"><div><h2>7. ${tr(lang,'मुख्यपृष्ठावर कोणते विभाग दिसतील','Show and order homepage sections')}</h2><p>${tr(lang,'वर-खाली बटणांनी क्रम बदला. विभाग काढल्यास त्यातील डेटा नष्ट होत नाही.','Move sections up or down. Hiding a section does not delete its content.')}</p></div></div><div id="sectionOrder" class="section-order">${(v.home_sections||sections).filter(s=>sections.includes(s)).map((s,i)=>`<div class="order-row" data-section="${esc(s)}"><span class="drag-index">${String(i+1).padStart(2,'0')}</span><strong>${sectionLabel(lang,s)}</strong><button type="button" data-action="section-up" aria-label="Move up">↑</button><button type="button" data-action="section-down" aria-label="Move down">↓</button><button type="button" data-action="section-remove" aria-label="Hide section">✕</button></div>`).join('')}</div><div class="section-pick">${sections.map(s=>`<button type="button" class="button-lite" data-action="section-add" data-section="${s}" data-label="${esc(sectionLabel(lang,s))}">+ ${sectionLabel(lang,s)}</button>`).join('')}</div></section>
 <div class="settings-actions"><button type="submit" value="draft" data-save-mode="draft" class="btn btn-dark">${icon('check')} ${tr(lang,'मसुदा जतन करा','Save draft')}</button><button type="submit" value="publish" data-save-mode="publish" class="button-lite">${tr(lang,'थेट वेबसाइटवर लागू करा','Save & publish now')}</button><span class="admin-save-hint" hidden>${tr(lang,'सेव्ह न केलेले बदल','Unsaved changes')}</span></div></form>${previewPanel(v,lang)}`;
}
function navbarBrandingEditor(v,lang){
 const ss=v.site_settings||{};
 const shown=imageURL(ss.nav_logo_url)||imageURL(v.logo_url)||'/assets/reference-demo/reference-logo.png';
 const select=(key,title,options,defaultValue)=>`<label class="field"><span>${title}</span><select name="${key}">${options.map(([value,label])=>`<option value="${value}" ${(ss[key]||defaultValue)===value?'selected':''}>${label}</option>`).join('')}</select></label>`;
 return `<div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'एका गावाचे ब्रँडिंग','VILLAGE BRANDING')}</p><h1>${tr(lang,'नेव्हबारमधील लोगो','Navbar logo')}</h1><p>${tr(lang,'हे बदल या गावाच्या प्रत्येक पानाच्या वरच्या पट्टीवर लागू होतील. इतर गावांवर नाहीत.','Configure the header logo across every page of this village, without affecting other villages.')}</p></div><a class="button-lite" href="/admin/villages/${esc(v.id)}/footer">${tr(lang,'तळाचे लोगो आणि फूटर','Footer & bottom logos')} →</a></div>
 <form id="navbarBrandingForm" data-id="${esc(v.id)}">
 <section class="admin-panel form-panel"><div class="panel-heading"><div><h2>1. ${tr(lang,'वरचा लोगो बदला','Choose header logo')}</h2><p>${tr(lang,'प्रतिमा थेट अपलोड करा किंवा HTTPS URL द्या. जागा रिकामी ठेवल्यास गावाचा मुख्य लोगो वापरला जाईल.','Upload an image or paste an HTTPS URL. Clear this field to use the village main logo.')}</p></div></div>
 <div class="admin-v43-logo-example admin-v47-logo-preview"><img src="${esc(shown)}" data-fallback="${esc(imageURL(v.logo_url)||'/assets/reference-demo/reference-logo.png')}" alt="Current village header logo" loading="lazy"><div><strong>${tr(lang,'सध्याचा वरचा लोगो','Current header logo')}</strong><p>${tr(lang,'बदल जतन करण्यापूर्वी येथे पाहा.','See your image before you save.')}</p><button class="button-lite" type="button" data-action="nav-logo-reset">${tr(lang,'गावाचा मूळ लोगो वापरा','Use village main logo')}</button></div></div>
 <div class="form-grid">${field('nav_logo_url',tr(lang,'वरच्या लोगोची लिंक (पर्यायी)','Header logo URL (optional)'),ss.nav_logo_url||'',{type:'url',wide:true})}</div>
 <label class="upload-box">${icon('image')} ${tr(lang,'नेव्हबार लोगो अपलोड करा','Upload navbar logo')}<input type="file" data-image-input data-target="nav_logo_url" data-village="${esc(v.id)}" accept="image/png,image/jpeg,image/webp"></label>
 <small>${tr(lang,'PNG किंवा WebP मध्ये पारदर्शक पार्श्वभूमी अधिक चांगली दिसते. अपलोडनंतर सेव्ह करा.','Transparent PNG/WebP looks best. Save after uploading.')}</small></section>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>2. ${tr(lang,'लोगोचे माप व आकार','Logo appearance')}</h2></div><div class="form-grid">
 ${select('nav_logo_size',tr(lang,'डेस्कटॉप लोगो आकार','Desktop logo size'),[['40','Small · 40px'],['52','Compact · 52px'],['64','Medium · 64px'],['72','Standard · 72px'],['84','Large · 84px']],'72')}
 ${select('nav_logo_mobile_size',tr(lang,'मोबाईल लोगो आकार','Mobile logo size'),[['36','36 px'],['40','40 px'],['44','44 px'],['48','48 px'],['52','52 px'],['56','56 px'],['64','64 px']],'48')}
 ${select('nav_logo_fit',tr(lang,'प्रतिमा कशी बसेल','Image fit'),[['contain','Fit entire logo (no cropping)'],['cover','Fill frame (may crop edges)']],'contain')}
 ${select('nav_logo_shape',tr(lang,'लोगोचा आकार','Logo shape'),[['rounded','Rounded'],['square','Square'],['circle','Circle']],'rounded')}
 ${select('nav_logo_position',tr(lang,'लोगो प्रतिमा स्थान','Image position'),[['center','Center'],['left','Left'],['right','Right']],'center')}
 </div><p class="small-muted">${tr(lang,'लोगो दोन्ही पडद्यांवर योग्य आकारात बसेल; निवडलेले माप मर्यादित आहे.','The image stays proportional on desktop and mobile, using the selected safe sizes.')}</p></section>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>3. ${tr(lang,'ग्रामपंचायतीचे नाव व उपशीर्षक','Village name & subtitle')}</h2><p>${tr(lang,'वरच्या पट्टीतील दोन ओळी. रिकामे ठेवल्यास गावाची मूळ माहिती दिसेल.','The two lines next to the logo. Blank fields use the village information automatically.')}</p></div><div class="form-grid">${field('brand_title_mr',tr(lang,'नाव — मराठी','Title — Marathi'),ss.brand_title_mr||'')}${field('brand_title_en',tr(lang,'नाव — इंग्रजी','Title — English'),ss.brand_title_en||'')}${field('brand_subtitle_mr',tr(lang,'पत्ता ओळ — मराठी','Subtitle — Marathi'),ss.brand_subtitle_mr||'')}${field('brand_subtitle_en',tr(lang,'पत्ता ओळ — इंग्रजी','Subtitle — English'),ss.brand_subtitle_en||'')}</div></section>
 <div class="settings-actions"><button class="btn btn-dark" type="submit" data-save-mode="draft">${tr(lang,'मसुदा जतन करा','Save draft')}</button><button class="button-lite" type="submit" data-save-mode="publish">${tr(lang,'नेव्हबार लोगो प्रकाशित करा','Publish navbar logo')}</button><span class="admin-save-hint" hidden>${tr(lang,'सेव्ह न केलेले बदल','Unsaved changes')}</span></div></form>${previewPanel(v,lang)}`;
}
function footerLogoRow(v,lang,index,url,visible){
 return `<div class="admin-footer-logo-row" data-logo-row ${visible?'':'hidden'}><span class="admin-logo-number">${index+1}</span><div class="admin-footer-logo-thumb-wrap"><img class="admin-footer-logo-thumb" alt="${tr(lang,'अपलोड केलेला लोगो','Uploaded logo')}" src="${esc(imageURL(url)||'/assets/mark.svg')}" ${imageURL(url)?'':'hidden'} loading="lazy"><span class="admin-footer-logo-placeholder" ${imageURL(url)?'hidden':''}>${tr(lang,'लोगो निवडा','Choose a logo')}</span></div><div class="admin-footer-logo-fields">${field(`footer_logo_${index}`,tr(lang,'लोगो URL','Logo image URL'),url,{type:'url'})}<label class="upload-box">${icon('image')} ${tr(lang,'फोटो निवडा','Upload logo')}<input type="file" data-image-input data-target="footer_logo_${index}" data-footer-logo="true" data-village="${esc(v.id)}" accept="image/png,image/jpeg,image/webp"></label></div><div class="admin-footer-logo-actions"><button class="button-lite" type="button" data-action="footer-logo-up" aria-label="Move logo up">↑</button><button class="button-lite" type="button" data-action="footer-logo-down" aria-label="Move logo down">↓</button><button class="button-lite" type="button" data-action="footer-logo-remove" aria-label="Remove logo">${tr(lang,'काढा','Remove')}</button></div></div>`;
}
function footerEditor(v,lang){
 const ss=v.site_settings||{};
 const saved=Array.isArray(ss.footer_logos)?ss.footer_logos.filter(x=>typeof x==='string'&&imageURL(x)).slice(0,12):(ss.footer_logo_url?[ss.footer_logo_url]:[]);


 return `<div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'संपूर्ण वेबसाइट / तळाचे लोगो','WHOLE WEBSITE / FOOTER')}</p><h1>${tr(lang,'तळाचे लोगो आणि फूटर','Bottom logos & footer')}</h1><p>${tr(lang,'येथील लोगो प्रत्येक सार्वजनिक पानावर फूटरच्या वर दिसतात. येथे १२ वेगवेगळे लोगो जोडू शकता.','These logos appear above the footer on every village page. Add up to 12 separate images.')}</p></div></div>
 <div class="admin-blue-note"><strong>${tr(lang,'एका गावाचे लोगो — त्या गावाच्या सर्व पानांवर','One village, all its pages')}</strong><p>${tr(lang,'येथील १२ लोगो, समाजमाध्यमे आणि तळाचा मजकूर फक्त या गावाच्या प्रत्येक पानावर दिसेल. दुसऱ्या गावावर याचा परिणाम होणार नाही.','These 12 logos, social links and footer text appear on every page of this village only. Other villages stay unchanged.')}</p></div><form id="footerForm" data-id="${esc(v.id)}"><section class="admin-panel form-panel"><div class="panel-heading"><div><h2>1. ${tr(lang,'फूटरच्या वरचे लोगो (१२ पर्यंत)','Page-bottom logos (up to 12)')}</h2><p>${tr(lang,'लोगो प्रमाणात बसतील, ताणले जाणार नाहीत. लोगो अपलोड केल्यानंतर Save करा.','Logos keep their proportions and will never be stretched. Save after uploading.')}</p></div><span class="admin-logo-count">${saved.length} / 12</span></div><div id="footerLogoList" class="admin-footer-logo-list">${Array.from({length:12},(_,i)=>footerLogoRow(v,lang,i,saved[i]||'',i<Math.max(saved.length,1))).join('')}</div><div class="upload-row"><button type="button" class="button-lite" data-action="footer-logo-add">${icon('plus')} ${tr(lang,'आणखी एक लोगो जोडा','Add another logo')}</button><small>${tr(lang,'वर-खाली बटणांनी क्रम बदला; काढा बटणाने हटवा.','Use arrows to reorder, or Remove to delete a logo.')}</small></div></section>
 <section class="admin-panel form-panel"><div class="panel-heading"><div><h2>2. ${tr(lang,'संपर्क व सोशल लिंक','Social & useful links')}</h2><p>${tr(lang,'प्रत्येक वेबसाइट पानावरील फूटरमध्ये दिसतील.','Shown in the footer of all pages.')}</p></div></div><div class="form-grid">${['facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url'].map(k=>field(k,k.replace('_url','').replace(/^./,x=>x.toUpperCase())+' URL',ss[k]||'',{type:'url'})).join('')}${['links_mr','links_en'].map(k=>field(k,k==='links_mr'?'Useful links — Marathi (name | https://...)':'Useful links — English (name | https://...)',ss[k]||'',{textarea:true,rows:4,wide:true})).join('')}${field('office_hours_mr','कार्यालयाची वेळ — मराठी',ss.office_hours_mr||'')}${field('office_hours_en','Office hours — English',ss.office_hours_en||'')}</div></section>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>3. ${tr(lang,'फूटर मजकूर','Footer headings & links')}</h2></div>${editGroup(v,lang,tr(lang,'इतर फूटर शीर्षके बदला','Edit optional footer labels'),'FOOTER /')}</section>
 <section class="admin-panel admin-legal-fixed"><div class="panel-heading"><h2>${tr(lang,'कायमस्वरूपी कॉपीराइट','Fixed company copyright')}</h2></div><p>${esc(platformLegalNotice())}</p><small>${tr(lang,'हा मजकूर सर्व गावांच्या सर्व पानांवर सारखाच आहे. ॲडमिनमधून बदलता येत नाही.','This line is identical on every village page and cannot be edited from the admin.')}</small></section>
 <div class="settings-actions"><button type="submit" data-save-mode="draft" class="btn btn-dark">${icon('check')} ${tr(lang,'फूटर मसुदा जतन करा','Save footer draft')}</button><button type="submit" data-save-mode="publish" class="button-lite">${tr(lang,'बदल प्रकाशित करा','Publish footer changes')}</button><span class="admin-save-hint" hidden>${tr(lang,'सेव्ह न केलेले बदल','Unsaved changes')}</span></div></form>${previewPanel(v,lang)}`;
}

function aboutEditor(v,lang){
 const ss=v.site_settings||{};
 const f=extraSiteGroups.find(([title])=>title.startsWith('ABOUT PAGE'))?.[1]||[];
 const groups=[['about_facts','All Information: editable Gram Panchayat facts / population box'],['officials','Editable office bearers and staff profile cards'],['committee_groups','Editable committee section headings'],['committees','Editable member rows inside each committee table'],['about_facilities','Editable village facility/statistics boxes'],['duties','Add optional responsibilities; the eight standard cards cannot be edited or deleted'],['about_blocks','Add/edit/reorder headings, text, lists, images, tiles or tables in any tab'],['about_sections','Additional plain-text About sections']];
 return `<div class="admin-page-top"><div><p class="eyebrow">ABOUT PAGE / SHAMVADI REFERENCE</p><h1>${tr(lang,'ग्रामपंचायतीबद्दल पान','About Gram Panchayat')}</h1><p>${tr(lang,'वेबसाईटचे सहा टॅब व माहिती याच गावासाठी संपादित करा.','Manage all six About-page tabs for this village. Each village keeps its own records.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/about?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'प्रिव्ह्यू पहा','Preview')} ↗</a></div>
 <div class="admin-blue-note"><strong>${tr(lang,'संदर्भातील माहिती कायम ठेवली आहे','Reference text stays unchanged')}</strong><p>${tr(lang,'दृष्टिकोन, मूलभूत मूल्ये आणि आठ जबाबदारी कार्ड्स ही मूळ माहिती सर्व गावांमध्ये आपोआप दिसते. येथे फक्त अधिक माहिती जोडा; मूळ मजकूर काढता किंवा बदलता येत नाही. गावाची लोकसंख्या व इतर तथ्ये स्वतंत्रपणे भरा.','The original mission, values, and eight responsibility cards automatically appear on every village. Add extra details here without replacing the fixed text. Village-specific population and facts must be entered separately.')}</p></div>
 <details class="admin-panel admin-v44-static-reference"><summary><strong>${tr(lang,'स्थिर मजकूर पहा (बदलता येत नाही)','View built-in template text (read-only)')}</strong><small>${tr(lang,'८ भूमिका, ध्येय व मूल्ये','8 duties, mission and values')}</small></summary><div class="admin-v44-static-list"><h3>दृष्टिकोन व ध्येय</h3><ul>${FIXED_MISSION_MR.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>मूलभूत मूल्ये</h3><ul>${FIXED_VALUES_MR.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>भूमिका व जबाबदाऱ्या</h3><div class="admin-v44-static-roles">${FIXED_DUTIES.map(x=>`<span>${esc(x.title_mr)}</span>`).join('')}</div></div></details>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'शीर्षक, सहा टॅब व अतिरिक्त मुद्दे','Heading, tabs and optional additions')}</h2></div>
 <form id="aboutSettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${f.map(([k,name,type])=>field(k,name,ss[k]||'',{textarea:type==='textarea',rows:4,wide:type==='textarea'})).join('')}</div>

 <div style="padding:18px 24px"><button class="btn btn-dark" type="submit">${tr(lang,'बदल जतन करा','Save About page settings')}</button></div></form></section>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'टॅबमधील स्वतंत्र नोंदी','Edit records inside each tab')}</h2></div>
 <div class="sv-about-admin-links">${groups.map(([kind,desc])=>`<a class="button-lite" href="/admin/villages/${esc(v.id)}/content/${kind}"><strong>${esc(label(lang,kind))}</strong><small>${esc(desc)}</small> →</a>`).join('')}</div></section>`;
}
function servicesEditor(v,lang){
 const ss=v.site_settings||{};
 const f=extraSiteGroups.find(([name])=>name.startsWith('LOKSEVA'))?.[1]||[];
 const records=[['services','Services and required documents'],['service_steps','Application steps (ordered)'],['service_forms','PDF forms and downloads'],['service_links','Official citizen service links (separate tab; never shown in All)']];
 const reference=[['services',referenceServices],['service_steps',referenceSteps],['service_forms',referenceForms],['service_links',referenceLinks]];
 return `<div class="admin-page-top"><div><p class="eyebrow">LOKSEVA / VILLAGE WEBSITE</p><h1>${tr(lang,'लोकसेवा पान','Citizen Services')}</h1><p>${tr(lang,'सेवा, कागदपत्रे, शुल्क, अर्ज प्रक्रिया आणि PDF अर्ज ॲडमिनमधून संपादित करा.','Edit service titles, documents, fees, application steps and downloadable PDFs independently.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/services?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div>
 <div class="admin-blue-note"><strong>${tr(lang,'सर्व गावांसाठी उपलब्ध नमुना लोकसेवा','Built-in Lokseva reference layout')}</strong><p>${tr(lang,'सेवा कार्ड, अर्ज प्रक्रिया, तीन PDF अर्ज आणि नागरिक सेवा लिंक प्रत्येक नवीन गावात नमुन्यानुसार दिसतात. गावाचा स्वतःचा बदल प्रकाशित करायचा असल्यास संबंधित प्रकारातील नोंद समान स्लगने जोडा; वेगळ्या स्लगने नवीन नोंद जोडा. QR कोड मात्र केवळ याच गावासाठी जतन केला जातो.','Default service cards, steps, three PDF forms, and citizen links appear in every new village. Publish a record with the same slug to override that template entry, or with a new slug to append a card. Tax QR code is per village only.')}</p></div>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'पानाचे शीर्षक व टॅब','Page title and tab headings')}</h2></div>
 <form id="serviceSettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${f.map(([key,label,type])=>field(key,label,ss[key]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div>
 <div class="upload-row"><label class="upload-box">${icon('image')} ${tr(lang,'या गावाचा कर भरणा QR फोटो अपलोड करा','Upload this village’s approved tax payment QR image')}<input type="file" data-image-input data-target="services_payment_qr_url" data-village="${esc(v.id)}" accept="image/png,image/jpeg,image/webp"></label><small>${tr(lang,'QR Code सुरक्षित राहण्यासाठी मूळ प्रत कायम ठेवा. मंजूर QR Code असल्यासच जोडा.','Keep the original QR image uncompressed. Upload only a verified QR for this village.')}</small></div>
 <div class="settings-actions"><button class="btn btn-dark" type="submit">${icon('check')} ${tr(lang,'लोकसेवा सेटिंग्ज जतन करा','Save Lokseva page settings')}</button></div></form></section>
 <details class="admin-panel admin-v45-reference-list"><summary><strong>${tr(lang,'मूळ लोकसेवा कार्ड्स — गरज असल्यास बदला','Built-in cards — optional customization')}</strong><small>${tr(lang,'मूळ माहिती न बदलता अतिरिक्त नोंदीही जोडू शकता','New villages receive these defaults; custom entries affect only this village')}</small></summary><div class="sv-about-admin-links">${reference.map(([kind,rows])=>`<div class="admin-v45-reference-category"><h3>${esc(label(lang,kind))}</h3>${rows.map(x=>`<a class="button-lite" href="/admin/villages/${esc(v.id)}/content/${kind}?template=${esc(x.slug)}">${esc(loc(x,'title',lang))} · ${tr(lang,'बदला','Customize')} →</a>`).join('')}</div>`).join('')}</div></details>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'सेवा सामग्री','Service content')}</h2></div><div class="sv-about-admin-links">${records.map(([kind,label])=>`<a class="button-lite" href="/admin/villages/${esc(v.id)}/content/${kind}"><strong>${tr(lang,kind==='services'?'लोकसेवा':kind==='service_steps'?'अर्ज प्रक्रिया':kind==='service_links'?'नागरिक सेवा लिंक':'अर्ज नमुना',label)}</strong> →</a>`).join('')}</div></section>`;
}
function schemesEditor(v,lang){
 const ss=v.site_settings||{};
 const fields=extraSiteGroups.find(([name])=>name.startsWith('GOVERNMENT SCHEMES'))?.[1]||[];
 return `<div class="admin-page-top"><div><p class="eyebrow">GOVERNMENT SCHEMES / VILLAGE</p><h1>${tr(lang,'शासकीय योजना','Government Schemes')}</h1><p>${tr(lang,'वेबसाइटचे शीर्षक, टॅब, योजना आणि तपशील संपादित करा.','Edit the Yojana title, scheme tabs, beneficiary-list subpage, cards and content.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/schemes?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div>
 <div class="admin-blue-note">The five screenshot-based schemes are built into every new village preview, without copying rows into Supabase. Only a matching published village record replaces a default card. Draft edits remain private; confirm current eligibility and amounts with the responsible office.</div>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'पानाचे शीर्षक व टॅब','Page title, subtitle, tab labels and section headings')}</h2></div><form id="schemeSettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${fields.map(([k,title,type])=>field(k,title,ss[k]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'योजना पान सेव्ह करा','Save scheme page settings')}</button></div></form></section>
 <details class="admin-panel admin-v45-reference-list"><summary><strong>${tr(lang,'नमुना योजना — गरज असल्यास बदला','Five built-in schemes — optional customization')}</strong><small>${tr(lang,'तुमच्या गावासाठी स्वतंत्रपणे बदल करा; इतर गावांचे नमुने बदलणार नाहीत','Changes apply only to the selected village')}</small></summary><div class="sv-about-admin-links">${referenceSchemes.map(x=>`<a class="button-lite" href="/admin/villages/${esc(v.id)}/content/schemes?template=${esc(x.slug)}">${esc(loc(x,'title',lang))} · ${tr(lang,'बदला','Customize')} →</a>`).join('')}</div></details>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'लाभार्थी यादी — पानाचे शीर्षक','Beneficiary Lists — headings inside Yojana')}</h2></div><form id="beneficiarySettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${(extraSiteGroups.find(([name])=>name.startsWith('BENEFICIARY LISTS'))?.[1]||[]).map(([k,title])=>field(k,title,ss[k]||'')).join('')}</div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'लाभार्थी पान सेव्ह करा','Save beneficiary headings')}</button></div></form></section>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'योजनांचे संपादन','Scheme cards and details')}</h2></div><div class="sv-about-admin-links"><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/schemes"><strong>${tr(lang,'योजना जोडा, संपादित करा, प्रकाशित करा','Add, edit, publish government schemes')}</strong><small>${tr(lang,'वैयक्तिक/सार्वजनिक प्रकार, मराठी/इंग्रजी माहिती, पात्रता, लाभ, कागदपत्रे आणि प्रक्रिया','Choose individual/public category, edit titles, overview, eligibility, benefits, required documents, steps and official link.')}</small> →</a><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/beneficiary_lists"><strong>${tr(lang,'योजनांमधील लाभार्थी यादी — Excel जोडा','Yojana → Beneficiary Lists — Upload Excel')}</strong><small>${tr(lang,'लाभार्थी यादी ही आता योजना पानाचा भाग आहे. येथे नवीन Excel याद्या जोडा, तपासा आणि प्रकाशित करा.','Beneficiary lists now open within the Yojana page. Add, review and publish Excel lists here.')}</small> →</a></div></section></div>`;
}
function newsEditor(v,lang){const ss=v.site_settings||{};const fields=extraSiteGroups.find(([name])=>name.startsWith('NEWS PAGE'))?.[1]||[];
 return `<div class="admin-page-top"><div><p class="eyebrow">NEWS / VILLAGE</p><h1>${tr(lang,'बातम्या व मार्गदर्शक लेख','News & Guidance Articles')}</h1><p>${tr(lang,'बातम्या, लेखक, तारीख, फोटो आणि संपूर्ण लेख संपादित करा.','Edit article titles, authors, dates, images and full article text.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/news?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div>
 <div class="admin-blue-note">News use the same layout in the demo and real village; only this village’s published stories are displayed.</div>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'पानाचे शीर्षक आणि मजकूर','Page headings and labels')}</h2></div><form id="newsSettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${fields.map(([k,title,type])=>field(k,title,ss[k]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'बातम्या पान जतन करा','Save news page')}</button></div></form></section>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'बातम्या आणि लेख','News stories and full articles')}</h2></div><div class="sv-about-admin-links"><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/news"><strong>${tr(lang,'बातमी जोडा / संपादित करा','Add / edit news articles')}</strong><small>${tr(lang,'फोटो, लेखक, तारीख, बातमीची सुरुवात आणि संपूर्ण बातमी लिहा.','Upload a photo, enter the author and date and write the complete bilingual article.')}</small> →</a></div></section></div>`;
}
function contactEditor(v,lang){
 const ss=v.site_settings||{};
 const fields=extraSiteGroups.find(([name])=>name.startsWith('CONTACT PAGE'))?.[1]||[];
 const labels=fields.filter(([k])=>k!=='contact_map_url'&&k!=='contact_map_embed_url');
 const map=ss.contact_map_embed_url||'';const directions=ss.contact_map_url||'';
 return `<div class="admin-page-top"><div><p class="eyebrow">CONTACT / ${tr(lang,'संपर्क','CONTACT')}</p><h1>${tr(lang,'संपर्क आणि Google Maps','Contact & Google Maps')}</h1><p>${tr(lang,'पत्ता व नकाशा प्रत्येक गावासाठी वेगळा असतो. हेच तपशील संपर्क पान आणि फूटरमध्ये दिसतील.','Address and map belong to this village only. The contact page and footer use the village details.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/contact?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'पान पहा','Preview page')} ↗</a></div>
 <section class="admin-panel gx6-page-tools"><h2>${tr(lang,'नागरिक अर्ज','Citizen forms')}</h2><div class="gx6-edit-links"><a href="/admin/villages/${esc(v.id)}/submissions"><span>${tr(lang,'आलेले फॉर्म','Received forms')}</span><strong>${tr(lang,'पहा','Open')} →</strong></a><a href="/v/${esc(v.slug)}/contact?preview=1&contactTab=form" target="_blank" rel="noopener noreferrer"><span>${tr(lang,'नागरिक फॉर्म','Citizen form')}</span><strong>${tr(lang,'पूर्वावलोकन','Preview')} ↗</strong></a></div></section><section class="admin-panel admin-v49-contact-summary"><h2>1. ${tr(lang,'कार्यालयाचा पत्ता','Office address & contact')}</h2><p>${esc(loc(v,'address',lang)||tr(lang,'पत्ता अद्याप भरलेला नाही.','Address not entered.'))}</p><p>${esc(v.phone||'')} · ${esc(v.email||'')}</p><a class="button-lite" href="/admin/villages/${esc(v.id)}">${tr(lang,'पत्ता / फोन / ईमेल बदला','Edit address, phone & email')} →</a></section>
 <form id="contactSettingsForm" data-id="${esc(v.id)}"><section class="admin-panel form-panel"><h2>2. ${tr(lang,'Google Maps ठिकाण','Google Maps location')}</h2><p>${tr(lang,'गावाच्या कार्यालयाचा Google Maps शेअर लिंक द्या. नकाशा पूर्वावलोकनासाठी Embed लिंक ऐच्छिक आहे.','Paste the Google Maps share link for this village office. A Maps Embed link is optional.')}</p><div class="form-grid">
 ${field('contact_map_url',tr(lang,'Google Maps शेअर लिंक','Google Maps share / directions link'),directions,{type:'url',wide:true,placeholder:'https://maps.app.goo.gl/... or https://www.google.com/maps/...'})}
 ${field('contact_map_embed_url',tr(lang,'नकाशा एम्बेड लिंक (पर्यायी)','Google Maps embed URL (optional)'),map,{type:'url',wide:true,placeholder:'https://www.google.com/maps/embed?pb=...'})}
 </div><div class="admin-v49-map-preview"><strong>${tr(lang,'सध्याचा नकाशा','Map preview')}</strong>${map&&/^https:\/\/(www\.google\.com|maps\.google\.com)\/maps\/embed/i.test(map)?`<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Village map preview" src="${esc(map)}"></iframe>`:`<p>${tr(lang,'एम्बेड लिंक जोडल्यास येथे नकाशा दिसेल. पत्ता सार्वजनिक संपर्क पानावर दिसेल.','Embed a Google Maps URL to see it here. The address also appears on the public Contact page.')}</p>`}</div>
 </section><details class="admin-panel admin-v49-advanced"><summary><strong>3. ${tr(lang,'प्रगत मजकूर बदल','Advanced contact-page text')}</strong><small>${tr(lang,'शीर्षके व टॅबची नावे बदलण्याची गरज असेल तेव्हाच उघडा','Open only when changing headings or tab labels')}</small></summary><div class="form-grid">${labels.map(([k,title,type])=>field(k,title,ss[k]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div></details><div class="settings-actions"><button class="btn btn-dark" type="submit">${tr(lang,'या गावाचे संपर्क सेटिंग्ज जतन करा','Save this village’s Contact page')}</button></div></form>`;
}
function galleryEditor(v,lang){const ss=v.site_settings||{};const fields=extraSiteGroups.find(([name])=>name.startsWith('GALLERY PAGE'))?.[1]||[];
 return `<div class="admin-page-top"><div><p class="eyebrow">PHOTO / VIDEO GALLERY</p><h1>${tr(lang,'फोटो - व्हिडिओ गॅलरी आणि मीडिया','Photos, Videos & Media')}</h1><p>${tr(lang,'गॅलरीतील फोटो, प्रकार, नाव आणि व्हिडिओ संपादित करा.','Edit gallery titles, captions, categories, pictures and video links.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/gallery?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div>
 <div class="admin-blue-note">Choose a gallery category on each photo. For videos, upload a thumbnail and paste a verified HTTPS link; links open externally. Images are optimized before upload.</div>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'पानाचे शीर्षक आणि टॅब','Page title and all seven tabs')}</h2></div><form id="gallerySettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${fields.map(([k,title,type])=>field(k,title,ss[k]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'गॅलरी पान जतन करा','Save gallery page')}</button></div></form></section>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'फोटो आणि व्हिडिओ व्यवस्थापन','Media library')}</h2></div><div class="sv-about-admin-links"><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/gallery"><strong>${tr(lang,'फोटो / पेपर कात्रणे जोडा','Add photographs / clippings')}</strong> →</a><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/videos"><strong>${tr(lang,'व्हिडिओ जोडा','Add videos / thumbnails')}</strong> →</a></div></section></div>`;
}
function noticesEditor(v,lang){
 const ss=v.site_settings||{};
 const fields=extraSiteGroups.find(([name])=>name.startsWith('NOTICE BOARD PAGE'))?.[1]||[];
 return `<div class="admin-page-top"><div><p class="eyebrow">NOTICE BOARD / VILLAGE</p><h1>${tr(lang,'नोटीस बोर्ड','Notice Board')}</h1><p>${tr(lang,'सूचना, अहवाल, माहिती अधिकार, शासन निर्णय आणि PDF दस्तऐवज संपादित करा.','Edit notices, financial reports, RTI documents, resolutions, dates and PDFs.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/notices?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div>
 <div class="admin-blue-note">The demo and village Notice Board use the same design. Use the records editor for all four tabs. Drafts stay private; PDF files are public after uploading, so never upload personal or confidential documents.</div>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'पानाचे शीर्षक, टॅब व विभाग','Page title, tab labels and section headings')}</h2></div>
 <form id="noticeSettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${fields.map(([key,label,type])=>field(key,label,ss[key]||'',{textarea:type==='textarea',rows:3,wide:type==='textarea'})).join('')}</div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'नोटीस बोर्ड सेटिंग्ज जतन करा','Save Notice Board settings')}</button></div></form></section>
 <details class="admin-panel admin-v45-reference-list"><summary><strong>${tr(lang,'RTI नमुना शीर्षके — PDF जोडा','RTI reference titles — attach matching PDFs')}</strong><small>${tr(lang,'अचूक दस्तऐवज दिल्यावरच डाउनलोड बटण कार्यान्वित होईल','Download buttons activate only for genuine uploaded PDFs')}</small></summary><div class="sv-about-admin-links">${referenceRTI.filter(x=>x.details.notice_type==='rti').map(x=>`<a class="button-lite" href="/admin/villages/${esc(v.id)}/content/notices?template=${esc(x.slug)}">${esc(loc(x,'title',lang))} · ${tr(lang,'PDF जोडा','Attach PDF')} →</a>`).join('')}</div></details>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'दस्तऐवज व नोटीस नोंदी','Notice and PDF records')}</h2></div>
 <div class="sv-about-admin-links"><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/notices"><strong>${tr(lang,'नवीन नोटीस / PDF जोडा','Add / edit notice or PDF')}</strong><small>${tr(lang,'विभाग निवडा, शीर्षक व तारीख बदला, PDF अपलोड करा आणि प्रकाशित करा.','Choose one of four tabs, enter bilingual titles, date, upload PDF and publish.')}</small> →</a></div></section></div>`;
}
function projectsEditor(v,lang){
 const ss=v.site_settings||{};
 const fields=extraSiteGroups.find(([name])=>name.startsWith('DEVELOPMENT PROJECTS'))?.[1]||[];
 return `<div class="admin-page-top"><div><p class="eyebrow">DEVELOPMENT PROJECTS / VILLAGE</p><h1>${tr(lang,'विकास कामे व प्रकल्प','Development Projects')}</h1><p>${tr(lang,'शीर्षक, टॅब, मजकूर आणि प्रकल्पांची स्थिती संपादित करा.','Edit every page heading, tab, description and project status.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/projects?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div>
 <section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'पानातील सर्व मजकूर','Page text and section headings')}</h2></div>
 <form id="projectSettingsForm" data-id="${esc(v.id)}"><div class="form-grid">${fields.map(([k,title])=>field(k,title,ss[k]||'',{textarea:k.includes('intro')||k.includes('empty'),rows:3,wide:k.includes('intro')})).join('')}</div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'बदल जतन करा','Save project page')}</button></div></form></section>
 <section class="admin-panel"><div class="panel-heading"><h2>${tr(lang,'फोटो व प्रकल्पांची नोंद','Project records and photos')}</h2></div><div class="sv-about-admin-links"><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/projects"><strong>${tr(lang,'प्रकल्प जोडा / संपादित करा','Add / edit projects')}</strong><small>${tr(lang,'फोटो, नाव, योजना, वर्ष, स्थान आणि स्थिती निवडा.','Upload an image, edit project information and choose Ongoing / Completed / Upcoming.')}</small> →</a></div></section></div>`;
}
async function contentEditor(v,items,kind,lang){
 const params=new URLSearchParams(location.search),trash=params.get('trash')==='1';
 const allEntries=trash?await call(api.from('content_items').select('*').eq('village_id',v.id).eq('kind',kind).not('deleted_at','is',null).order('deleted_at',{ascending:false})):items.filter(i=>i.kind===kind);
 const category=categoryFor(kind,params),categoryConfig=recordCategories[kind];
 const pageFilter=kind==='page_elements'&&PAGE_TARGETS.includes(params.get('from'))?params.get('from'):'';
 const inCategory=i=>(!category||String(i.details?.[categoryConfig[0]]||categoryConfig[1])===category)&&(!pageFilter||i.details?.page_target===pageFilter);
 const entries=allEntries.filter(inCategory);
 const editId=params.get('edit');const selected=allEntries.find(x=>x.id===editId)||(!trash&&params.get('template')?allEntries.find(x=>x.slug===params.get('template')):null);
 const templates={services:referenceServices,service_steps:referenceSteps,service_forms:referenceForms,service_links:referenceLinks,schemes:referenceSchemes,notices:referenceRTI,leaders:referenceLeaderCards,officials:officialSlots,banners:slideSlots,gallery:gallerySlots}[kind]||[];
 const reference=selected?null:templates.find(t=>t.slug===params.get('template'));
 const x=selected||(reference?{...reference,external_url:['service_forms','notices'].includes(kind)?'':reference.external_url,...(kind==='leaders'?{image_url:''}:{})}:category?{details:{[categoryConfig[0]]:category}}:{});
 const input=(name)=>x[name]??'';const shownPhoto=imageURL(input('image_url'))||reference?.sample_image||reference?.image_url||(['leaders','officials'].includes(kind)?'/assets/placeholders/portrait.svg':'/assets/placeholders/photo.svg');
 const base=`/admin/villages/${esc(v.id)}/content/${kind}`;
 const editing=!trash&&Boolean(selected||reference||params.get('new')==='1'||params.has('page'));
 const mediaKind=['leaders','officials','banners','gallery'].includes(kind);const matching=templates.filter(inCategory);const defaults=trash?[]:mediaKind?(kind==='officials'&&!category?['representatives','staff'].flatMap(group=>missingMediaSlots(matching.filter(x=>x.details?.about_group===group),entries.filter(x=>(x.details?.about_group||'representatives')===group))):missingMediaSlots(matching,entries)):matching.filter(t=>!allEntries.some(e=>e.slug===t.slug));
 const categoryTitle=category?categoryConfig[2].find(([key])=>key===category):null;
 const heading=categoryTitle?tr(lang,categoryTitle[1],categoryTitle[2]):label(lang,kind);
 return `<div class="admin-page-top"><div><p class="eyebrow">CONTENT / ${kind.toUpperCase()}</p><h1>${esc(heading)}</h1><p>${tr(lang,'येथील प्रत्येक फोटो, नाव, तारीख, योजनेची माहिती आणि मजकूर ग्रामपंचायत संकेतस्थळावर दिसतो. मसुदे सार्वजनिक नसतात.','Choose Edit to change an item, or Add new to create one.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}/${kind.startsWith('service')||kind==='services'?'services':kind==='projects'?'projects':kind==='schemes'?'schemes':kind==='beneficiary_lists'?'beneficiaries':kind==='notices'?'notices':kind==='news'?'news':kind==='gallery'||kind==='videos'?'gallery':['banners','metrics','leaders','facilities'].includes(kind)?'':'about'}?preview=1" target="_blank" rel="noopener noreferrer">Preview ↗</a></div><div class="gx6-list-top"><a class="button-lite" href="${base}">← ${tr(lang,'नोंदी','All records')}</a>${!trash&&!editing?`<a class="btn btn-dark" href="${base}?new=1">+ ${tr(lang,'नवीन जोडा','Add new')}</a>`:''}</div><div class="content-grid gx6-content-grid ${trash?'gx-archive-view':''} ${editing?'gx6-editing':'gx6-listing'}"><section class="admin-panel gx6-record-list"><div class="panel-heading"><h2>${tr(lang,'सामग्री यादी','Content library')}</h2><span>${entries.length} ${tr(lang,'नोंदी','items')}</span>${csvControls(v,kind,lang,trash)}</div>${entries.length?`<div class="content-list">${entries.map(i=>`<div class="content-list-row"><div><strong>${esc(loc(i,'title',lang))}</strong><small>${formatDate(i.updated_at,lang)}</small></div><div class="content-row-actions">${itemControls(v,i,kind,lang,trash)}</div></div>`).join('')}</div>`:defaults.length?'':`<div class="empty-data">${tr(lang,'नोंदी नाहीत. नवीन नोंद जोडा.','No records yet. Select Add new.')}</div>`}${defaults.length?`<div class="gx6-template-list"><h3>${tr(lang,'मूळ नमुने','Built-in items')}</h3>${defaults.map(t=>`<div class="content-list-row"><div>${mediaKind?`<img src="${esc(t.sample_image||t.image_url||'/assets/placeholders/photo.svg')}" alt="" width="60" height="52" style="object-fit:cover;border-radius:6px">`:''}<strong>${esc(loc(t,'title',lang))}</strong><small>${tr(lang,'मूळ नमुना','Default template')}</small></div><a class="button-lite gx6-edit-button" href="${base}?template=${encodeURIComponent(t.slug)}">${tr(lang,'संपादन','Edit')} →</a></div>`).join('')}</div>`:''}</section><section class="admin-panel form-panel gx6-record-form"><div class="panel-heading"><h2>${selected||reference?tr(lang,'सामग्री संपादित करा','Edit item'):tr(lang,'नवीन सामग्री','Add new item')}</h2><a class="button-lite" href="${base}">${tr(lang,'रद्द करा','Cancel')}</a></div><form id="contentForm" data-id="${esc(v.id)}" data-kind="${kind}" data-edit="${esc(selected?.id||'')}"><div class="stacked-form">${['about_facts','committee_groups','committees','about_facilities','about_blocks','duties','officials','facilities'].includes(kind)?`<div class="admin-blue-note">${kind==='about_facts'?'Each record is one label/value row in the About information box.':kind==='committee_groups'?'Enter the committee name. Add its members separately from About → Committee members.':kind==='committees'?'Choose the committee this person belongs to. If it is missing, create the committee first.':kind==='about_blocks'?'Add an optional text, list, image, tile, heading or table block to any About tab. Text is escaped for safety.':kind==='about_facilities'?'Each record creates one facility tile in the About tab, independently from homepage village statistics.':kind==='duties'?'Eight built-in Marathi reference cards are always shown and cannot be edited or deleted. Your new entries ADD extra duties or extra bullets to an existing role; no original text is replaced. Publish each extra entry to display it.':kind==='officials'?'Choose Office Bearers or Staff to control which About tab the person appears under.':'Each record is one numbered village facility card.'}</div>`:''}
 ${reference&&kind==='leaders'?`<div class="admin-blue-note"><strong>${tr(lang,'संदर्भ नमुना — पडताळणी आवश्यक','Reference card — verify before publishing')}</strong><p>${tr(lang,'नाव, पद आणि फोटो तपासा. फोटो वापरण्याची परवानगी असल्यासच जोडा.','Verify the name, current role and permission to use the photograph. Nothing is published automatically.')}</p><img class="gx65-reference-photo" src="${esc(reference.image_url)}" alt="${tr(lang,'संदर्भ फोटो','Reference photo')}"><button class="button-lite" type="button" data-action="gx65-use-reference-photo" data-slug="${esc(reference.slug)}">${tr(lang,'संदर्भ फोटो जोडा','Use reference photo')}</button></div>`:reference?`<div class="admin-blue-note"><strong>${tr(lang,'मूळ नमुना संपादित करत आहात','Customize a built-in template card')}</strong><p>${tr(lang,'हा बदल फक्त सध्याच्या गावासाठी लागू होईल. मूळ नमुना इतर गावांत तसाच राहील. अर्ज नमुन्यासाठी तुमचा स्वतःचा PDF जोडला नाही तर मूळ V Swaraj PDF दिसत राहील.','This will create a record for this village only. Other villages keep their default content. For Lokseva forms the original V Swaraj PDF remains unless replaced. RTI orders need their own matching PDFs; supplied reference documents keep their built-in file unless replaced.')}</p></div>`:''}
 <input type="hidden" name="slug" value="${esc(input('slug'))}">
 ${field('title_mr','Title — मराठी',input('title_mr'))}${field('title_en','Title — English',input('title_en'))}
 ${kind==='page_elements'?`<label class="field"><span>Page / पान निवडा</span><select name="page_target">${PAGE_TARGETS.map(page=>`<option value="${page}" ${(x.details?.page_target||new URLSearchParams(location.search).get('page')||pageFilter||'home')===page?'selected':''}>${page}</option>`).join('')}</select></label><label class="field"><span>Element / घटक प्रकार</span><select name="element">${ELEMENT_TYPES.map(t=>`<option value="${t}" ${(x.details?.element||'text')===t?'selected':''}>${t}</option>`).join('')}</select></label><div class="admin-blue-note">Text, headings, bullet lists, images, links and statistics are displayed after the main page section, using the same site design. Only published elements appear.</div>`:''}${field('subtitle_mr','Subtitle / role — मराठी',input('subtitle_mr'))}${field('subtitle_en','Subtitle / role — English',input('subtitle_en'))}
 ${field('body_mr','Body — मराठी',input('body_mr'),{textarea:true,rows:5})}${field('body_en','Body — English',input('body_en'),{textarea:true,rows:5})}
 ${['news','notices'].includes(kind)?`${field('event_date','Date (shown on website)',x.details?.event_date||'',{type:'date'})}`:''}
 ${kind==='notices'?`<div class="admin-blue-note">Choose where this notice appears. Enter Marathi/English titles; add an optional date and a PDF. A download button appears only after a genuine HTTPS document link is saved. PDFs in this folder are publicly accessible.</div>
  <label class="field"><span>Notice category / नोटीस प्रकार</span><select name="notice_type">${[['notice','नोटीस / सूचना'],['financial','जमा खर्च अहवाल'],['rti','माहितीचा अधिकार — RTI'],['resolutions','महत्वाचे शासन निर्णय']].map(([key,name])=>`<option value="${key}" ${(x.details?.notice_type||'notice')===key?'selected':''}>${name}</option>`).join('')}</select></label>`:''}
 ${kind==='news'?`${field('author_mr','Author — मराठी',x.details?.author_mr||'')}${field('author_en','Author — English',x.details?.author_en||'')}${field('source_title_mr','External source link label — मराठी',x.details?.source_title_mr||'')}${field('source_title_en','External source link label — English',x.details?.source_title_en||'')}${field('related_links_mr','संबंधित दुवे — एक ओळ: शीर्षक | https://...',x.details?.related_links_mr||'',{textarea:true,rows:4,wide:true})}${field('related_links_en','Related links — one per line: label | https://...',x.details?.related_links_en||'',{textarea:true,rows:4,wide:true})}`:''}
 ${kind==='gallery'?`<label class="field"><span>Gallery category / गॅलरी प्रकार</span><select name="gallery_type">${[['meetings','सभा / Meetings'],['campaigns','अभियान उपक्रम / Campaigns'],['development','विकासकामे / Development'],['cultural','सामाजिक व सांस्कृतिक कार्यक्रम / Social & cultural'],['press','पेपर कात्रणे / Newspaper clippings']].map(([val,label])=>`<option value="${val}" ${(x.details?.gallery_type||'meetings')===val?'selected':''}>${label}</option>`).join('')}</select></label><div class="admin-blue-note">Upload a photograph for this category, enter Marathi/English captions, and publish it. Newspaper clippings belong in the Press category.</div>`:''}
 ${kind==='videos'?`<div class="admin-blue-note">Paste an HTTPS video URL into the External link field. Add a thumbnail image, title and category description; the public gallery will open the video on its source site.</div>`:''}
 ${kind==='projects'?`<label class="field"><span>Project status / प्रकल्पाची स्थिती</span><select name="project_status">${[['ongoing','सुरू असलेले / Ongoing'],['completed','पूर्ण झालेले / Completed'],['upcoming','आगामी / Upcoming'],['unclassified','निवडलेली नाही / Not yet classified']].map(([value,title])=>`<option value="${value}" ${(x.details?.project_status||'unclassified')===value?'selected':''}>${title}</option>`).join('')}</select></label>${field('scheme_mr','Funding scheme — मराठी',x.details?.scheme_mr||'')}${field('scheme_en','Funding scheme — English',x.details?.scheme_en||'')}${field('project_year','Project year',x.details?.project_year||'',{type:'number'})}${field('location_mr','Project location — मराठी',x.details?.location_mr||'')}${field('location_en','Project location — English',x.details?.location_en||'')}`:''}
 ${kind==='schemes'?`<label class="field"><span>Scheme category / योजनेचा प्रकार</span><select name="scheme_type"><option value="individual" ${x.details?.scheme_type!=='public'?'selected':''}>वैयक्तिक लाभाच्या योजना / Individual Benefits</option><option value="public" ${x.details?.scheme_type==='public'?'selected':''}>सार्वजनिक विकासाच्या योजना / Public Development</option></select></label>
 <div class="admin-blue-note">The Body fields are the scheme overview. Add one bullet per line for eligibility and documents. Longer descriptions can use paragraphs. Edit both Marathi and English independently. Drafts will not appear on the public website.</div>
 ${[['eligibility','Eligibility — one item per line'],['benefits','Benefits / amount'],['documents','Required documents — one item per line'],['process','Application process / selection'],['note','Important note']].map(([key,name])=>field(key+'_mr',name+' — मराठी',x.details?.[key+'_mr']||'',{textarea:true,rows:4,wide:true})+field(key+'_en',name+' — English',x.details?.[key+'_en']||'',{textarea:true,rows:4,wide:true})).join('')}`:''}
 ${kind==='services'?`${field('required_documents_mr','Required documents — Marathi (one per line)',x.details?.required_documents_mr||'',{textarea:true})}${field('required_documents_en','Required documents — English (one per line)',x.details?.required_documents_en||'',{textarea:true})}${field('process_mr','Application process — Marathi (one step per line)',x.details?.process_mr||'',{textarea:true})}${field('process_en','Application process — English (one step per line)',x.details?.process_en||'',{textarea:true})}${field('fee_mr','Fee — Marathi',x.details?.fee_mr||'')}${field('fee_en','Fee — English',x.details?.fee_en||'')}${field('duration_mr','Time limit — Marathi',x.details?.duration_mr||'')}${field('duration_en','Time limit — English',x.details?.duration_en||'')}`:''}
 ${['metrics','facilities','about_facilities','about_facts'].includes(kind)?`${field('value',kind==='about_facts'?'Fact value (e.g. 1230)':'Value (e.g. 210 / Yes)',x.details?.value??'')}`:''}
 ${['about_facts','about_facilities'].includes(kind)?`${field('value_mr','Value — मराठी',x.details?.value_mr||'')}${field('value_en','Value — English',x.details?.value_en||'')}`:''}
 ${kind==='about_facts'?`<label class="field"><span>Information column</span><select name="group"><option value="basic" ${(x.details?.group||'basic')==='basic'?'selected':''}>Basic Information / प्राथमिक माहिती</option><option value="population" ${x.details?.group==='population'?'selected':''}>Population / लोकसंख्या</option></select></label>`:''}
  ${kind==='about_blocks'?`<label class="field"><span>Show in which About tab?</span><select name="about_tab">${[['info','सर्व माहिती / All Information'],['officials','पदाधिकारी / Office Bearers'],['staff','कर्मचारी / Staff'],['committees','समित्या / Committees'],['facilities','सुविधा / Facilities'],['duties','जबाबदाऱ्या / Roles & Duties']].map(([key,label])=>`<option value="${key}" ${x.details?.about_tab===key?'selected':''}>${label}</option>`).join('')}</select></label>
 <label class="field"><span>Element type</span><select name="element">${[['text','Text paragraphs'],['bullets','Bullet list'],['table','Table'],['tiles','Metric tiles'],['image','Image only'],['heading','Heading / divider']].map(([key,label])=>`<option value="${key}" ${x.details?.element===key?'selected':''}>${label}</option>`).join('')}</select></label>
 ${field('columns_mr','Table columns — Marathi (use | between column headings)',x.details?.columns_mr||'',{placeholder:'नाव | पदनाम | समितीतील पद'})}
 ${field('columns_en','Table columns — English (use | between headings)',x.details?.columns_en||'',{placeholder:'Name | Designation | Role'})}
 <div class="admin-blue-note">For tables, put one row on each line in Body; separate cells with |. For metric tiles use "Label | Value" per line. For lists, one bullet per line. Choose a tab and publish.</div>`:''}
 ${kind==='officials'?`<label class="field"><span>Show on About tab</span><select name="about_group"><option value="representatives" ${x.details?.about_group!=='staff'?'selected':''}>Office bearers / पदाधिकारी</option><option value="staff" ${x.details?.about_group==='staff'?'selected':''}>Staff / कर्मचारी</option></select></label>
   ${field('ward_mr','Ward / area — Marathi',x.details?.ward_mr||'')}${field('ward_en','Ward / area — English',x.details?.ward_en||'')}
   ${field('phone','Contact phone (optional)',x.details?.phone||'')}${field('elected_date','Election / joining date',x.details?.elected_date||'',{type:'date'})}`:''}
 ${kind==='committees'?`${(()=>{const current=x.details?.committee_key||'';const groups=new Map(items.filter(i=>i.kind==='committee_groups'&&i.slug).map(i=>[i.slug,loc(i,'title',lang)||i.slug]));for(const i of items.filter(i=>i.kind==='committees'&&i.details?.committee_key))if(!groups.has(i.details.committee_key))groups.set(i.details.committee_key,loc(i.details,'committee_title',lang)||i.details.committee_key);if(current&&!groups.has(current))groups.set(current,current);return `<label class="field"><span>${tr(lang,'समिती निवडा','Choose committee')}</span><select name="committee_key" required><option value="">${tr(lang,'समिती निवडा','Select a committee')}</option>${[...groups].map(([key,title])=>`<option value="${esc(key)}" ${key===current?'selected':''}>${esc(title)}</option>`).join('')}</select></label><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/committee_groups?from=about">+ ${tr(lang,'नवीन समिती तयार करा','Create a committee first')}</a>`;})()}${field('committee_title_mr','Committee heading — Marathi',x.details?.committee_title_mr||'')}${field('committee_title_en','Committee heading — English',x.details?.committee_title_en||'')}${field('committee_role_mr','Role in committee — Marathi',x.details?.committee_role_mr||'')}${field('committee_role_en','Role in committee — English',x.details?.committee_role_en||'')}`:''}
 ${kind==='duties'?`${field('icon','Role icon (emoji/symbol)',x.details?.icon||'●')}${field('accent','Card accent color (#RRGGBB)',x.details?.accent||'',{placeholder:'#bf392b'})}<small>One duty per line in the body fields above. Cards use this accent color.</small>`:''}
 ${kind==='service_links'?`<div class="admin-blue-note">The citizen links appear ONLY in the Citizen Links tab (not in View All). Add an official https:// URL below; confirm the destination with your village before publishing.</div><label class="field"><span>Link card color</span><select name="color">${[['blue','Blue'],['gray','Grey'],['yellow','Yellow'],['green','Green'],['peach','Peach'],['lavender','Lavender']].map(([key,label])=>`<option value="${key}" ${x.details?.color===key?'selected':''}>${label}</option>`).join('')}</select></label>`:''}
 ${kind==='beneficiary_lists'?`<div class="admin-blue-note"><strong>Excel beneficiary-list publication</strong><p>Excel uploads are PRIVATE. Only an approved and published list becomes downloadable. Remove Aadhaar numbers, bank details, mobile numbers, and other private personal data before making a file public.</p></div><label class="field"><span>Scheme category / योजनेचा प्रकार</span><select name="beneficiary_type"><option value="individual" ${x.details?.beneficiary_type!=='public'?'selected':''}>वैयक्तिक लाभाच्या योजना</option><option value="public" ${x.details?.beneficiary_type==='public'?'selected':''}>सार्वजनिक विकासाच्या योजना</option></select></label>${field('file_path','Uploaded Excel file path (private, automatic)',x.details?.file_path||'',{readonly:true})}<label class="upload-box">${icon('document')} Upload Excel workbook (.xlsx only, max 5 MB)<input type="file" data-excel-input data-target="file_path" data-village="${esc(v.id)}" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label><label class="field"><span><input type="checkbox" name="public_file_approved" value="true" ${x.details?.public_file_approved===true?'checked':''}> I have removed personal/sensitive information and approve public download of this Excel file.</span></label>`:''}
 ${kind==='notices'?`<label class="upload-box">${icon('document')} ${tr(lang,'नोटीससाठी PDF अपलोड करा','Upload Notice Board PDF (stored in Supabase)')}<input type="file" data-document-input data-target="external_url" data-village="${esc(v.id)}" accept="application/pdf,.pdf"></label><small>Use the External link field for an existing approved HTTPS PDF. Uploads are limited to 5 MB.</small>`:''}
 ${kind==='service_forms'?`<div class="admin-blue-note">Upload a public PDF application form, then Save this item. Keep sensitive submissions out of this public folder.</div><label class="upload-box">${icon('document')} ${tr(lang,'PDF अर्ज नमुना अपलोड करा','Upload application PDF')}<input type="file" data-document-input data-target="external_url" data-village="${esc(v.id)}" accept="application/pdf,.pdf"></label>`:''}
 ${kind==='services'?`${field('icon','Service icon (emoji or symbol)',x.details?.icon??'▤')}<div class="admin-blue-note">Attach a PDF to this service card, or enter an official HTTPS service link in the External link field. Save and publish the item to display the link.</div><label class="upload-box">${icon('document')} ${tr(lang,'या सेवेसाठी PDF अपलोड करा','Upload PDF for this service')}<input type="file" data-document-input data-target="external_url" data-village="${esc(v.id)}" accept="application/pdf,.pdf"></label>`:''}
 ${['leaders','officials','banners','gallery'].includes(kind)?`<div class="gx65-photo-preview"><img data-record-photo src="${esc(shownPhoto)}" alt="${tr(lang,'सध्याचा फोटो','Current photo')}"><span data-record-photo-empty ${imageURL(input('image_url'))?'hidden':''}>${tr(lang,'नमुना फोटो — तुमचा फोटो अपलोड करा','Sample photo — upload your own photograph')}</span></div>`:''}${field('image_url','Image URL',input('image_url'))}<label class="upload-box">${icon('image')} ${tr(lang,'फोटो अपलोड करा','Upload image')}<input type="file" data-image-input data-target="image_url" data-village="${esc(v.id)}" accept="image/png,image/jpeg,image/webp"/></label>
 ${['notices','service_forms','services'].includes(kind) && /^https:\/\//i.test(String(input('external_url')||'')) && /\.pdf(?:[?#]|$)/i.test(String(input('external_url')||'')) ? `<p class="admin-pdf-existing"><a href="${esc(input('external_url'))}" target="_blank" rel="noopener noreferrer">Open attached PDF / जोडलेला PDF पहा ↗</a></p>` : ''}
 ${field('external_url','External link (optional)',input('external_url'))}${field('sort_order','Display order',input('sort_order')??0,{type:'number'})}
 <div class="gx-save-actions" role="group" aria-label="${tr(lang,'जतन करण्याचे पर्याय','Save options')}"><button class="button-lite" type="submit" data-save-mode="draft">${icon('check')} ${tr(lang,'मसुदा जतन करा','Save draft')}</button><button class="btn btn-dark" type="submit" data-save-mode="publish">${icon('check')} ${tr(lang,'जतन करा व वेबसाइटवर दाखवा','Save and show on website')}</button></div><small>${tr(lang,'मसुदा सार्वजनिक संकेतस्थळावर दिसणार नाही.','Drafts are invisible until you publish them.')}</small></div></form></section></div>`;
}
async function membersEditor(v,lang){
 const list=await call(api.from('village_members').select('user_id,role').eq('village_id',v.id));
 return `<div class="admin-page-top"><div><p class="eyebrow">ACCESS / STAFF</p><h1>Users & permissions / वापरकर्ता परवानग्या</h1><a class="btn btn-dark" href="/admin/staff">+ Create Admin / User with email and password</a><p>Advanced: you may add an existing Supabase Auth user by their User ID. Reviewers can read complaints, but cannot edit website content.</p></div></div><section class="admin-panel"><h2>Assigned accounts</h2>${list.length?list.map(m=>`<div class="village-admin-row"><code>${esc(m.user_id)}</code> ${esc(m.role)} <button class="button-lite" data-action="remove-member" data-id="${esc(m.user_id)}">Remove</button></div>`).join(''):'No staff accounts assigned yet.'}</section><section class="admin-panel form-panel"><h2>Add staff member</h2><form id="staffAccessForm" data-id="${esc(v.id)}" class="stacked-form">${field('user_id','Supabase Auth User ID (UUID)','',{required:true})}<label class="field"><span>Permission</span><select name="staff_role"><option value="reviewer">User — view complaints only</option><option value="editor">Admin — edit village and view complaints; no users or village removal</option></select></label><button class="btn btn-dark" type="submit">Add account</button></form><p class="small-muted">Create/invite the person under Supabase Authentication → Users first. Never share their password. Only platform administrators manage staff roles.</p></section>`;
}
async function inbox(v,lang,readOnly=false){
 const params=new URLSearchParams(location.search), base=`/admin/villages/${esc(v.id)}/submissions`;
 const filter=['new','reviewed','rejected'].includes(params.get('status'))?params.get('status'):'';
 const page=Math.max(0,Math.min(10000,Number.parseInt(params.get('page')||'0',10)||0));
 const open=params.get('view');
 const title=tr(lang,'आलेले अर्ज व तक्रारी','Received forms');
 const statusLabel=k=>({new:tr(lang,'नवीन','New'),reviewed:tr(lang,'तपासले','Reviewed'),rejected:tr(lang,'नाकारले','Rejected')})[k]||k;
 const subject=k=>({general:tr(lang,'चौकशी','General enquiry'),complaint:tr(lang,'तक्रार','Complaint'),suggestion:tr(lang,'सूचना','Suggestion'),request:tr(lang,'विनंती','Request')})[k]||k||tr(lang,'संदेश','Message');
 const top=`<div class="admin-page-top"><div><h1>${title}</h1><p>${tr(lang,'नागरिकांनी पाठवलेले फॉर्म फक्त अधिकृत कर्मचाऱ्यांना दिसतात.','View forms sent by citizens. Only authorized staff can see submissions.')}</p></div><a class="button-lite" href="${base}">${tr(lang,'सर्व फॉर्म','All forms')}</a></div>`;
 if(open){
  const s=await call(api.from('submissions').select('*').eq('village_id',v.id).eq('id',open).maybeSingle());
  if(!s)return top+`<div class="admin-panel empty-data">${tr(lang,'फॉर्म सापडला नाही.','Form not found or not accessible.')}</div>`;
  return top+`<a class="button-lite" href="${base}">← ${tr(lang,'फॉर्म यादी','Back to forms')}</a><article class="admin-panel gx6-sub-detail"><div class="panel-heading"><h2>${esc(subject(s.subject))}</h2><span class="status status-${esc(s.status)}">${esc(statusLabel(s.status))}</span></div><dl><dt>${tr(lang,'नाव','Name')}</dt><dd>${esc(s.sender_name)}</dd><dt>${tr(lang,'ईमेल','Email')}</dt><dd>${esc(s.sender_email)}</dd><dt>${tr(lang,'दिनांक','Received')}</dt><dd>${esc(formatDate(s.created_at,lang))}</dd></dl><h3>${tr(lang,'संपूर्ण संदेश','Full message')}</h3><p class="gx6-full-message">${esc(s.message)}</p>${s.attachment_path?`<button class="button-lite" data-action="view-attachment" data-id="${esc(s.id)}">${icon('image')} ${tr(lang,'फोटो पहा','View private attachment')}</button>`:''}${readOnly?'':`<div class="submission-actions"><button class="btn btn-dark" data-action="submission-status" data-id="${esc(s.id)}" data-next="reviewed">${statusLabel('reviewed')}</button><button class="button-lite" data-action="submission-status" data-id="${esc(s.id)}" data-next="rejected">${statusLabel('rejected')}</button></div>`}</article>`;
 }
 let q=api.from('submissions').select('*').eq('village_id',v.id).order('created_at',{ascending:false});if(filter)q=q.eq('status',filter);
 const subs=await call(q.range(page*30,page*30+30));const visible=subs.slice(0,30);
 return top+`<section class="admin-panel gx6-inbox"><div class="gx6-inbox-tabs">${['','new','reviewed','rejected'].map(k=>`<a class="button-lite ${filter===k?'gx6-active':''}" href="${base}${k?'?status='+k:''}">${k?statusLabel(k):tr(lang,'सर्व','All')}</a>`).join('')}<button type="button" data-action="refresh-inbox" class="button-lite">↻ ${tr(lang,'ताजे करा','Refresh')}</button></div>${visible.length?visible.map(s=>`<div class="gx6-inbox-row"><div><strong>${esc(s.sender_name)}</strong><small>${esc(subject(s.subject))} · ${esc(formatDate(s.created_at,lang))}</small><p>${esc(String(s.message||'').slice(0,100))}</p></div><span class="status status-${esc(s.status)}">${esc(statusLabel(s.status))}</span><a class="btn btn-dark" href="${base}?view=${encodeURIComponent(s.id)}">${tr(lang,'फॉर्म पहा','View form')} →</a></div>`).join(''):`<div class="empty-data">${tr(lang,'या यादीत अर्ज नाहीत.','No forms in this list.')}</div>`}<div class="gx6-inbox-tabs">${page?`<a class="button-lite" href="${base}?status=${filter}&page=${page-1}">← ${tr(lang,'मागील','Previous')}</a>`:''}${subs.length>30?`<a class="button-lite" href="${base}?status=${filter}&page=${page+1}">${tr(lang,'पुढील','Next')} →</a>`:''}</div></section>`;
}

async function domainRequest(villageId,action,hostname=''){
 const session=(await api.auth.getSession()).data.session;
 if(!session?.access_token)throw new Error('Sign in again to manage domains.');
 const res=await fetch('/api/domain-admin'+(action==='list'?`?village_id=${encodeURIComponent(villageId)}`:''),{
   method:action==='list'?'GET':'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},
   body:action==='list'?undefined:JSON.stringify({village_id:villageId,action,hostname})
 });
 const result=await res.json();if(!res.ok)throw new Error(result.error||'Domain request failed');return result;
}
async function domainsEditor(v,lang){
 let info;try{info=await domainRequest(v.id,'list');}catch(e){return `<section class="admin-panel"><h1>${tr(lang,'कस्टम डोमेन','Custom domain')}</h1><p>${esc(e.message)}</p></section>`;}
 const active=info.domains?.find(d=>d.status==='active');
 const pending=info.domains?.find(d=>d.status==='pending');
 const displayed=active?.hostname||pending?.hostname||'';
 const host=esc(displayed);
 return `<div class="admin-page-top"><div><p class="eyebrow">VILLAGE DOMAIN / ${tr(lang,'गावाचा पत्ता','DOMAIN')}</p><h1>${tr(lang,'कस्टम डोमेन','Custom domain')}</h1><p>${tr(lang,'प्रत्येक गावासाठी स्वतंत्र डोमेन जोडा. डोमेन अद्याप नाही तर — — दिसेल. फक्त मुख्य प्रशासक बदल करू शकतो.','Add a separate domain for this village. Until one is assigned, the field shows — —. Only Super Admins can edit it.')}</p></div></div>
 <section class="admin-panel form-panel"><h2>${tr(lang,'पूर्वनिर्धारित गावाची लिंक','Predefined village URL')}</h2><p class="domain-code">/v/${esc(v.slug)}</p><p><a href="https://gramos-public.vercel.app/v/${encodeURIComponent(v.slug)}" target="_blank" rel="noopener noreferrer">https://gramos-public.vercel.app/v/${esc(v.slug)} ↗</a></p><p class="small-muted">${tr(lang,'कस्टम डोमेनवरसुद्धा हाच /v/गाव पत्ता राहील.','The /v/village path stays the same on the custom domain.')}</p></section>
 <form id="domainForm" data-id="${esc(v.id)}"><section class="admin-panel form-panel"><h2>${tr(lang,'गावाचा डोमेन पत्ता','Village custom domain')}</h2><p>${tr(lang,'सध्याचा पत्ता','Current domain')}: <strong>${host||'— —'}</strong></p>
 ${field('hostname',tr(lang,'डोमेन लिहा (उदा. village.in)','Enter custom domain (e.g. village.in)'),displayed,{placeholder:'— —',required:true})}
 <p class="small-muted">${tr(lang,'https:// किंवा /v/ जोडू नका; ते आपोआप वापरले जाईल.','Do not include https:// or /v/; the website adds them automatically.')}</p>
 <button class="btn btn-dark" type="submit">${tr(lang,'डोमेन जोडा / बदला','Save / change domain')}</button></section></form>
 <section class="admin-panel"><h2>${tr(lang,'डोमेन पडताळणी','Domain status and verification')}</h2><p>${info.vercelConnected?tr(lang,'Vercel API जोडलेले आहे. DNS पूर्ण केल्यावर तपासा.','Vercel API is connected. Verify after completing DNS.'):tr(lang,'Vercel API अजून जोडलेले नाही. gramos-public → Domains मध्ये डोमेन जोडा आणि Vercel token सेट करा.','Vercel API is not configured. Add the domain under gramos-public → Domains and configure the Vercel server token.')}</p>
 ${(info.domains||[]).map(d=>`<div class="domain-record"><strong>${esc(d.hostname)}</strong> <span class="status status-${esc(d.status)}">${esc(d.status)}</span>
 ${d.vercel_details?.recommendedCNAME?`<p class="small-muted">CNAME: <code>${esc(JSON.stringify(d.vercel_details.recommendedCNAME))}</code></p>`:''}
 ${d.vercel_details?.recommendedIPv4?`<p class="small-muted">A: <code>${esc(JSON.stringify(d.vercel_details.recommendedIPv4))}</code></p>`:''}
 ${Array.isArray(d.vercel_details?.verification)&&d.vercel_details.verification.length?`<details><summary>${tr(lang,'मालकी पडताळणी TXT रेकॉर्ड','Ownership verification TXT records')}</summary>${d.vercel_details.verification.map(x=>`<p class="small-muted">${esc(x.type||'TXT')}: ${esc(x.domain||x.name||d.hostname)} = <code>${esc(x.value||'')}</code></p>`).join('')}</details>`:''}
 <div class="domain-record-tools"><button type="button" class="button-lite" data-action="domain-check" data-id="${esc(v.id)}" data-hostname="${esc(d.hostname)}">${tr(lang,'DNS तपासा आणि सक्रिय करा','Verify & activate')}</button><button type="button" class="button-danger" data-action="domain-remove" data-id="${esc(v.id)}" data-hostname="${esc(d.hostname)}">${tr(lang,'काढून टाका','Remove')}</button></div></div>`).join('')||'<p>— —</p>'}
 <p class="small-muted">${tr(lang,'डोमेन पडताळणी पूर्ण होईपर्यंत जुन्या गावाच्या लिंकवरच वेबसाइट चालेल.','The original village link continues working until Vercel ownership and DNS verification succeed.')}</p></section>`;
}

export async function submitAdminForm(form,route,role,navigate,rerender){
 if(!api) throw new Error('Supabase is not configured');
 if(form.id!=='loginForm' && form.id!=='recoverPasswordForm' && form.id!=='setPasswordForm' && form.id!=='createVillageForm' && form.id!=='createStaffLoginForm' && form.id!=='grantSuperAdminForm' && !role.admin && !role.editorIds?.includes(form.dataset.id))throw new Error('Your account cannot edit this village.');
 const fd=new FormData(form); const get=k=>String(fd.get(k)||'').trim();
 const asDraft=form.dataset?.saveMode==='draft';
 if(form.id==='recoverPasswordForm'){
   const email=get('email').toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
   const {error}=await api.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/admin/security`});
   if(error)throw new Error('Cannot send reset email. Check Supabase Auth email settings.');
   form.reset();notif('If this email is registered, a password reset link will arrive shortly.');return;
 }
 if(form.id==='setPasswordForm'){
   const password=String(fd.get('password')??''),confirmation=String(fd.get('confirm_password')??'');
   if(password.length<14||password.length>128)throw new Error('Use a password between 14 and 128 characters.');
   if(password!==confirmation)throw new Error('Passwords do not match.');
   const {error}=await api.auth.updateUser({password});if(error)throw new Error(error.message);
   form.reset();notif('Your new password was saved.');return;
 }
 if(form.id==='loginForm'){
   const email=get('email');
   const password=String(fd.get('password')??''); // Passwords may contain significant whitespace.
   if(!email||!password)throw new Error('Enter the email and password of an existing Supabase Auth user.');
   const {error}=await api.auth.signInWithPassword({email,password});
   if(error){
     if(/invalid login credentials|invalid credentials|email not confirmed/i.test(error.message||''))
       throw new Error('Login failed. Confirm that you accepted your email invitation and set your password under Account security, or choose Forgot password.');
     throw new Error(error.message);
   }
   notif('Signed in successfully'); navigate('/admin');return;
 }
 if(form.id==='clientRecordForm'){
   await saveClientRecord(form,role);notif('Customer record saved to Supabase. Updated Excel/CSV export is available.');rerender();return;
 }
 if(form.id==='createStaffLoginForm'){
   const created=await createStaffLogin(form,role);
   form.reset();notif(`Created ${created.role} account for ${created.email}. Share password privately.`);return;
 }
 if(form.id==='domainForm'){
   if(!role.admin)throw new Error('Only Super Admin can manage domains.');
   const hostname=get('hostname');const response=await domainRequest(form.dataset.id,'register',hostname);
   notif(response.message||'Domain saved');rerender();return;
 }
 if(form.id==='grantSuperAdminForm'){
   if(!role.admin)throw new Error('Only Super Admin can grant this role.');
   const user_id=get('user_id');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id))throw new Error('Enter the Supabase Auth user ID.');
   if(!confirm('Grant full Super Admin permissions to this existing Auth user?'))return;
   await call(api.rpc('gramos_grant_super_admin',{p_user_id:user_id}));notif('Super Admin added');rerender();return;
 }
 if(form.id==='createVillageForm'){
   const villageId=await createVillageWithClient(form,role);
   notif('Village created as a draft. Edit the website and publish when ready.');
   navigate(`/admin/villages/${encodeURIComponent(villageId)}/overview`);return;
 }
 if(form.id==='seoSettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found or editing is not permitted.');
   const page=form.dataset.page;
   if(!SEO_PAGES.includes(page))throw new Error('Unknown page.');
   const value={title:get('seo_title').trim(),description:get('seo_description').trim(),keywords:get('seo_keywords').trim(),image_url:get('seo_image_url').trim(),noindex:get('seo_noindex')==='true'};
   if(value.title.length>150||value.description.length>320||value.keywords.length>350)throw new Error('Metadata is too long. Title max 150, description max 320, keywords max 350.');
   if(value.image_url&&!/^https:\/\//i.test(value.image_url))throw new Error('Sharing image must use HTTPS.');
   const current=existing.site_settings||{};
   const previous=current.seo&&typeof current.seo==='object'?current.seo:{};
   const site_settings={...current,seo:{...previous,[page]:value}};
   if(asDraft){const pending=await getSiteDraft(form.dataset.id);const merged={...previous,...(pending?.changes?.site_settings?.seo||{}),[page]:value};await saveSiteDraft(form.dataset.id,{site_settings:{seo:merged}});notif('Google information draft saved. Publish from Overview.');rerender();return;}
   const updated=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!updated?.length)throw new Error('Metadata could not be saved. Check RLS and your editor role.');
   notif('Metadata saved for '+page);rerender();return;
 }
 if(form.id==='contactSettingsForm'){
   const existing=await villageById(form.dataset.id);if(!existing)throw new Error('Village not found or editing is not permitted.');
   const keys=(extraSiteGroups.find(([name])=>name.startsWith('CONTACT PAGE'))?.[1]||[]).map(([key])=>key);
   for(const k of ['contact_map_url','contact_map_embed_url'])if(get(k)&&!/^https:\/\//i.test(get(k)))throw new Error('Map URLs must start with https://');
   if(get('contact_map_url')){const url=new URL(get('contact_map_url'));if(!['www.google.com','maps.google.com','maps.app.goo.gl'].includes(url.hostname))throw new Error('Use a Google Maps direction link.');}
   if(get('contact_map_embed_url')){const url=new URL(get('contact_map_embed_url'));
      if(!['www.google.com','maps.google.com'].includes(url.hostname)||!(url.pathname.startsWith('/maps/embed')||url.hostname==='maps.google.com'&&url.pathname==='/maps'))throw new Error('Only a Google Maps embed URL is accepted.');}
   const site_settings={...(existing.site_settings||{}),...Object.fromEntries(keys.map(key=>[key,get(key)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(keys.map(k=>[k,get(k)]))});notif('Contact draft saved. Publish from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Contact page settings could not be saved.');
   notif('Contact page saved');rerender();return;
 }
 if(form.id==='newsSettingsForm'||form.id==='gallerySettingsForm'){
   const existing=await villageById(form.dataset.id);if(!existing)throw new Error('Village not found or editing is not permitted.');
   const prefix=form.id==='newsSettingsForm'?'NEWS PAGE':'GALLERY PAGE';
   const keys=(extraSiteGroups.find(([name])=>name.startsWith(prefix))?.[1]||[]).map(([key])=>key);
   const site_settings={...(existing.site_settings||{}),...Object.fromEntries(keys.map(k=>[k,get(k)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(keys.map(k=>[k,get(k)]))});notif('Page draft saved. Publish from Overview.');rerender();return;}
   const updated=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!updated?.length)throw new Error('Could not save page settings.');
   notif('Page headings saved');rerender();return;
 }
 if(form.id==='aboutSettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found, or you have no editing permission.');
   const aboutKeys=(extraSiteGroups.find(([name])=>name.startsWith('ABOUT PAGE'))?.[1]||[]).map(([key])=>key);
   const updatedSettings={...(existing.site_settings||{}),...Object.fromEntries(aboutKeys.map(key=>[key,get(key)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(aboutKeys.map(k=>[k,get(k)]))});notif('About page draft saved. Publish from Overview.');rerender();return;}

   const rows=await call(api.from('villages').update({site_settings:updatedSettings}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('About page settings were not saved. Check village access.');
   notif('About page settings saved');rerender();return;
 }
 if(form.id==='serviceSettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found or you do not have editing permission.');
   const serviceKeys=(extraSiteGroups.find(([name])=>name.startsWith('LOKSEVA'))?.[1]||[]).map(([key])=>key);
   const updatedSettings={...(existing.site_settings||{}),...Object.fromEntries(serviceKeys.map(key=>[key,get(key)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(serviceKeys.map(k=>[k,get(k)]))});notif('Services draft saved. Publish from Overview.');rerender();return;}
   const updated=await call(api.from('villages').update({site_settings:updatedSettings}).eq('id',form.dataset.id).select('id'));
   if(!updated?.length)throw new Error('Lokseva settings were not saved.');
   notif('Lokseva settings saved');rerender();return;
 }
 if(form.id==='schemeSettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found or editing is not permitted.');
   const keys=(extraSiteGroups.find(([name])=>name.startsWith('GOVERNMENT SCHEMES'))?.[1]||[]).map(([key])=>key);
   const site_settings={...(existing.site_settings||{}),...Object.fromEntries(keys.map(key=>[key,get(key)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(keys.map(key=>[key,get(key)]))});notif('Page draft saved. Publish from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Scheme page settings could not be saved.');
   notif('Government Schemes page settings saved');rerender();return;
 }
 if(form.id==='beneficiarySettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found or editing is not permitted.');
   const keys=(extraSiteGroups.find(([name])=>name.startsWith('BENEFICIARY LISTS'))?.[1]||[]).map(([key])=>key);
   const site_settings={...(existing.site_settings||{}),...Object.fromEntries(keys.map(key=>[key,get(key)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(keys.map(key=>[key,get(key)]))});notif('Page draft saved. Publish from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Beneficiary page headings were not saved.');
   notif('Yojana beneficiary headings saved');rerender();return;
 }
 if(form.id==='noticeSettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found or editing is not permitted.');
   const keys=(extraSiteGroups.find(([name])=>name.startsWith('NOTICE BOARD PAGE'))?.[1]||[]).map(([key])=>key);
   const site_settings={...(existing.site_settings||{}),...Object.fromEntries(keys.map(k=>[k,get(k)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(keys.map(k=>[k,get(k)]))});notif('Page draft saved. Publish from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Notice Board page settings could not be saved.');
   notif('Notice Board page settings saved');rerender();return;
 }
 if(form.id==='projectSettingsForm'){
   const existing=await villageById(form.dataset.id);
   if(!existing)throw new Error('Village not found or editing is not permitted.');
   const keys=(extraSiteGroups.find(([name])=>name.startsWith('DEVELOPMENT PROJECTS'))?.[1]||[]).map(([key])=>key);
   const site_settings={...(existing.site_settings||{}),...Object.fromEntries(keys.map(k=>[k,get(k)]))};
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries(keys.map(k=>[k,get(k)]))});notif('Page draft saved. Publish from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update({site_settings}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Development Projects page could not be saved.');
   notif('Development Projects headings saved');rerender();return;
 }
 if(form.id==='homeForm'){
   const existing=await villageById(form.dataset.id);if(!existing)throw new Error('Village not found or permission denied.');
   const groups=['WELCOME / HERO','HOMEPAGE SECTION HEADINGS','HEADER / NAVIGATION','WEATHER /'];
   const keys=['quote_mr','quote_en',...extraSiteGroups.filter(([name])=>groups.some(x=>name.startsWith(x))).flatMap(x=>x[1].map(([key])=>key))];
   const image=get('hero_image_url');if(image&&!/^https:\/\//i.test(image))throw new Error('Banner image must be an HTTPS URL.');
   if(get('weather_embed_url')&&!/^https:\/\//i.test(get('weather_embed_url')))throw new Error('Weather URL must start with HTTPS.');
   const part=form.dataset.homePart||'';const patch={};
   if(fd.has('hero_image_url'))patch.hero_image_url=image;
   const changedSettings=Object.fromEntries(keys.filter(k=>fd.has(k)).map(k=>[k,get(k)]));
   if(Object.keys(changedSettings).length)patch.site_settings=changedSettings;
   if(!part||part==='order')patch.home_sections=[...form.querySelectorAll('#sectionOrder [data-section]')].map(e=>e.dataset.section);
   if(!Object.keys(patch).length)throw new Error('No editable fields in this section.');
   if(asDraft){await saveSiteDraft(form.dataset.id,patch);notif('Homepage draft saved. Publish it from Overview.');rerender();return;}
   const payload={...patch,...(patch.site_settings?{site_settings:{...(existing.site_settings||{}),...patch.site_settings}}:{})};
   const rows=await call(api.from('villages').update(payload).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Homepage could not be saved.');notif('Homepage published');rerender();return;
 }
 if(form.id==='navbarBrandingForm'){
   const navURL=get('nav_logo_url');
   if(navURL&&(!/^https:\/\//i.test(navURL)||!imageURL(navURL)))throw new Error('Header logo URL must use HTTPS.');
   const styles={nav_logo_url:navURL,nav_logo_size:get('nav_logo_size'),nav_logo_mobile_size:get('nav_logo_mobile_size')||'48',nav_logo_fit:get('nav_logo_fit'),nav_logo_shape:get('nav_logo_shape'),nav_logo_position:get('nav_logo_position'),...Object.fromEntries(['brand_title_mr','brand_title_en','brand_subtitle_mr','brand_subtitle_en'].map(k=>[k,get(k)]))};
   if(!['40','52','64','72','84'].includes(styles.nav_logo_size)||!['36','40','44','48','52','56','64'].includes(styles.nav_logo_mobile_size)||!['contain','cover'].includes(styles.nav_logo_fit)||!['rounded','square','circle'].includes(styles.nav_logo_shape)||!['center','left','right'].includes(styles.nav_logo_position))throw new Error('Select a valid logo style.');
   if(Object.entries(styles).some(([k,val])=>k.startsWith('brand_')&&String(val).length>150))throw new Error('Header text must be at most 150 characters per field.');
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:styles});notif('Navbar logo draft saved. Publish from Overview.');rerender();return;}
   const existing=await villageById(form.dataset.id);if(!existing)throw new Error('Village not found.');
   const changed=await call(api.from('villages').update({site_settings:{...(existing.site_settings||{}),...styles}}).eq('id',form.dataset.id).select('id'));
   if(!changed?.length)throw new Error('Navbar logo was not saved.');notif('Navbar logo published for this village');rerender();return;
 }
 if(form.id==='footerForm'){
   const existing=await villageById(form.dataset.id);if(!existing)throw new Error('Village not found or permission denied.');
   const urls=[...form.querySelectorAll('#footerLogoList [data-logo-row]:not([hidden]) input[name^="footer_logo_"]')].map(x=>x.value.trim()).filter(Boolean);
   if(urls.length>12)throw new Error('You can add a maximum of 12 bottom logos.');
   for(const url of urls)if(!/^https:\/\//i.test(url)||!imageURL(url))throw new Error('Each bottom logo must be an HTTPS image URL.');
   for(const key of ['facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url'])if(get(key)&&!/^https:\/\//i.test(get(key)))throw new Error('Social links must use HTTPS.');
   const siteFields=['office_hours_mr','office_hours_en','facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url','links_mr','links_en',...(extraSiteGroups.find(([title])=>title.startsWith('FOOTER /'))?.[1]||[]).map(([key])=>key)];
   const updated={...(existing.site_settings||{}),...Object.fromEntries(siteFields.filter(k=>fd.has(k)).map(k=>[k,get(k)])),footer_logos:urls,footer_logo_url:urls[0]||''};
   validateSocialSettings(updated);
   for(const k of ['links_mr','links_en'])for(const line of String(updated[k]||'').split('\n').filter(x=>x.trim())){
     const parts=line.split('|');if(parts.length<2||!/^https:\/\//.test(parts.slice(1).join('|').trim()))throw new Error('Useful links must be: name | https://link');
   }
   if(asDraft){await saveSiteDraft(form.dataset.id,{site_settings:Object.fromEntries([...siteFields,'footer_logos','footer_logo_url'].map(k=>[k,updated[k]]))});notif('Footer draft saved for this village. Publish from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update({site_settings:updated}).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Footer could not be saved.');notif('Footer and logos published for this village');rerender();return;
 }
 if(form.id==='settingsForm'){
   const fields=['slug','name_mr','name_en','tagline_mr','tagline_en','about_mr','about_en','district_mr','district_en','taluka_mr','taluka_en','address_mr','address_en','phone','email','logo_url','template_style'];
   const payload=Object.fromEntries(fields.map(k=>[k,get(k)]));
   if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(payload.slug)||payload.slug.length<2)throw new Error('Invalid URL slug.');
   if(!payload.name_mr&&!payload.name_en)throw new Error('At least one village name is required.');
   if(!['classic','modern'].includes(payload.template_style))throw new Error('Invalid template style.');
   if(payload.logo_url&&!/^https:\/\//i.test(payload.logo_url))throw new Error('Logo must be an HTTPS image URL.');
   // Backwards compatible with older installations posting the original combined
   // settings form. New UI uses homeForm and footerForm, so normal settings saves
   // never touch those independent sections.
   const legacyKeys=['quote_mr','quote_en','office_hours_mr','office_hours_en','facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url','footer_logo_url','links_mr','links_en',...extraSiteKeys];
   if(form.fields && legacyKeys.some(k=>Object.hasOwn(form.fields,k))){
     const existing=await villageById(form.dataset.id);if(!existing)throw new Error('Village not found or permission denied.');
     payload.site_settings={...(existing.site_settings||{}),...Object.fromEntries(legacyKeys.filter(k=>Object.hasOwn(form.fields,k)&&!['copyright_mr','copyright_en','credit_mr','credit_en'].includes(k)).map(k=>[k,get(k)]))};
     if(Object.hasOwn(form.fields,'hero_image_url'))payload.hero_image_url=get('hero_image_url');
     if(Object.hasOwn(form.fields,'quote_mr')&&globalThis.document?.querySelectorAll)
       payload.home_sections=[...document.querySelectorAll('#sectionOrder [data-section]')].map(el=>el.dataset.section);
   }
   if(asDraft){await saveSiteDraft(form.dataset.id,payload);notif('Village information draft saved. Publish it from Overview.');rerender();return;}
   const rows=await call(api.from('villages').update(payload).eq('id',form.dataset.id).select('id'));
   if(!rows?.length)throw new Error('Village settings could not be saved.');notif('Village information published');rerender();return;
 }
 if(form.id==='contentForm'){
   const fields=['slug','title_mr','title_en','subtitle_mr','subtitle_en','body_mr','body_en','image_url','external_url','status'];
   const payload=Object.fromEntries(fields.map(k=>[k,get(k)]));
   if(!payload.title_mr&&!payload.title_en)throw new Error('Enter a title in at least one language.');
   payload.slug=slugify(payload.slug || payload.title_en) || `entry-${Date.now().toString(36)}`;
   if(payload.slug.length<2||payload.slug.length>90)throw new Error('Enter a valid short URL slug.');
   if(payload.image_url&&!/^https:\/\//.test(payload.image_url))throw new Error('Image URL must start with https://');
   if(payload.external_url&&!/^https:\/\//.test(payload.external_url))throw new Error('External URL must start with https://');
   payload.sort_order=Number.parseInt(get('sort_order')||'0',10);if(!Number.isFinite(payload.sort_order))payload.sort_order=0;
   payload.status=asDraft?'draft':'published';
   payload.village_id=form.dataset.id;payload.kind=form.dataset.kind;
   const detailKeys=['metrics','facilities'].includes(payload.kind)?['value']:payload.kind==='about_facilities'?['value','value_mr','value_en']:payload.kind==='about_facts'?['value','value_mr','value_en','group']:payload.kind==='page_elements'?['page_target','element']:payload.kind==='about_blocks'?['about_tab','element','columns_mr','columns_en']:payload.kind==='officials'?['about_group','ward_mr','ward_en','phone','elected_date']:payload.kind==='committees'?['committee_key','committee_title_mr','committee_title_en','committee_role_mr','committee_role_en']:payload.kind==='duties'?['icon','accent']:payload.kind==='news'?['event_date','author_mr','author_en','source_title_mr','source_title_en','related_links_mr','related_links_en']:payload.kind==='gallery'?['gallery_type']:payload.kind==='notices'?['event_date','notice_type']:payload.kind==='beneficiary_lists'?['beneficiary_type','file_path']:payload.kind==='schemes'?['scheme_type','eligibility_mr','eligibility_en','benefits_mr','benefits_en','documents_mr','documents_en','process_mr','process_en','note_mr','note_en']:payload.kind==='projects'?['scheme_mr','scheme_en','project_year','location_mr','location_en','project_status']:payload.kind==='service_links'?['color']:payload.kind==='services'?['icon','required_documents_mr','required_documents_en','process_mr','process_en','fee_mr','fee_en','duration_mr','duration_en']:[];
   payload.details=Object.fromEntries(detailKeys.filter(k=>get(k)!=='').map(k=>[k,get(k)]));
   if(payload.kind==='news')for(const key of ['related_links_mr','related_links_en']){
     const rows=String(payload.details[key]||'').split('\n').map(x=>x.trim()).filter(Boolean);
     if(rows.length>8)throw new Error('A news article can have up to 8 related links.');
     for(const row of rows){const [title,...rest]=row.split('|');const link=rest.join('|').trim();
       if(!title?.trim()||!/^https:\/\//i.test(link)||link.length>2000)throw new Error('News related links must use Title | https://example.com format.');}
   }
   if(payload.kind==='page_elements' && (!PAGE_TARGETS.includes(payload.details.page_target)||!ELEMENT_TYPES.includes(payload.details.element)))throw new Error('Select a valid page and element type.');
   if(payload.kind==='page_elements' && payload.details.element==='link' && !/^https:\/\//i.test(payload.external_url))throw new Error('Link elements require an HTTPS destination.');
   if(payload.kind==='about_blocks' && (!['info','officials','staff','committees','facilities','duties'].includes(payload.details.about_tab)||!['text','bullets','table','tiles','image','heading'].includes(payload.details.element)))throw new Error('Select a valid tab and element type.');
   if(payload.kind==='service_links' && (!payload.external_url || !/^https:\/\//.test(payload.external_url) || !['blue','gray','yellow','green','peach','lavender'].includes(payload.details.color||'blue')))throw new Error('A citizen link needs an https:// URL and an approved card color.');
   if(payload.kind==='duties' && payload.details.accent && !/^#[0-9a-fA-F]{6}$/.test(payload.details.accent))throw new Error('Card accent must be a 6-digit hex color, e.g. #bf392b');
   // Committee headings can live independently as 'committee_groups'.
   if(payload.kind==='committees' && !payload.details.committee_key)throw new Error('Enter a short committee group identifier, shared by its members.');
   if(payload.kind==='beneficiary_lists'){
     if(!['individual','public'].includes(payload.details.beneficiary_type||'individual'))throw new Error('Invalid scheme category.');
     payload.details.beneficiary_type||='individual';
     const path=payload.details.file_path||'';
     if(path&&!new RegExp('^'+form.dataset.id.replace(/-/g,'\\-')+'/[0-9a-f-]{36}\\.xlsx$','i').test(path))throw new Error('Upload the Excel file for this village first.');
     payload.details.public_file_approved=get('public_file_approved')==='true';
     if(payload.details.public_file_approved&&!path)throw new Error('Upload an Excel workbook before approving download.');
   }
   if(payload.kind==='schemes' && !payload.details.scheme_type)payload.details.scheme_type='individual';
   if(payload.kind==='schemes' && !['individual','public'].includes(payload.details.scheme_type||'individual'))throw new Error('Select an approved scheme category.');
   if(['notices','service_forms'].includes(payload.kind) && payload.external_url && !/\.pdf(?:[?#]|$)/i.test(payload.external_url))throw new Error('Download files must link directly to a .pdf document. Upload a PDF above or paste its HTTPS PDF URL.');
   if(payload.kind==='notices' && !['notice','financial','rti','resolutions'].includes(payload.details.notice_type||'notice'))throw new Error('Select a valid Notice Board category.');
   if(payload.kind==='gallery' && !['meetings','campaigns','development','cultural','press'].includes(payload.details.gallery_type||'meetings'))throw new Error('Select a valid gallery category.');
   if(payload.kind==='videos' && !payload.external_url)throw new Error('Enter a valid HTTPS video link.');
   if(payload.kind==='projects' && !['ongoing','completed','upcoming','unclassified'].includes(payload.details.project_status||'unclassified'))throw new Error('Select a valid project status.');
   if(payload.details.project_year){const yr=Number(payload.details.project_year);if(!Number.isInteger(yr)||yr<1900||yr>2200)throw new Error('Invalid project year');payload.details.project_year=yr;}
   if(form.dataset.edit){
     const updated=await call(api.from('content_items').update(payload).eq('id',form.dataset.edit).eq('village_id',form.dataset.id).select('id'));
     if(!updated?.length)throw new Error('Content was not updated. Check your editor permissions and try again.');
   }else{
     const inserted=await call(api.from('content_items').insert(payload).select('id'));
     if(!inserted?.length)throw new Error('Content could not be created.');
   }
   notif('Content saved'); const current=new URLSearchParams(location.search);const next=new URLSearchParams();const parent=safeParent(form.dataset.kind,current);if(parent!=='overview')next.set('from',parent);const category=categoryFor(form.dataset.kind,current);if(category)next.set('category',category);navigate(`/admin/villages/${form.dataset.id}/content/${form.dataset.kind}${next.size?'?'+next:''}`);return;
 }
}
export async function adminAction(button,route,role,navigate,rerender){
 const action=button.dataset.action, itemId=button.dataset.id,next=button.dataset.next;
 if(action==='domain-check'||action==='domain-remove'){
   if(!role.admin)throw new Error('Only Super Admin can manage domains.');
   if(action==='domain-remove'&&!confirm('Remove this domain from the village? The old /v/village link will still work.'))return true;
   const response=await domainRequest(itemId,action==='domain-check'?'check':'remove',button.dataset.hostname||'');
   notif(response.message||'Domain updated');rerender();return true;
 }
 if(action==='gx-csv-template'){downloadCSVTemplate(button.dataset.kind);return true;}
 if(action==='gx-csv-confirm'){const count=await commitCSVImport(role,navigate);if(count!==false)notif(`${count} drafts imported. Publish them when ready.`);return true;}
 if(action==='export-clients-csv'||action==='export-clients-xlsx'){
   await exportClients(role,action.endsWith('xlsx')?'xlsx':'csv');
   notif('Current customer register downloaded. Passwords are never included.');return true;
 }
 if(action==='logout'){await api.auth.signOut();notif('Signed out');navigate('/admin/login');return true;}
 if(action==='nav-logo-reset'){
   if(!role.admin&&!role.editorIds?.includes(route[2]))throw new Error('Only a village editor can change the logo.');
   const form=document.getElementById('navbarBrandingForm');if(!form)return true;
   const field=form.querySelector('[name="nav_logo_url"]');if(field)field.value='';
   const preview=form.querySelector('.admin-v47-logo-preview img');if(preview)preview.src=preview.dataset.fallback||'/assets/gp-mark.svg';
   form.dataset.dirty='true';const hint=form.querySelector('.admin-save-hint');if(hint)hint.hidden=false;
   notif('Village main logo selected. Save draft or publish to apply.');return true;
 }
 if(action==='remove-member'){
   if(!role.admin)throw new Error('Only platform administrators manage staff access.');
   if(!confirm('Remove this village staff member?'))return true;
   await call(api.from('village_members').delete().eq('village_id',route[2]).eq('user_id',itemId));
   notif('Staff member removed');rerender();return true;
 }
 if(!role.admin && !role.editorIds?.includes(route[2]) && !['view-attachment','refresh-inbox'].includes(action))throw new Error('You have read-only access to this village.');
 if(action==='gx65-use-reference-photo'){
   const form=button.closest('form');const card=referenceLeaderCards.find(x=>x.slug===button.dataset.slug);
   if(!card||form?.dataset.id!==route[2]||form.dataset.kind!=='leaders')throw new Error('Invalid reference card.');
   if(!confirm('Use this reference photograph? Confirm you have permission to use it and verify the current official role before publishing.'))return true;
   const response=await fetch(card.image_url);if(!response.ok)throw new Error('Reference photo not available. Upload a verified photo instead.');
   const blob=await response.blob();const file=new File([blob],card.slug+'.webp',{type:'image/webp'});
   const url=await uploadPublicImage(file,route[2]);form.querySelector('[name="image_url"]').value=url;
   const preview=form.querySelector('[data-record-photo]');if(preview){preview.src=url;preview.hidden=false;}const empty=form.querySelector('[data-record-photo-empty]');if(empty)empty.hidden=true;
   notif('Photo attached. Save a draft or publish after verification.');return true;
 }
 if(action?.startsWith('footer-logo-')){
   const list=document.getElementById('footerLogoList');if(!list)return true;
   const rows=[...list.querySelectorAll('[data-logo-row]')];const row=button.closest('[data-logo-row]');
   if(action==='footer-logo-add'){
     const empty=rows.find(r=>r.hidden);if(!empty){notif('Maximum 12 bottom logos',true);return true;}
     empty.hidden=false;
   }else if(action==='footer-logo-remove'&&row){
     const input=row.querySelector('input[name^="footer_logo_"]');if(input)input.value='';
     row.querySelector('input[type="file"]')?.setAttribute('value','');
     const thumb=row.querySelector('.admin-footer-logo-thumb');if(thumb){thumb.hidden=true;thumb.src='/assets/mark.svg';}const placeholder=row.querySelector('.admin-footer-logo-placeholder');if(placeholder)placeholder.hidden=false;row.hidden=true;
   }else if(action==='footer-logo-up'&&row){
     const prev=[...list.querySelectorAll('[data-logo-row]:not([hidden])')].filter(el=>el!==row).findLast(el=>el.compareDocumentPosition(row)&Node.DOCUMENT_POSITION_FOLLOWING);if(prev){list.insertBefore(row,prev);}
   }else if(action==='footer-logo-down'&&row){
     const next=[...list.querySelectorAll('[data-logo-row]:not([hidden])')].filter(el=>el!==row).find(el=>row.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING);if(next){list.insertBefore(next,row);}
   }
   [...list.querySelectorAll('[data-logo-row]:not([hidden])')].forEach((el,i)=>{const n=el.querySelector('.admin-logo-number');if(n)n.textContent=String(i+1);});
   const count=[...list.querySelectorAll('[data-logo-row]:not([hidden]) input[name^="footer_logo_"]')].filter(input=>input.value.trim()).length;
   const labelCount=list.closest('.admin-panel')?.querySelector('.admin-logo-count');if(labelCount)labelCount.textContent=`${count} / 12`;
   const editForm=list.closest('form');if(editForm){editForm.dataset.dirty='true';const saveHint=editForm.querySelector('.admin-save-hint');if(saveHint)saveHint.hidden=false;}
   return true;
 }
 if(action==='preview-refresh'){const frame=document.querySelector('.admin-preview-wide iframe');if(frame){frame.src=frame.getAttribute('src');notif('Website preview refreshed');}return true;}
 if(action==='refresh-inbox'){rerender();return true;}
 if(action==='publish-site-draft'){const v=route[2];if(!v)throw new Error('Select a village');if(!confirm('Publish your saved homepage and site settings changes?'))return true;await publishSiteDraft(v);notif('Saved draft published');rerender();return true;}
 if(action==='discard-site-draft'){const v=route[2];if(!v)throw new Error('Select a village');if(!confirm('Discard all saved website setting drafts? Your published site stays unchanged.'))return true;await discardSiteDraft(v);notif('Site setting draft discarded');rerender();return true;}
 if(action==='site-status'){
   if(!confirm(next==='published'?'Publish this entire village website now? Each item still needs its own Published status.':'Unpublish this entire website from public view?'))return true;
   const changed=await call(api.from('villages').update({status:next}).eq('id',itemId).select('id'));if(!changed?.length)throw new Error('Website status was not changed. Check editor permissions.');notif(`Website changed to ${next}`);rerender();return true;
 }
 if(action==='archive-site'){
   if(!role.admin)throw new Error('Only Super Admin can remove or restore a village.');
   const targetId=itemId||route[2];const current=targetId&&await villageById(targetId);if(!current)throw new Error('Village no longer exists or is not accessible.');const status=current.status==='archived'?'draft':'archived';
   if(status==='archived'){const typed=prompt(`REMOVE WEBSITE (ARCHIVE ONLY)\n\nThis hides ${current.slug} from public view; it does NOT erase village content.\n\nType ${current.slug} to confirm:`);if(typed!==current.slug)return true;}else if(!confirm('Restore this website as an unpublished draft?'))return true;
   const updated=await call(api.from('villages').update({status}).eq('id',targetId).select('id'));if(!updated?.length)throw new Error('Could not update website status.');notif(`Website set to ${status}`);rerender();return true;
 }
 if(action==='item-status'){
   const vId=route[2];if(!['draft','published'].includes(next))throw new Error('Invalid publication state.');
   const el=button.closest('.content-row-actions')?.querySelector('.status'),oldText=el?.textContent,oldClass=el?.className;
   if(el){el.textContent=next;el.className=`status status-${next}`;}
   try{const rows=await call(api.from('content_items').update({status:next}).eq('id',itemId).eq('village_id',vId).is('deleted_at',null).select('id'));if(!rows?.length)throw new Error('Content was not changed.');}
   catch(e){if(el){el.textContent=oldText;el.className=oldClass;}throw e;}
   notif(next==='published'?'Now visible on the website':'Saved as draft');rerender();return true;
 }
 if(action==='delete-item'){
   if(!confirm('Move this item to Restore? It will be hidden from visitors.'))return true;
   const rows=await call(api.from('content_items').update({status:'draft',deleted_at:new Date().toISOString()}).eq('id',itemId).eq('village_id',route[2]).is('deleted_at',null).select('id'));
   if(!rows?.length)throw new Error('Could not remove this record.');
   notif('Moved to Restore');rerender();return true;
 }
 if(action==='restore-item'){
   const rows=await call(api.from('content_items').update({deleted_at:null,status:'draft'}).eq('id',itemId).eq('village_id',route[2]).not('deleted_at','is',null).select('id'));
   if(!rows?.length)throw new Error('Could not restore this record.');
   notif('Restored as a draft. Publish when ready.');rerender();return true;
 }
 if(action==='submission-status'){
   if(!['reviewed','rejected'].includes(next))throw new Error('Invalid complaint status');
   const el=button.closest('.gx6-sub-detail')?.querySelector('.status'),oldText=el?.textContent,oldClass=el?.className;
   if(el){el.textContent=next;el.className=`status status-${next}`;}
   try{const rows=await call(api.from('submissions').update({status:next}).eq('id',itemId).eq('village_id',route[2]).select('id'));if(!rows?.length)throw new Error('Complaint not updated.');}
   catch(e){if(el){el.textContent=oldText;el.className=oldClass;}throw e;}
   notif(`Submission marked ${next}`);rerender();return true;
 }
 if(action==='view-attachment'){
   const session=(await api.auth.getSession()).data.session;
   if(!session)throw new Error('Session expired; sign in again.');
   const res=await fetch(`/api/attachment?submission_id=${encodeURIComponent(itemId)}`,{headers:{Authorization:`Bearer ${session.access_token}`}});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Cannot open attachment');
   const url=new URL(data.url);if(url.protocol!=='https:')throw new Error('Invalid attachment link');
   const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.className='button-lite';link.textContent='Open private photo / खाजगी फोटो उघडा ↗';
   button.replaceWith(link);link.focus();return true;
 }
 if(action?.startsWith('section-')){
   const list=document.getElementById('sectionOrder');if(!list)return true;
   const row=button.closest('.order-row');
   if(action==='section-remove')row?.remove();
   if(action==='section-up'&&row?.previousElementSibling)list.insertBefore(row,row.previousElementSibling);
   if(action==='section-down'&&row?.nextElementSibling)list.insertBefore(row.nextElementSibling,row);
   if(action==='section-add'){
     const s=button.dataset.section;
     if(!list.querySelector(`[data-section="${s}"]`))list.insertAdjacentHTML('beforeend',`<div class="order-row" data-section="${esc(s)}"><span class="drag-index">•</span><strong>${esc(button.dataset.label||s)}</strong><button type="button" data-action="section-up">↑</button><button type="button" data-action="section-down">↓</button><button type="button" data-action="section-remove">✕</button></div>`);
   }
   [...list.children].forEach((el,i)=>{const ix=el.querySelector('.drag-index');if(ix)ix.textContent=String(i+1).padStart(2,'0');});
   return true;
 }
 return false;
}
export async function documentUpload(input){
 const file=input.files?.[0];if(!file)return;
 input.disabled=true;
 try{const {uploadPublicDocument}=await import('./data.js');const url=await uploadPublicDocument(file,input.dataset.village);const target=input.closest('form')?.querySelector(`[name="${input.dataset.target}"]`);if(!target)throw new Error('PDF uploaded but download field was not found; copy the returned link before leaving.');target.value=url;notif('PDF uploaded. Save and publish the form item to show the download on the website.');}
 finally{input.disabled=false;}
}
export async function imageUpload(input){
 const file=input.files?.[0];if(!file)return;
 input.disabled=true;
 try{const url=await uploadPublicImage(file,input.dataset.village,{preserveOriginal:['logo_url','nav_logo_url','footer_logo_url'].includes(input.dataset.target)||input.dataset.target==='services_payment_qr_url'||input.dataset.footerLogo==='true'});const target=input.closest('form')?.querySelector(`[name="${input.dataset.target}"]`);if(!target)throw new Error('Upload completed but the matching editor field is missing.');target.value=url;const editForm=input.closest('form');if(input.dataset.target==='hero_image_url'){const banner=editForm?.querySelector('[data-banner-photo]');if(banner)banner.src=url;}if(input.dataset.target==='image_url'){const preview=editForm?.querySelector('[data-record-photo]');if(preview){preview.src=url;preview.hidden=false;const empty=editForm.querySelector('[data-record-photo-empty]');if(empty)empty.hidden=true;}}if(editForm&&['homeForm','footerForm','navbarBrandingForm'].includes(editForm.id)){editForm.dataset.dirty='true';const saveHint=editForm.querySelector('.admin-save-hint');if(saveHint)saveHint.hidden=false;}if(input.dataset.footerLogo==='true'){const preview=input.closest('[data-logo-row]')?.querySelector('.admin-footer-logo-thumb');if(preview){preview.src=url;preview.hidden=false;}const placeholder=input.closest('[data-logo-row]')?.querySelector('.admin-footer-logo-placeholder');if(placeholder)placeholder.hidden=true;}else if(['logo_url','nav_logo_url'].includes(input.dataset.target)){const preview=input.closest('form')?.querySelector('.admin-logo-preview img,.admin-v43-logo-example img');if(preview)preview.src=url;}notif('Image uploaded. Click Save to apply it to the site.');}
 finally{input.disabled=false;}
}

export async function excelUpload(input){
 const file=input.files?.[0];if(!file)return;
 input.disabled=true;
 try{
  const {uploadBeneficiaryWorkbook}=await import('./data.js');
  const path=await uploadBeneficiaryWorkbook(file,input.dataset.village);
  const target=input.closest('form')?.querySelector('[name="file_path"]');
  if(!target)throw new Error('Workbook uploaded but its record field was not found.');
  target.value=path;
  const check=input.closest('form')?.querySelector('[name="public_file_approved"]');if(check)check.checked=false;
  notif('Private Excel uploaded. Save and publish the list after reviewing personal data.');
 }finally{input.disabled=false;}
}

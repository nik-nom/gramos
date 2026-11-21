from pathlib import Path
p=Path(__file__).parent

def change(path,old,new,n=1):
 s=(p/path).read_text(); assert old in s, f'NOT FOUND {path}: {old[:100]}'
 if n is None: s=s.replace(old,new)
 else: s=s.replace(old,new,n)
 (p/path).write_text(s)

# Reading/writing secure Supabase RPCs, with static UI not exposing credentials.
file=p/'src/data.js'
s=file.read_text()
s += '''

/** Site editing drafts are independent from the live public village record. */
export async function getSiteDraft(id){
 if(!api||!id)return null;
 return call(api.from('village_site_drafts').select('changes,revision,updated_at').eq('village_id',id).maybeSingle());
}
export async function saveSiteDraft(id,patch){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_save_site_draft',{p_village_id:id,p_patch:patch}));
}
export async function publishSiteDraft(id){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_publish_site_draft',{p_village_id:id}));
}
export async function discardSiteDraft(id){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_discard_site_draft',{p_village_id:id}));
}
export async function getPlatformBranding(){
 if(!api)return {footer_logos:[]};
 return await call(api.from('gramos_platform_branding').select('footer_logos').eq('id',1).maybeSingle()) || {footer_logos:[]};
}
export function withVillageDraft(v,changes){
 if(!v||!changes||typeof changes!=='object')return v;
 return {...v,...Object.fromEntries(Object.entries(changes).filter(([k])=>k!=='site_settings')),
   site_settings:{...(v.site_settings||{}),...(changes.site_settings||{})}};
}
export function withGlobalLogos(v,branding){
 const logos=branding?.footer_logos;
 return Array.isArray(logos)&&logos.length?{...v,site_settings:{...(v.site_settings||{}),footer_logos:logos,footer_logo_url:logos[0]}}:v;
}
export async function saveGlobalLogos(logos){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_set_platform_logos',{p_logos:logos}));
}
export async function uploadPlatformImage(file){
 if(!api||!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Upload a JPG, PNG or WebP image.');
 if(file.size>24*1024*1024)throw new Error('Choose an image smaller than 24 MB.');
 const f=await compressImage(file,{maxDimension:1440,quality:.88,preserveOriginal:true});
 if(f.size>4*1024*1024)throw new Error('Image exceeds 4 MB. Use a smaller file.');
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[f.type];
 const path=`platform/${crypto.randomUUID()}.${ext}`;
 const {error}=await api.storage.from('village-media').upload(path,f,{contentType:f.type,upsert:false});
 if(error)throw new Error(error.message);
 return storageUrl(path);
}
'''
file.write_text(s)

change('src/public.js',"import {publishedVillages,villageBySlug,itemsFor,publishedItemsFor,configured} from './data.js';", "import {publishedVillages,villageBySlug,itemsFor,publishedItemsFor,configured,getPlatformBranding,getSiteDraft,withVillageDraft,withGlobalLogos} from './data.js';")
change('src/public.js',"const items=preview?await itemsFor(v.id):await publishedItemsFor(v.id);return villagePage(v,items,lang,route.slice(2),preview,navLanguage);", "const items=preview?await itemsFor(v.id):await publishedItemsFor(v.id);const draft=preview?await getSiteDraft(v.id):null;const branded=withGlobalLogos(withVillageDraft(v,draft?.changes),await getPlatformBranding());return villagePage(branded,items,lang,route.slice(2),preview,navLanguage);")

change('src/admin.js',"import {api,configured,call,adminVillages,villageById,itemsFor,uploadPublicImage} from './data.js';", "import {api,configured,call,adminVillages,villageById,itemsFor,uploadPublicImage,getSiteDraft,saveSiteDraft,publishSiteDraft,discardSiteDraft,getPlatformBranding,saveGlobalLogos,uploadPlatformImage,withVillageDraft} from './data.js';")
# /admin/platform separate global editor
change('src/admin.js'," if(!vId)return `${adminHead(lang)}${await dashboard(lang,role,user)}`;", " if(!vId){if(route[1]==='branding')return `${adminHead(lang)}${await platformBrandingEditor(lang,role)}`;return `${adminHead(lang)}${await dashboard(lang,role,user)}`;}")
change('src/admin.js'," const items=reviewerOnly?[]:await itemsFor(vId);", " const items=reviewerOnly?[]:await itemsFor(vId);\n const draft=reviewerOnly?null:await getSiteDraft(vId);\n const working=withVillageDraft(village,draft?.changes);")
# remove cluttered sidebar, keep old collection routes inside editor disclosures.
start=' const sidebar=reviewerOnly?`<aside class="admin-sidebar"'
end=' const main=section===\'overview\'?'
s=(p/'src/admin.js').read_text(); a=s.index(start); b=s.index(end,a)
s=s[:a]+''' const groupedPages=[
  [tr(lang,'माहितीची पाने','Information pages'),[['about','ग्रामपंचायतीबद्दल','About'],['contact','संपर्क','Contact']]],
  [tr(lang,'नागरिक सेवा','Citizen services'),[['services','लोकसेवा','Services'],['schemes','शासकीय योजना','Schemes'],['content/beneficiary_lists','लाभार्थी','Beneficiaries']]],
  [tr(lang,'बातम्या आणि प्रगती','Updates and progress'),[['news','बातम्या','News'],['notices','सूचना','Notices'],['projects','विकासकामे','Projects'],['gallery','फोटो गॅलरी','Gallery']]]
 ];
 const sidebar=reviewerOnly?`<aside class="admin-sidebar admin-sidebar-v42"><a class="sidebar-back" href="/admin">← ${tr(lang,'माझी गावे','My villages')}</a><div class="sidebar-village"><h3>${esc(loc(village,'name',lang))}</h3></div><p class="sidebar-label">${tr(lang,'फक्त वाचन','READ ONLY')}</p><a class="selected" href="/admin/villages/${esc(vId)}/submissions">${icon('mail')} ${tr(lang,'नागरिक तक्रारी','Complaints')}</a></aside>`:
 `<aside class="admin-sidebar admin-sidebar-v42" aria-label="Village editor navigation">
 <a class="sidebar-back" href="/admin">← ${tr(lang,'सर्व गावे','All villages')}</a><div class="sidebar-village"><span class="eyebrow">${tr(lang,'संपादित करत आहात','EDITING VILLAGE')}</span><h3>${esc(loc(village,'name',lang))}</h3>${pill(village.status)}</div>
 <a class="admin-nav-primary ${section==='overview'?'selected':''}" href="/admin/villages/${esc(vId)}/overview">${icon('home')} ${tr(lang,'आढावा आणि पूर्वावलोकन','Overview & preview')}</a>
 <a class="admin-nav-primary ${section==='home'?'selected':''}" href="/admin/villages/${esc(vId)}/home">${icon('document')} ${tr(lang,'मुख्यपृष्ठ संपादित करा','Edit homepage')}</a>
 <p class="sidebar-label">${tr(lang,'पानानुसार संपादन','EDIT ONE PAGE AT A TIME')}</p>
 ${groupedPages.map(([group,entries])=>`<details class="admin-v42-nav-group" ${entries.some(([path])=>path===section || path===`${section}/${kind}`)?'open':''}><summary>${icon('chevron-down')} ${esc(group)}</summary><nav>${entries.map(([path,mr,en])=>`<a class="${path===section||path===`${section}/${kind}`?'selected':''}" href="/admin/villages/${esc(vId)}/${path}">${esc(tr(lang,mr,en))}</a>`).join('')}</nav></details>`).join('')}
 <p class="sidebar-label">${tr(lang,'एकाच ठिकाणी','SHARED SETTINGS')}</p>
 <a href="/admin/branding">${icon('image')} ${tr(lang,'सर्व गावांचे लोगो','Logos for all villages')}</a>
 <a href="/admin/villages/${esc(vId)}" class="${section==='settings'?'selected':''}">${icon('document')} ${tr(lang,'गावाची माहिती','Village information')}</a>
 <a href="/admin/villages/${esc(vId)}/seo" class="${section==='seo'?'selected':''}">${icon('document')} ${tr(lang,'Google शोध माहिती','Google & SEO')}</a>
 <p class="sidebar-label">${tr(lang,'कार्यालय','OFFICE')}</p>
 <a href="/admin/villages/${esc(vId)}/submissions" class="${section==='submissions'?'selected':''}">${icon('mail')} ${tr(lang,'नागरिक तक्रारी','Complaints')}</a>
 ${role.admin?`<a href="/admin/villages/${esc(vId)}/members" class="${section==='members'?'selected':''}">${icon('users')} ${tr(lang,'वापरकर्ता परवानग्या','Users & access')}</a>`:''}
 <a href="/v/${esc(village.slug)}?preview=1" target="_blank" rel="noopener noreferrer">${icon('arrow')} ${tr(lang,'पूर्ण संकेतस्थळ पहा','Open full website')} ↗</a>
 </aside>`;
''' +s[b:]
(p/'src/admin.js').write_text(s)
# editor data comes from working draft, overview live record + its draft info
change('src/admin.js',"section==='overview'?overviewEditor(village,lang):section==='home'?homeEditor(village,lang):section==='footer'?footerEditor(village,lang):section==='settings'?settings(village,lang):section==='seo'?seoEditor(village,lang):section==='about'?aboutEditor(village,lang):section==='services'?servicesEditor(village,lang):section==='projects'?projectsEditor(village,lang):section==='schemes'?schemesEditor(village,lang):section==='news'?newsEditor(village,lang):section==='gallery'?galleryEditor(village,lang):section==='contact'?contactEditor(village,lang):section==='notices'?noticesEditor(village,lang):", "section==='overview'?overviewEditor(village,lang,items,draft,role):section==='home'?homeEditor(working,lang):section==='footer'?footerEditor(working,lang):section==='settings'?settings(working,lang,role):section==='seo'?seoEditor(working,lang):section==='about'?aboutEditor(working,lang):section==='services'?servicesEditor(working,lang):section==='projects'?projectsEditor(working,lang):section==='schemes'?schemesEditor(working,lang):section==='news'?newsEditor(working,lang):section==='gallery'?galleryEditor(working,lang):section==='contact'?contactEditor(working,lang):section==='notices'?noticesEditor(working,lang):")
change('src/admin.js'," const addShortcut=target?`<div class=\"admin-add-element\"><a class=\"button-lite\" href=\"/admin/villages/${esc(vId)}/content/page_elements?page=${esc(target)}\">${icon('plus')} ${tr(lang,'या पानावर घटक जोडा','Add element to this page')}</a></div>`:'';", " const addShortcut=target?`<div class=\"admin-add-element\"><a class=\"button-lite\" href=\"/admin/villages/${esc(vId)}/content/page_elements?page=${esc(target)}\">${icon('plus')} ${tr(lang,'या पानावर घटक जोडा','Add element to this page')}</a></div>`:'';\n const tools=reviewerOnly?'':section==='content'?'':pageContentTools(vId,section,lang);")
change('src/admin.js','${main}${addShortcut}</main></div>`;', '${main}${tools}${addShortcut}</main></div>`;')
# status button admin settings, archive visible only to Super role
change('src/admin.js','function settings(v,lang){','function settings(v,lang,role){')
change('src/admin.js','<button class="button-danger" type="button" data-action="archive-site" data-id="${esc(v.id)}">${v.status===\'archived\'?tr(lang,\'मसुदा म्हणून पुनर्संचयित करा\',\'Restore draft\'):tr(lang,\'वेबसाइट संग्रहित करा\',\'Archive website\')}</button>', '${role?.admin?`<button class="button-danger" type="button" data-action="archive-site" data-id="${esc(v.id)}">${v.status===\'archived\'?tr(lang,\'मसुदा म्हणून पुनर्संचयित करा\',\'Restore draft\'):tr(lang,\'वेबसाइट संग्रहित करा\',\'Remove (archive) village\')}</button>`:\'\'}')
# Dashboard default preview of first village and selection with query ?site=; restrict super-only creation links.
change('src/admin.js'," const villages=await adminVillages(role);", " const villages=await adminVillages(role);\n const selection=new URLSearchParams(location.search).get('site');const chosen=villages.find(v=>v.id===selection)||villages[0];",1)
change('src/admin.js',"<div class=\"stats-row\">", "${role.admin?`<div class=\"admin-platform-bar\"><strong>Super Admin</strong><span>${tr(lang,'गावे, वापरकर्ते व सामायिक लोगो व्यवस्थापित करा','Manage villages, access and shared logos')}</span><a class=\"button-lite\" href=\"/admin/branding\">${tr(lang,'सामायिक लोगो','Shared logos')} →</a></div>`:''}<div class=\"stats-row\">",1)
# put iframe panel after dashboard grid. safe chosen when no villages.
change('src/admin.js','</aside></div></main>`;', "</aside></div>${chosen&&!(!role.admin&&!role.editorIds?.includes(chosen.id))?`<section class=\"admin-panel admin-dashboard-preview\"><div class=\"panel-heading\"><div><h2>${tr(lang,'गावाचा थेट आढावा','Village preview on dashboard')} — ${esc(loc(chosen,'name',lang))}</h2><p>${tr(lang,'वेगळे प्रिव्ह्यू उघडण्याची गरज नाही.','View it here without opening a new tab.')}</p></div><a class=\"button-lite\" href=\"/admin/villages/${esc(chosen.id)}/overview\">${tr(lang,'संपादन उघडा','Open editor')} →</a></div><iframe class=\"admin-dashboard-iframe\" src=\"/v/${esc(chosen.slug)}?preview=1\" title=\"Village preview\" loading=\"lazy\"></iframe></section>`:''}</main>`;",1)
# selection button in row; also viewer-only links
change('src/admin.js',"${pill(v.status)}<a class=\"button-lite\" href=\"/v/${esc(v.slug)}?preview=1\"", "${pill(v.status)}${role.admin||role.editorIds?.includes(v.id)?`<a class=\"button-lite\" href=\"/admin?site=${encodeURIComponent(v.id)}\">${tr(lang,'इथे पहा','Preview here')}</a>`:''}<a class=\"button-lite\" href=\"/v/${esc(v.slug)}?preview=1\"",1)
# Reviewer dashboard should only show complaints; current dashboard cards show public info; with account reviewer intended to only complaints (existing super etc)
change('src/admin.js',"${tr(lang,'व्यवस्थापित करा','Manage')} ${icon('arrow')}", "${!role.admin&&!role.editorIds?.includes(v.id)?tr(lang,'तक्रारी पहा','View complaints'):tr(lang,'संपादित करा','Edit')} ${icon('arrow')}",1)
# Show editable home as separate path already; make explicit role.
change('src/admin.js',"function overviewEditor(v,lang){", "function overviewEditor(v,lang,items=[],draft=null,role={admin:false}){")
change('src/admin.js'," const notice=String(ss.quote_mr||ss.quote_en||'').trim();", " const notice=String(ss.quote_mr||ss.quote_en||'').trim();const pending=items.filter(x=>x.status==='draft').length;")
change('src/admin.js'," <div class=\"admin-overview-metrics\">", " <section class=\"admin-panel admin-v42-publishing\"><div><span class=\"eyebrow\">${tr(lang,'प्रकाशन केंद्र','PUBLISHING DESK')}</span><h2>${tr(lang,'मसुदे व प्रकाशित वेबसाइट','Drafts & website publishing')}</h2><p>${draft?tr(lang,'जतन केलेले बदल आहेत. प्रकाशित करण्यापूर्वी प्रिव्ह्यू तपासा.','You have saved draft changes. Preview them before publishing.') :tr(lang,'मुख्यपृष्ठ व गावाचे तपशील स्वतंत्र मसुद्यात जतन करता येतात.','Save edits as drafts, then publish when ready.')}</p><div class=\"admin-draft-pill\">${draft?`<strong>${tr(lang,'मसुदा जतन केला','Draft saved')}</strong> · ${esc(new Date(draft.updated_at).toLocaleString())}`:tr(lang,'वेबसाइट मसुदा नाही','No website draft')} · ${pending} ${tr(lang,'सामग्री मसुदे','content drafts')}</div></div><div class=\"admin-v42-publish-actions\">${draft?`<button type=\"button\" class=\"btn btn-dark\" data-action=\"publish-site-draft\">${tr(lang,'जतन केलेले बदल प्रकाशित करा','Publish saved changes')}</button><button type=\"button\" class=\"button-lite\" data-action=\"discard-site-draft\">${tr(lang,'मसुदा टाका','Discard draft')}</button>`:''}<button type=\"button\" class=\"button-lite\" data-action=\"site-status\" data-id=\"${esc(v.id)}\" data-next=\"${v.status==='published'?'draft':'published'}\">${v.status==='published'?tr(lang,'वेबसाइट अप्रकाशित करा','Unpublish website'):tr(lang,'वेबसाइट प्रकाशित करा','Publish website')}</button>${role.admin?`<button type=\"button\" class=\"button-danger\" data-action=\"archive-site\" data-id=\"${esc(v.id)}\">${tr(lang,'गाव काढा (संग्रह)','Remove village (archive)')}</button>`:''}</div></section>\n <div class=\"admin-overview-metrics\">",1)
change('src/admin.js',"<div class=\"admin-overview-grid\">", "<div class=\"admin-overview-grid\">",1)
# overview link to global branding, not old footer panel
change('src/admin.js',"['footer','तळाचे लोगो व फूटर','Logos & footer','१२ लोगो आणि संपर्क लिंक','12 logos & footer links']", "['/admin/branding','सामायिक लोगो','Shared branding','सर्व गावांवर समान १२ लोगो','Same 12 logos across villages']")
change('src/admin.js',"href=\"/admin/villages/${esc(v.id)}/${path}\"", "href=\"${path.startsWith('/')?path:`/admin/villages/${esc(v.id)}/${path}`}\"",1)
# home and village details draft save buttons
change('src/admin.js',"<button type=\"submit\" class=\"btn btn-dark\">${icon('check')} ${tr(lang,'मुख्यपृष्ठ सेव्ह करा','Save homepage')}</button>", "<button type=\"submit\" value=\"draft\" data-save-mode=\"draft\" class=\"btn btn-dark\">${icon('check')} ${tr(lang,'मसुदा जतन करा','Save draft')}</button><button type=\"submit\" value=\"publish\" data-save-mode=\"publish\" class=\"button-lite\">${tr(lang,'थेट वेबसाइटवर लागू करा','Save & publish now')}</button>")
# village settings direct-save plus draft
change('src/admin.js',"<button class=\"btn btn-dark\" type=\"submit\">${icon('check')} ${tr(lang,'गावाची माहिती सेव्ह करा','Save village information')}</button>", "<button class=\"btn btn-dark\" type=\"submit\" value=\"draft\" data-save-mode=\"draft\">${icon('check')} ${tr(lang,'मसुदा जतन करा','Save draft')}</button><button class=\"button-lite\" type=\"submit\" value=\"publish\" data-save-mode=\"publish\">${tr(lang,'आत्ताच प्रकाशित करा','Save & publish now')}</button>")
# editor footer is legacy, not public global changes; label prominently
change('src/admin.js',"<form id=\"footerForm\" data-id=\"${esc(v.id)}\">", "<div class=\"admin-blue-note\"><strong>${tr(lang,'सर्व गावांसाठी समान लोगो','All villages share one logo set')}</strong><p>${tr(lang,'सामायिक लोगो एका जागी बदला. येथील जुने गावाचे फूटर फील्ड मागील आवृत्तीसाठी आहेत.','Change common logos once in Shared branding. Legacy village footer fields remain available for compatibility.')}</p><a class=\"button-lite\" href=\"/admin/branding\">${tr(lang,'सामायिक लोगो व्यवस्थापित करा','Edit shared logos')} →</a></div><form id=\"footerForm\" data-id=\"${esc(v.id)}\">",1)
# Form save mode function: handle home/footer/settings as draft RPC or live persist and optionally publish pending drafts
change('src/admin.js',"const fd=new FormData(form); const get=k=>String(fd.get(k)||'').trim();", "const fd=new FormData(form); const get=k=>String(fd.get(k)||'').trim();\n const asDraft=form.dataset.saveMode==='draft';")
change('src/admin.js',"const rows=await call(api.from('villages').update(payload).eq('id',form.dataset.id).select('id'));\n   if(!rows?.length)throw new Error('Homepage could not be saved.');notif('Homepage saved');rerender();return;", "if(asDraft){await saveSiteDraft(form.dataset.id,payload);notif('Homepage draft saved. Publish it from Overview.');rerender();return;}\n   const rows=await call(api.from('villages').update(payload).eq('id',form.dataset.id).select('id'));\n   if(!rows?.length)throw new Error('Homepage could not be saved.');notif('Homepage published');rerender();return;")
change('src/admin.js',"const rows=await call(api.from('villages').update(payload).eq('id',form.dataset.id).select('id'));\n   if(!rows?.length)throw new Error('Village settings could not be saved.');notif('Village information saved');rerender();return;", "if(asDraft){await saveSiteDraft(form.dataset.id,payload);notif('Village information draft saved. Publish it from Overview.');rerender();return;}\n   const rows=await call(api.from('villages').update(payload).eq('id',form.dataset.id).select('id'));\n   if(!rows?.length)throw new Error('Village settings could not be saved.');notif('Village information published');rerender();return;")
# rights super exclusively
change('src/admin.js'," if(action==='archive-site'){", " if(action==='archive-site'){\n   if(!role.admin)throw new Error('Only Super Admin can remove or restore a village.');")
# save/publish site draft workflow
change('src/admin.js'," if(action==='refresh-inbox'){rerender();return true;}", " if(action==='refresh-inbox'){rerender();return true;}\n if(action==='publish-site-draft'){const v=route[2];if(!v)throw new Error('Select a village');if(!confirm('Publish your saved homepage and site settings changes?'))return true;await publishSiteDraft(v);notif('Saved draft published');rerender();return true;}\n if(action==='discard-site-draft'){const v=route[2];if(!v)throw new Error('Select a village');if(!confirm('Discard all saved website setting drafts? Your published site stays unchanged.'))return true;await discardSiteDraft(v);notif('Site setting draft discarded');rerender();return true;}")
# public editor content-group links, visible only after click
idx=(p/'src/admin.js').read_text().index('async function dashboard(')
s=(p/'src/admin.js').read_text()
insert='''
function pageContentTools(vId,section,lang){
 const map={
  home:['banners','metrics','leaders','officials','facilities','videos'],
  about:['about_facts','committee_groups','committees','about_facilities','duties','about_blocks','about_sections'],
  services:['services','service_steps','service_forms','service_links'],
  schemes:['schemes','beneficiary_lists'],projects:['projects'],
  news:['news'],notices:['notices'],gallery:['gallery','videos'],contact:[]};
 const entries=map[section];if(!entries?.length)return '';
 return `<details class="admin-panel admin-v42-page-content"><summary><strong>${tr(lang,'या पानावरील फोटो आणि नोंदी','Manage this page’s photos & records')}</strong><span>${tr(lang,'फक्त गरज असेल तेव्हाच उघडा','Open only when needed')}</span></summary><div class="admin-v42-content-links">${entries.map(kind=>`<a class="button-lite" href="/admin/villages/${esc(vId)}/content/${kind}">${esc(label(lang,kind))} →</a>`).join('')}</div></details>`;
}
async function platformBrandingEditor(lang,role){
 const shared=await getPlatformBranding();
 const saved=Array.isArray(shared.footer_logos)?shared.footer_logos.filter(imageURL).slice(0,12):[];
 return `<main class="admin-shell container admin-branding-screen"><div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'संपूर्ण प्लॅटफॉर्म','PLATFORM SETTINGS')}</p><h1>${tr(lang,'सर्व गावांसाठी सामायिक लोगो','Shared logos for every village')}</h1><p>${tr(lang,'हे १२ लोगो एकदाच अपलोड करा. सर्व गावांच्या प्रत्येक पानावर तेच लोगो दिसतील.','Upload up to 12 logos once. The same logos appear on all pages of every village.')}</p></div><a class="button-lite" href="/admin">← ${tr(lang,'गावांचा आढावा','Dashboard')}</a></div>
 ${role.admin?`<form id="platformBrandingForm"><section class="admin-panel form-panel"><div class="panel-heading"><h2>${tr(lang,'सामायिक लोगो (कमाल १२)','Global logos (maximum 12)')}</h2><span class="admin-logo-count">${saved.length} / 12</span></div><div id="footerLogoList" class="admin-footer-logo-list">${Array.from({length:12},(_,i)=>footerLogoRow({id:'platform'},lang,i,saved[i]||'',i<Math.max(saved.length,1)).replace(/data-village="platform"/g,'data-platform-logo="true"')).join('')}</div><div class="upload-row"><button class="button-lite" type="button" data-action="footer-logo-add">${icon('plus')} ${tr(lang,'लोगो जोडा','Add logo')}</button></div><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'सर्व गावांसाठी लोगो जतन करा','Save for all villages')}</button><span class="admin-save-hint" hidden>${tr(lang,'सेव्ह न केलेले बदल','Unsaved changes')}</span></div></section></form>`:
 `<section class="admin-panel"><h2>${tr(lang,'वाचनासाठी उपलब्ध','View only')}</h2><p>${tr(lang,'सामायिक लोगो फक्त मुख्य प्रशासक बदलू शकतो.','Only Super Admin can change global logos.')}</p><div class="admin-v42-branding-read">${saved.map(x=>`<img src="${esc(x)}" alt="" loading="lazy">`).join('')}</div></section>`}
 <div class="admin-blue-note"><strong>${tr(lang,'इतर फूटर माहिती','Other footer text')}</strong><p>${tr(lang,'कंपनीचा कॉपीराइट, वर्ष २०२६, जालना व मोबाईल नंबर सर्व वेबसाइटसाठी कोडमध्ये निश्चित आहेत. गावाचा स्थानिक संपर्क गावाच्या माहितीमध्ये राहील.','Copyright © 2026, company name, Jalna and two telephone numbers are hardcoded globally; each village’s own contact details remain separate.')}</p></div></main>`;
}
'''
s=s[:s.index('async function dashboard(')]+insert+s[s.index('async function dashboard('):]
(p/'src/admin.js').write_text(s)
# Global branding form support with permission checks, uploads, shared access.
change('src/admin.js',"if(form.id!=='loginForm' && form.id!=='createVillageForm' && !role.admin && !role.editorIds?.includes(form.dataset.id))", "if(form.id!=='loginForm' && form.id!=='createVillageForm' && form.id!=='platformBrandingForm' && !role.admin && !role.editorIds?.includes(form.dataset.id))")
change('src/admin.js'," if(form.id==='staffAccessForm'){", " if(form.id==='platformBrandingForm'){\n  if(!role.admin)throw new Error('Only Super Admin can edit global logos.');\n  const urls=[...form.querySelectorAll('#footerLogoList [data-logo-row]:not([hidden]) input[name^=\"footer_logo_\"]')].map(el=>el.value.trim()).filter(Boolean);\n  if(urls.length>12||urls.some(u=>!imageURL(u)))throw new Error('Provide up to 12 valid HTTPS image URLs.');\n  await saveGlobalLogos(urls);notif('Shared logos updated for every village');rerender();return;\n }\n if(form.id==='staffAccessForm'){")
change('src/admin.js'," if(!role.admin && !role.editorIds?.includes(route[2]) && action!=='view-attachment')", " if(!role.admin && !role.editorIds?.includes(route[2]) && action!=='view-attachment')")
# platform owner can adjust logo arrows; for editor not with a village id and not super.
change('src/admin.js',"if(form.id==='footerForm')", "if(form.id==='footerForm'||form.id==='platformBrandingForm')") if False else None
# support upload platform in handler: data-image-input special, use uploadPlatformImage
change('src/admin.js',"const url=await uploadPublicImage(file,input.dataset.village,{preserveOriginal:","const url=input.dataset.platformLogo==='true'?await uploadPlatformImage(file):await uploadPublicImage(file,input.dataset.village,{preserveOriginal:")
# replaced expression with parentheses? original ends `...});` --> conditional closes after; JS precedence valid? ternary starts before other call and ends `});` good.
change('src/admin.js',"['homeForm','footerForm'].includes(editForm.id)", "['homeForm','footerForm','platformBrandingForm'].includes(editForm.id)")
# name and label for staff editor/reviewer; super only gate already.
change('src/admin.js',"Staff access / कर्मचारी प्रवेश", "Users & permissions / वापरकर्ता परवानग्या")
change('src/admin.js',"<option value=\"reviewer\">Complaint reviewer — read-only inbox</option><option value=\"editor\">Village editor — content + inbox</option>", "<option value=\"reviewer\">User — view complaints only</option><option value=\"editor\">Admin — edit village and view complaints; no users or village removal</option>")
# Ensure user only sees complaint data in role reader view; don't expose viewer in other UI
file=p/'src/main.js';s=file.read_text()
s=s.replace("['homeForm','footerForm','seoSettingsForm'", "['platformBrandingForm','homeForm','footerForm','seoSettingsForm'")
s=s.replace("if(button?.disabled)return;", "if(button?.disabled)return;\n form.dataset.saveMode=e.submitter?.dataset.saveMode||'publish';")
s=s.replace("if(!form||!['homeForm','footerForm'].includes(form.id))return;", "if(!form||!['homeForm','footerForm','platformBrandingForm','settingsForm'].includes(form.id))return;")
s=s.replace("if(form.id==='footerForm' && e.target.matches('input[name^=\"footer_logo_\"]'))", "if(['footerForm','platformBrandingForm'].includes(form.id) && e.target.matches('input[name^=\"footer_logo_\"]'))")
file.write_text(s)
print('v4.2 patch complete')

from pathlib import Path
root=Path('/mnt/data/gramos_v41_work')
p=root/'src/admin.js';s=p.read_text()
def repl(old,new):
 global s
 n=s.count(old)
 if n!=1: raise RuntimeError(f'found {n}: {old[:95]}')
 s=s.replace(old,new)

# reduce menu clutter while preserving every editor link
start=s.index(' <p class="sidebar-label">${tr(lang,\'पाने संपादित करा\'')
end=s.index(' <p class="sidebar-label">${tr(lang,\'संपूर्ण वेबसाइट\'')
old=s[start:end]
new=''' <p class="sidebar-label">${tr(lang,'वेबसाइट संपादित करा','WEBSITE EDITOR')}</p>
 <a href="/admin/villages/${esc(vId)}/overview" class="${section==='overview'?'selected':''}">${icon('document')} ${tr(lang,'कामाची सुरुवात','Workspace overview')}</a>
 ${pageNav.filter(([path])=>['home','about','contact'].includes(path)).map(([path,text,sectionId])=>`<a href="/admin/villages/${esc(vId)}/${path}" class="${section===sectionId?'selected':''}">${icon('document')} ${esc(text)}</a>`).join('')}
 <details class="admin-extra-menu admin-pages-menu" ${pageNav.some(([path,_,id])=>!['home','about','contact'].includes(path) && section===id && (section!=='content'||kind==='beneficiary_lists'))?'open':''}><summary>${icon('document')} ${tr(lang,'इतर वेबसाइट पाने','Other website pages')}</summary><p>${tr(lang,'संपादित करायचे पान निवडा','Select the page you want to edit.')}</p><div class="admin-extra-category">${pageNav.filter(([path])=>!['home','about','contact'].includes(path)).map(([path,text,sectionId])=>`<a href="/admin/villages/${esc(vId)}/${path}" class="${section===sectionId&&(section!=='content'||kind==='beneficiary_lists')?'selected':''}">${esc(text)}</a>`).join('')}</div></details>
'''
s=s[:start]+new+s[end:]

# new focused overview screen; no new state, reads village settings from existing Supabase
idx=s.index('function previewPanel(v,lang,path=\'\'){')
overview='''function overviewEditor(v,lang){
 const ss=v.site_settings||{};
 const logos=Array.isArray(ss.footer_logos)?ss.footer_logos.filter(imageURL).length:(imageURL(ss.footer_logo_url)?1:0);
 const notice=String(ss.quote_mr||ss.quote_en||'').trim();
 const routes=[
  ['home','मुख्यपृष्ठ','Home page','बॅनर, स्वागत आणि धावती सूचना','Banner, welcome & scrolling message'],
  ['about','ग्रामपंचायतीबद्दल','About','गावाची माहिती आणि पदाधिकारी','Village information & officials'],
  ['services','लोकसेवा','Services','सेवा आणि फॉर्म','Services & forms'],
  ['projects','विकासकामे','Projects','कामे व प्रगती','Projects & progress'],
  ['schemes','योजना','Schemes','योजना व लाभार्थी','Schemes & beneficiaries'],
  ['news','बातम्या','News','बातम्या व लेख','News & articles'],
  ['gallery','फोटो गॅलरी','Gallery','फोटो व व्हिडिओ','Photos & videos'],
  ['contact','संपर्क','Contact','नकाशा व समाजमाध्यमे','Map & social media'],
  ['notices','सूचना','Notices','सूचना व PDF','Notices & PDF'],
  ['footer','तळाचे लोगो व फूटर','Logos & footer','१२ लोगो आणि संपर्क लिंक','12 logos & footer links']
 ];
 return `<div class="admin-page-top"><div><p class="eyebrow">${tr(lang,'व्यवस्थापन / सुरुवात','MANAGE / START HERE')}</p><h1>${tr(lang,'वेबसाइट संपादन केंद्र','Website editing workspace')}</h1><p>${tr(lang,'एकावेळी एकच पान निवडा. बाकी सर्व सेटिंग्ज आणि माहिती जशी आहे तशीच राहील.','Choose one area at a time. Your existing settings and village content remain unchanged.')}</p></div><a class="button-lite" href="/v/${esc(v.slug)}?preview=1" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्ण वेबसाइट पहा','Open website')} ↗</a></div>
 <div class="admin-overview-metrics"><div><span>${tr(lang,'वेबसाइट स्थिती','Website status')}</span><strong>${esc(v.status)}</strong></div><div><span>${tr(lang,'तळाचे लोगो','Bottom logos')}</span><strong>${logos} / 12</strong></div><div><span>${tr(lang,'धावती सूचना','Scrolling message')}</span><strong>${notice?tr(lang,'सेट केली आहे','Configured'):tr(lang,'अद्याप जोडलेली नाही','Not set')}</strong></div></div>
 <div class="admin-overview-head"><h2>${tr(lang,'काय बदलायचे आहे?','What do you want to edit?')}</h2><p>${tr(lang,'खालील प्रत्येक कार्ड संबंधित पानाच्या संपादकाकडे घेऊन जाते.','Each card opens the editor for that part of the website.')}</p></div>
 <div class="admin-overview-grid">${routes.map(([path,mr,en,descMr,descEn])=>`<a class="admin-overview-card" href="/admin/villages/${esc(v.id)}/${path}"><span class="admin-overview-icon">${icon('document')}</span><strong>${esc(tr(lang,mr,en))}</strong><small>${esc(tr(lang,descMr,descEn))}</small><span class="admin-overview-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
 <section class="admin-panel admin-overview-note"><div class="panel-heading"><h2>${tr(lang,'धावती सूचना — सर्व पानांवर एकच','One announcement across all pages')}</h2></div><p>${esc(notice||tr(lang,'मुख्यपृष्ठामध्ये संदेश जोडा.','Add a message in the homepage editor.'))}</p><a class="button-lite" href="/admin/villages/${esc(v.id)}/home">${tr(lang,'धावती सूचना संपादित करा','Edit announcement')} →</a></section>
 ${previewPanel(v,lang)}`;
}

'''
s=s[:idx]+overview+s[idx:]
repl("const main=section==='home'?homeEditor(village,lang):", "const main=section==='overview'?overviewEditor(village,lang):section==='home'?homeEditor(village,lang):")
# Add refresh preview button
repl('''</p></div><a class="button-lite" href="${url}" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्ण पान उघडा','Open full page')} ↗</a></div><div class="admin-preview-frame">''',
'''</p></div><div class="admin-preview-tools"><button class="button-lite" type="button" data-action="preview-refresh">${tr(lang,'पुन्हा लोड करा','Refresh preview')}</button><a class="button-lite" href="${url}" target="_blank" rel="noopener noreferrer">${tr(lang,'पूर्ण पान उघडा','Open full page')} ↗</a></div></div><div class="admin-preview-frame">''')
# Footer logo preview is empty if no uploaded image (never village emblems/names as placeholders).
old='''<img class="admin-footer-logo-thumb" alt="Logo preview" src="${esc(imageURL(url)||'/assets/gp-mark.svg')}" loading="lazy"><div class="admin-footer-logo-fields">'''
new='''<div class="admin-footer-logo-thumb-wrap"><img class="admin-footer-logo-thumb" alt="${tr(lang,'अपलोड केलेला लोगो','Uploaded logo')}" src="${esc(imageURL(url)||'/assets/mark.svg')}" ${imageURL(url)?'':'hidden'} loading="lazy"><span class="admin-footer-logo-placeholder" ${imageURL(url)?'hidden':''}>${tr(lang,'लोगो निवडा','Choose a logo')}</span></div><div class="admin-footer-logo-fields">'''
repl(old,new)
# save state for form (DOM events toggle this when user types)
repl('''${icon('check')} ${tr(lang,'मुख्यपृष्ठ सेव्ह करा','Save homepage')}</button></div></form>''', '''${icon('check')} ${tr(lang,'मुख्यपृष्ठ सेव्ह करा','Save homepage')}</button><span class="admin-save-hint" hidden>${tr(lang,'सेव्ह न केलेले बदल','Unsaved changes')}</span></div></form>''')
repl('''${icon('check')} ${tr(lang,'लोगो आणि फूटर सेव्ह करा','Save logos & footer')}</button></div></form>''', '''${icon('check')} ${tr(lang,'लोगो आणि फूटर सेव्ह करा','Save logos & footer')}</button><span class="admin-save-hint" hidden>${tr(lang,'सेव्ह न केलेले बदल','Unsaved changes')}</span></div></form>''')
# make save count reflect actual count, on remove images get cleared, and preview refresh works
repl(" if(action==='refresh-inbox'){rerender();return true;}", " if(action==='preview-refresh'){const frame=document.querySelector('.admin-preview-wide iframe');if(frame){frame.src=frame.getAttribute('src');notif('Website preview refreshed');}return true;}\n if(action==='refresh-inbox'){rerender();return true;}")
repl("     row.querySelector('img').src='/assets/gp-mark.svg';row.hidden=true;", "     const thumb=row.querySelector('.admin-footer-logo-thumb');if(thumb){thumb.hidden=true;thumb.src='/assets/mark.svg';}const placeholder=row.querySelector('.admin-footer-logo-placeholder');if(placeholder)placeholder.hidden=false;row.hidden=true;")
# auto badge shows actual logo count only (not empty rows) after user adds blank slots
repl("   const count=list.querySelectorAll('[data-logo-row]:not([hidden])').length;", "   const count=[...list.querySelectorAll('[data-logo-row]:not([hidden]) input[name^=\"footer_logo_\"]')].filter(input=>input.value.trim()).length;")
# mark full page logo upload instantly
repl("if(input.dataset.footerLogo==='true'){const preview=input.closest('[data-logo-row]')?.querySelector('.admin-footer-logo-thumb');if(preview)preview.src=url;}", "if(input.dataset.footerLogo==='true'){const preview=input.closest('[data-logo-row]')?.querySelector('.admin-footer-logo-thumb');if(preview){preview.src=url;preview.hidden=false;}const placeholder=input.closest('[data-logo-row]')?.querySelector('.admin-footer-logo-placeholder');if(placeholder)placeholder.hidden=true;}")
# drop accidentally forced display of footer headings from old fields by preserving everything else; footer legal stays runtime fixed
p.write_text(s)

p=root/'src/main.js';s=p.read_text()
needle="app.addEventListener('change',async e=>{"
insert='''// No hidden background saving: make it obvious which changes still need Save.
app.addEventListener('input',e=>{
 const form=e.target.closest?.('form');
 if(!form||!['homeForm','footerForm'].includes(form.id))return;
 form.dataset.dirty='true';
 const hint=form.querySelector('.admin-save-hint');if(hint)hint.hidden=false;
 if(form.id==='footerForm' && e.target.matches('input[name^="footer_logo_"]')){
   const row=e.target.closest('[data-logo-row]');
   const thumb=row?.querySelector('.admin-footer-logo-thumb');
   const placeholder=row?.querySelector('.admin-footer-logo-placeholder');
   if(thumb){const url=e.target.value.trim();let valid=false;try{const parsed=new URL(url);valid=parsed.protocol==='https:';}catch{}if(valid){thumb.src=url;thumb.hidden=false;}else{thumb.hidden=true;}if(placeholder)placeholder.hidden=valid;}
 }
});

'''
if s.count(needle)!=1: raise RuntimeError('main change event not found')
s=s.replace(needle,insert+needle)
p.write_text(s)
print('patched overview, grouped sidebar, logo preview, preview refresh, unsaved hint')

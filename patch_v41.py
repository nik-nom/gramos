from pathlib import Path
root=Path('/mnt/data/gramos_v41_work')
def modify(rel, replacements):
 p=root/rel; s=p.read_text();
 for old,new in replacements:
  n=s.count(old)
  if n!=1: raise RuntimeError(f'{rel}: {n} occurrences of {old[:70]!r}')
  s=s.replace(old,new)
 p.write_text(s)

(root/'src/branding.js').write_text('''/** Fixed legal footer for the GramOS platform. This is not village content. */
export const PLATFORM_LEGAL = Object.freeze({
  company: 'Swaraj Gram Soft and Software Private Limited',
  location: 'Jalna',
  numbers: Object.freeze(['9923227879', '9423227879']),
  year: 2026
});
export const MARATHI_SOCIAL_HEADING = 'समाजमाध्यमे';
export function platformLegalNotice() {
  return `Copyright © ${PLATFORM_LEGAL.year} · ${PLATFORM_LEGAL.company}™ · ${PLATFORM_LEGAL.location} · ${PLATFORM_LEGAL.numbers.join(' / ')}`;
}
''')

modify('src/homepage.js', [
 ("import {socialUrl,SOCIAL_FIELDS} from './social.js';", "import {socialUrl,SOCIAL_FIELDS} from './social.js';\nimport {MARATHI_SOCIAL_HEADING,platformLegalNotice} from './branding.js';"),
 (" // The new list is explicit: an empty list means use the village emblem.\n // The legacy footer_logo_url remains supported for existing villages.", " // Only uploaded bottom logos belong in this strip. Never insert the village\n // name, emblem or other village's image as a placeholder on a real site.\n // The legacy footer_logo_url remains supported for existing villages."),
 (" const logos=urls.length?urls:[imageURL(v.logo_url)||'/assets/gp-mark.svg'];\n return `<section class=\"sv-page-logo-band\" aria-label=\"${esc(tr(l,'ग्रामपंचायत चिन्ह','Village emblems'))}\"><div class=\"sv-wrap sv-page-logo-inner\"><div class=\"sv-page-logo-grid\" data-logo-count=\"${logos.length}\">${logos.map((url,index)=>`<a href=\"${linkFor(v,'home')}\" aria-label=\"${esc(tr(l,'मुखपृष्ठ','Homepage'))} · ${index+1}\">${img(url,`class=\"sv-page-logo\" alt=\"${esc(loc(v,'name',l))} · ${index+1}\" width=\"90\" height=\"90\"`)}</a>`).join('')}</div></div></section>`;",
  " const logos=urls.length?urls:(v.id==='demo'?[imageURL(v.logo_url)].filter(Boolean):[]);\n if(!logos.length)return '';\n return `<section class=\"sv-page-logo-band\" aria-label=\"${esc(tr(l,'संस्थांचे लोगो','Organization logos'))}\"><div class=\"sv-wrap sv-page-logo-inner\"><div class=\"sv-page-logo-grid\" data-logo-count=\"${logos.length}\">${logos.map((url,index)=>`<a href=\"${linkFor(v,'home')}\" aria-label=\"${esc(tr(l,'लोगो','Logo'))} ${index+1}\">${img(url,`class=\"sv-page-logo\" alt=\"${esc(tr(l,'संस्थेचा लोगो','Organization logo'))} ${index+1}\" width=\"90\" height=\"90\"`)}</a>`).join('')}</div></div></section>`;"),
 (" if(l==='mr' && (!raw || ['Social Media','समाज माध्यमे','सामाजिक माध्यमे'].includes(raw)))return 'सोशल मीडिया';", " if(l==='mr')return MARATHI_SOCIAL_HEADING;"),
 (" const configured=String(v.site_settings?.[`copyright_${l}`]||'').trim();\n const fallback=tr(l,`© ${new Date().getFullYear()} · हे ग्रामपंचायतीचे अधिकृत संकेतस्थळ आहे.`,`© ${new Date().getFullYear()} · Official Gram Panchayat website.`);\n const credit=String(v.site_settings?.[`credit_${l}`]||'').trim();\n return {notice:configured||fallback,credit};",
 " // This legal imprint is platform-owned and intentionally cannot be changed\n // by village settings, drafts or the language selector.\n return {notice:platformLegalNotice(),credit:''};"),
 (" const socialBody=l==='mr' && ['ग्रामपंचायत कार्यालयाची अधिकृत समाज माध्यमे','ग्रामपंचायत कार्यालयाची अधिकृत सामाजिक माध्यमे'].includes(socialBodySaved.trim())\n   ? 'ग्रामपंचायतीची अधिकृत सोशल मीडिया खाती'\n   : socialBodySaved||tr(l,'ग्रामपंचायतीची अधिकृत सोशल मीडिया खाती','Official social media of the village office');",
 " const socialBody=l==='mr'\n   ? 'ग्रामपंचायतीची अधिकृत समाजमाध्यम खाती'\n   : socialBodySaved||'Official social media of the village office';"),
])

modify('src/contact.js', [
 ("import {socialUrl} from './social.js';", "import {socialUrl} from './social.js';\nimport {MARATHI_SOCIAL_HEADING} from './branding.js';"),
 (" const socialLabel=l==='mr' && (!rawSocial || ['समाज माध्यमे','सामाजिक माध्यमे','Social Media'].includes(rawSocial))?'सोशल मीडिया':rawSocial|| (l==='mr'?'सोशल मीडिया':'Social Media');", " const socialLabel=l==='mr'?MARATHI_SOCIAL_HEADING:(rawSocial||'Social Media');"),
 ("सध्या अधिकृत सोशल मीडिया लिंक उपलब्ध नाहीत.","सध्या अधिकृत समाजमाध्यमांच्या लिंक उपलब्ध नाहीत."),
 ("सध्या कोणतीही सोशल मीडिया लिंक उपलब्ध नाही.","सध्या कोणतीही समाजमाध्यम लिंक उपलब्ध नाही."),
])

modify('src/admin.js', [
 ("import {SOCIAL_FIELDS,validateSocialSettings} from './social.js';", "import {SOCIAL_FIELDS,validateSocialSettings} from './social.js';\nimport {platformLegalNotice} from './branding.js';"),
 ("  ['footer_social_heading_mr','सोशल मीडिया — Footer heading (Marathi)'],", "  // Marathi label and the legal imprint are platform-owned, not per-village fields."),
 ("  ...['copyright','credit'].flatMap(k=>[\n   [`${k}_mr`,`${k==='copyright'?'© Copyright / official notice':'Design / maintenance credit'} — Marathi`,'textarea'],\n   [`${k}_en`,`${k==='copyright'?'© Copyright / official notice':'Design / maintenance credit'} — English`,'textarea']]),\n", ""),
 (" const extra=['footer_social_heading_mr','footer_social_heading_en','copyright_mr','copyright_en','credit_mr','credit_en','footer_social_body_mr','footer_social_body_en','footer_links_heading_mr','footer_links_heading_en','footer_pages_heading_mr','footer_pages_heading_en','footer_contact_heading_mr','footer_contact_heading_en','footer_pages_mr','footer_pages_en'];", ""),
 (" const labels=Object.fromEntries((extraSiteGroups.find(([group])=>group.startsWith('FOOTER /'))?.[1]||[]).map(([key,title,type])=>[key,[title,type]]));", ""),
 (" <section class=\"admin-panel form-panel\"><div class=\"panel-heading\"><h2>3. ${tr(lang,'फूटर मजकूर व कॉपीराइट','Footer text & copyright')}</h2></div>${editGroup(v,lang,tr(lang,'फूटर मजकूर संपादित करा','Edit footer headings and legal text'),'FOOTER /')}</section>",
  " <section class=\"admin-panel form-panel\"><div class=\"panel-heading\"><h2>3. ${tr(lang,'फूटर मजकूर','Footer headings & links')}</h2></div>${editGroup(v,lang,tr(lang,'इतर फूटर शीर्षके बदला','Edit optional footer labels'),'FOOTER /')}</section>\n <section class=\"admin-panel admin-legal-fixed\"><div class=\"panel-heading\"><h2>${tr(lang,'कायमस्वरूपी कॉपीराइट','Fixed company copyright')}</h2></div><p>${esc(platformLegalNotice())}</p><small>${tr(lang,'हा मजकूर सर्व गावांच्या सर्व पानांवर सारखाच आहे. ॲडमिनमधून बदलता येत नाही.','This line is identical on every village page and cannot be edited from the admin.')}</small></section>"),
 (" const legacyKeys=['quote_mr','quote_en','office_hours_mr','office_hours_en','facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url','footer_logo_url','links_mr','links_en',...extraSiteKeys];", " const legacyKeys=['quote_mr','quote_en','office_hours_mr','office_hours_en','facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url','footer_logo_url','links_mr','links_en',...extraSiteKeys];"),
])
# Explicit remove the legal keys from legacy settings save, including forms built by old deployments.
p=root/'src/admin.js';s=p.read_text();s=s.replace("payload.site_settings={...(existing.site_settings||{}),...Object.fromEntries(legacyKeys.filter(k=>Object.hasOwn(form.fields,k)).map(k=>[k,get(k)]))};", "payload.site_settings={...(existing.site_settings||{}),...Object.fromEntries(legacyKeys.filter(k=>Object.hasOwn(form.fields,k)&&!['copyright_mr','copyright_en','credit_mr','credit_en'].includes(k)).map(k=>[k,get(k)]))};")
p.write_text(s)

# Critical: without these IDs, neither Home nor Footer save is dispatched.
modify('src/main.js', [
 ("['seoSettingsForm','contactSettingsForm','loginForm','settingsForm'", "['homeForm','footerForm','seoSettingsForm','contactSettingsForm','loginForm','settingsForm'"),
])
print('Patched branding, footer, contact, and form dispatch')

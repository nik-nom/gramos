export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const slugify = s => String(s ?? '').toLowerCase().trim().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g,'-').replace(/^-|-$/g,'');
export const imageURL = url => { if(typeof url!=='string'||!url.trim())return ''; try { const x = new URL(url.trim(), location.origin); return (x.protocol==='https:' || (x.protocol==='http:'&&x.origin===location.origin)) && (url.trim().startsWith('/')||url.trim().startsWith('https://')||x.origin===location.origin) ? x.href : ''; } catch { return ''; } };
export const safeLink = url => { if(typeof url!=='string'||!url.trim())return ''; try { const raw=url.trim(); const x=new URL(raw, location.origin); return (raw.startsWith('https://')||raw.startsWith('mailto:')||raw.startsWith('tel:'))&&['https:', 'mailto:', 'tel:'].includes(x.protocol) ? x.href : ''; } catch { return ''; } };
/** Only a direct HTTPS .pdf file is presented as a Download PDF action. */
export const safePdfURL = url => {const link=safeLink(url);if(!link)return '';try{return new URL(link).pathname.toLowerCase().endsWith('.pdf')?link:'';}catch{return '';}};
export const loc = (obj, key, lang) => obj?.[`${key}_${lang}`] || obj?.[`${key}_${lang === 'mr' ? 'en' : 'mr'}`] || '';
export const formatDate = (d, lang='mr') => { try { return new Intl.DateTimeFormat(lang === 'mr' ? 'mr-IN' : 'en-IN',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d)); } catch { return ''; } };
export const notif = (message, danger=false) => { let node = document.getElementById('toast'); if (!node) {node = document.createElement('div'); node.id='toast'; document.body.append(node);} node.className = `toast ${danger ? 'danger' : ''}`; node.textContent = message; clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(()=>node.classList.add('hidden'),4000); };
export const id = () => crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function icon(name) { const paths={
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
  phone:'<path d="M7 3H4a2 2 0 0 0-2 2c0 9 8 17 17 17a2 2 0 0 0 2-2v-3l-5-3-3 3a15 15 0 0 1-6-6l3-3-3-5Z"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5"/>',
  document:'<path d="M6 2h9l4 4v16H6zM14 2v5h5M9 12h6M9 16h6"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m21 16-6-6L5 21"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a16 16 0 0 1 0 20M12 2a16 16 0 0 0 0 20"/>'
}; return `<svg aria-hidden="true" class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.document}</svg>`; }

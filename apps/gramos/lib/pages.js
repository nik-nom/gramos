// EXACT approved navigation labels. All website body content remains Marathi.
export const PAGES = [
  { key: 'home', path: '', mr: 'मुखपृष्ठ', en: 'Home' },
  { key: 'about', path: 'about', mr: 'ग्रामपंचायतीबद्दल', en: 'About' },
  { key: 'services', path: 'services', mr: 'लोकसेवा', en: 'Services' },
  { key: 'projects', path: 'projects', mr: 'विकासकामे', en: 'Projects' },
  { key: 'schemes', path: 'schemes', mr: 'योजना', en: 'Schemes' },
  { key: 'notices', path: 'notices', mr: 'नोटीस बोर्ड', en: 'Notices' },
  { key: 'news', path: 'news', mr: 'बातम्या', en: 'News' },
  { key: 'gallery', path: 'gallery', mr: 'फोटो गॅलरी', en: 'Gallery' },
  { key: 'contact', path: 'contact', mr: 'संपर्क', en: 'Contact' }
];
export const ABOUT_TABS = [
  { key:'about', path:'about', mr:'सर्व माहिती' },
  { key:'about/officials', path:'about/officials', mr:'पदाधिकारी' },
  { key:'about/employees', path:'about/employees', mr:'कर्मचारी' },
  { key:'about/committees', path:'about/committees', mr:'ग्रामपंचायत समित्या' },
  { key:'about/infrastructure', path:'about/infrastructure', mr:'ग्राम पायाभूत सुविधा' },
  { key:'about/responsibilities', path:'about/responsibilities', mr:'भूमिका व जबाबदाऱ्या', locked:true }
];
export const ALL_PAGES=[...PAGES.map(p=>({key:p.key,title:p.mr})),...ABOUT_TABS.filter(x=>x.key!=='about').map(x=>({key:x.key,title:x.mr,locked:!!x.locked}))];
export const safeSlug = v => /^[a-z0-9][a-z0-9-]{0,78}$/.test(v||'');
export const validPage = key => ALL_PAGES.some(p=>p.key===key);
export const hrefFor = (slug, key='home', cleanUrls=false) => (cleanUrls?'':`/v/${encodeURIComponent(slug)}`)+(key==='home'?(cleanUrls?'/':''):`/${key}`);
export function mr(v){
  if(typeof v==='string')return v;
  if(v&&typeof v==='object'&&!Array.isArray(v))return typeof v.mr==='string'?v.mr:'';
  return '';
}
export function safeHttp(url){
  if(typeof url!=='string')return '';
  try{const x=new URL(url);return x.protocol==='https:'&&!x.username&&!x.password?x.href:''}catch{return ''}
}
export function safeFooterLink(url,slug,cleanUrls=false){
  if(typeof url!=='string')return '';
  if(/^\/(?!\/)[a-zA-Z0-9_/?#=&%-]{0,300}$/.test(url)){
    const prefix=`/v/${slug}`;
    if(url===prefix||url.startsWith(prefix+'/')){
      const target=url.slice(prefix.length)||'/';
      const key=target==='/'?'home':target.replace(/^\//,'');
      return validPage(key)?hrefFor(slug,key,cleanUrls):'';
    }
    if(url.startsWith('/v/'))return '';
    if(cleanUrls)return url;
    const key=url==='/'?'home':url.slice(1);
    return validPage(key)?hrefFor(slug,key,false):'';
  }
  if(url.startsWith('page:')){
    const key=url.slice(5); return validPage(key)?hrefFor(slug,key,cleanUrls):'';
  }
  return safeHttp(url);
}

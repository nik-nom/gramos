import Link from 'next/link';
import {safeFooterLink,hrefFor,mr} from '../lib/pages';
const defaultLinks=[
 {group:'resources',label_mr:'ग्रामविकास विभाग',url:'https://rdd.maharashtra.gov.in/'},
 {group:'resources',label_mr:'महाराष्ट्र शासन',url:'https://www.maharashtra.gov.in/'},
 {group:'resources',label_mr:'ई-ग्रामस्वराज',url:'https://egramswaraj.gov.in/'},
 {group:'resources',label_mr:'MGNREGA',url:'https://nrega.dord.gov.in/'}
];
export default function SiteFooter({site,footer,cleanUrls=false}){
 const g=site.content?.general||{};
 const f=footer||{};
 const links=Array.isArray(f.links)?f.links:defaultLinks;
 const year=Number.isInteger(Number(f.year_override))&&Number(f.year_override)>=2000&&Number(f.year_override)<=2099?Number(f.year_override):new Date().getFullYear();
 const yearText='© '+year;
 const renderLinks=(group)=>links.filter(l=>l.group===group).slice(0,15).map((l,i)=>{
   const url=safeFooterLink(l.url,site.slug,cleanUrls);if(!url)return null;
   return url.startsWith('/')?<Link key={i} href={url}>{l.label_mr||'दुवा'}</Link>:<a key={i} href={url} rel="noopener noreferrer" target="_blank">{l.label_mr||'दुवा'}</a>
 });
 return <footer className="site-footer"><div className="container footer-grid">
   <div><h3>{f.social_heading||'समाज माध्यमे'}</h3><p>{f.social_text||'ग्रामपंचायत कार्यालयाची अधिकृत समाज माध्यमे'}</p>{renderLinks('social')}</div>
   <div><h3>{f.resources_heading||'महत्वाची संकेतस्थळे'}</h3>{renderLinks('resources')}</div>
   <div><h3>{f.pages_heading||'महत्वाची पाने'}</h3>{Array.isArray(f.links)?renderLinks('pages'):<>{['home','about','services','news','gallery'].map(key=><Link key={key} href={hrefFor(site.slug,key,cleanUrls)}>{{home:'मुखपृष्ठ',about:'ग्रामपंचायतीबद्दल',services:'लोकसेवा',news:'बातम्या',gallery:'फोटो गॅलरी'}[key]}</Link>)}</>}</div>
   <div><h3>{f.contact_heading||'संपर्क माहिती'}</h3><p>{f.office||mr(g.name)||''}</p>{f.phone||g.footerPhone?<a href={'tel:'+String(f.phone||g.footerPhone).replace(/[^0-9+]/g,'')}>{f.phone||g.footerPhone}</a>:null}{f.email||g.footerEmail?<a href={'mailto:'+(f.email||g.footerEmail)}>{f.email||g.footerEmail}</a>:null}<p>{f.hours||mr(g.footerHours)||''}</p></div>
 </div><div className="footer-bottom">{yearText} · {f.copyright_note||'सर्व हक्क राखीव.'}{f.credit?` · ${f.credit}`:''}</div></footer>;
}

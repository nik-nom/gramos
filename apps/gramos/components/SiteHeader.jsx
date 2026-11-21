'use client';
import {useState} from 'react';
import Link from 'next/link';
import {PAGES,hrefFor,mr,safeHttp} from '../lib/pages';
export default function SiteHeader({site,cleanUrls=false}){
 const [lang,setLang]=useState('mr'),[open,setOpen]=useState(false);
 const g=site.content?.general||{};
 const logo=safeHttp(g.logo);
 return <><header className="site-header"><div className="header-inside">
   <Link className="brand" href={hrefFor(site.slug,'home',cleanUrls)}>
     {logo?<img src={logo} alt="ग्रामपंचायत बोधचिन्ह"/>:<span className="brand-icon" aria-hidden="true">ग्रा</span>}
     <span className="brand-line"><strong>{mr(g.name)||'ग्रामपंचायत'}</strong><small>{[mr(g.taluka)&&`ता. ${mr(g.taluka)}`,mr(g.district)&&`जि. ${mr(g.district)}`].filter(Boolean).join(' ')}</small></span>
   </Link><button className="mobile-toggle" aria-expanded={open} onClick={()=>setOpen(v=>!v)} aria-label="मेनू">☰</button>
   <nav className={`main-nav ${open?'open':''}`} aria-label="मुख्य मेनू">{PAGES.map(p=><Link onClick={()=>setOpen(false)} key={p.key} href={hrefFor(site.slug,p.key,cleanUrls)}>{lang==='en'?p.en:p.mr}</Link>)}
      <span className="lang-switch"><button onClick={()=>setLang('mr')} aria-pressed={lang==='mr'}>म</button><button onClick={()=>setLang('en')} aria-pressed={lang==='en'}>EN</button></span>
   </nav></div></header>{mr(g.quote)?<div className="quote-bar"><div className="quote-marquee">{mr(g.quote)}</div></div>:null}</>;
}

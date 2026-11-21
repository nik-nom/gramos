import Link from 'next/link';
import {ABOUT_TABS,hrefFor} from '../lib/pages';
export default function BlankPage({site,page,pageKey,cleanUrls=false}){
 const isAbout=pageKey==='about'||pageKey.startsWith('about/');
 const title=page?.title_mr||({about:'ग्रामपंचायतीबद्दल'})[pageKey]||'';
 const data=page?.published_content||{};
 return <main className="container blank-page"><h1>{title}</h1>
 {isAbout?<nav className="about-tabs" aria-label="ग्रामपंचायत माहिती">{ABOUT_TABS.map(tab=><Link aria-current={tab.key===pageKey?'page':undefined} href={hrefFor(site.slug,tab.key,cleanUrls)} key={tab.key}>{tab.mr}</Link>)}</nav>:null}
 {data.body_mr?<article className="page-copy">{data.body_mr.split('\n').map((line,i)=><p key={i}>{line}</p>)}</article>:<div className="page-placeholder">या पानाची माहिती लवकरच उपलब्ध होईल.</div>}
 </main>
}

import Link from 'next/link';
import {hrefFor,mr,safeHttp} from '../lib/pages';
import {HOME_SECTIONS} from '../lib/home-sections';
function Section({title,children,id}){return <section id={id} className="container section-block"><h2>{title}</h2>{children}</section>}
function Cards({items,kind='basic'}){
 if(!Array.isArray(items)||!items.length)return <p className="empty-card">माहिती उपलब्ध नाही.</p>;
 return <div className="cards">{items.slice(0,24).map((item,i)=>{
 const src=safeHttp(typeof item==='string'?item:item?.image);return <article className="info-card" key={i}>{src?<img loading="lazy" src={src} alt=""/>:null}
 <h3>{mr(item?.name)||mr(item?.title)||mr(item?.label)||'—'}</h3>
 {kind==='projects'?<p>{mr(item?.scheme)} {item?.year||''} {mr(item?.location)}</p>:<p>{mr(item?.role)||mr(item?.description)||mr(item?.value)||''}</p>}</article>;
 })}</div>
}
function More({site,keyName,label,cleanUrls=false}){return <p className="section-more"><Link className="button" href={hrefFor(site.slug,keyName,cleanUrls)}>{label}</Link></p>}
export default function Home({site,page,cleanUrls=false}){
 const content=site.content||{},g=content.general||{},data=page?.published_content||{};
 const hero=safeHttp(data.hero_image||content.heroImages?.[0]||'');
 const siteName=data.title||mr(g.name)||'ग्रामपंचायत';
 const welcome=data.welcome||mr(g.welcome)||'';
 const sectionData=data.sections&&typeof data.sections==='object'?data.sections:{};
 const heading=(key,fb)=>sectionData[key]?.title||data.section_titles?.[key]||mr(content.homeTitles?.[key])||fb;
 const items=(key,legacy)=>Array.isArray(sectionData[key]?.cards)?sectionData[key].cards:legacy;
 const extra=(key,defaultText)=>sectionData[key]?.text??defaultText;
 return <main>
 <div className="hero">{hero?<img src={hero} alt="ग्रामपंचायत परिसर"/>:<div className="hero-empty" aria-hidden="true"/>}</div>
 <div className="welcome"><h1>{siteName}</h1><p>{welcome}</p><Link className="button" href={hrefFor(site.slug,'about',cleanUrls)}>ग्रामपंचायतीबद्दल</Link></div>
 <Section id="gallery" title={heading('gallery','फोटो गॅलरी')}><Cards items={items('gallery',(content.galleryImages||[]).map(image=>({image,title:''})))}/><More site={site} cleanUrls={cleanUrls} keyName="gallery" label="सर्व फोटो पहा"/></Section>
 <Section title={heading('ministers','माननीय मंत्री व पदाधिकारी')}><Cards items={items('ministers',content.ministers)}/></Section>
 <Section title={heading('officials','ग्रामपंचायत पदाधिकारी आणि कर्मचारी')}><Cards items={items('officials',content.officials)}/><More site={site} cleanUrls={cleanUrls} keyName="about/officials" label="सर्व पहा"/></Section>
 <Section title={heading('services','लोकसेवा')}><Cards items={items('services',content.services)}/><More site={site} cleanUrls={cleanUrls} keyName="services" label="सर्व पहा"/></Section>
 <Section title={heading('news','बातम्या')}><Cards items={items('news',content.news)}/><More site={site} cleanUrls={cleanUrls} keyName="news" label="सर्व पहा"/></Section>
 <Section title={heading('notices','सूचना फलक')}><Cards items={items('notices',content.notices)}/><More site={site} cleanUrls={cleanUrls} keyName="notices" label="सर्व पहा"/></Section>
 <Section title={heading('schemes','शासकीय योजना')}><Cards items={items('schemes',content.schemes)}/><More site={site} cleanUrls={cleanUrls} keyName="schemes" label="सर्व पहा"/></Section>
 <Section title={heading('contact','संपर्क माहिती')}><div className="info-card">{extra('contact',`${mr(g.name)||siteName} · ${mr(g.taluka)||''} · ${mr(g.district)||''}`)}</div></Section>
 <Section title={heading('weather','लाईव्ह हवामान')}><p className="muted">{extra('weather',data.weather_message||'हवामान माहिती उपलब्ध नाही.')}</p></Section>
 <Section title={heading('video','व्हिडिओ गॅलरी')}><p className="muted">{extra('video',data.video_message||'सध्या कोणतेही व्हिडिओ उपलब्ध नाहीत.')}</p></Section>
 <Section title={heading('projects','विकासकामे')}><Cards items={items('projects',content.projects)} kind="projects"/><More site={site} cleanUrls={cleanUrls} keyName="projects" label="सर्व प्रकल्प पहा"/></Section>
 <Section title={heading('infrastructure','ग्राम पायाभूत सुविधा')}><Cards items={items('infrastructure',content.stats)}/></Section>
 </main>;
}

import {notFound} from 'next/navigation';
import {createPublicClient} from '../../../../lib/supabase';
import {ALL_PAGES,validPage} from '../../../../lib/pages';
import {loadPublicVillage,loadPublicPage,loadFooter,loadDocuments} from '../../../../lib/site-data';
import {getPublicHostContext} from '../../../../lib/domain-request';
import {primaryDomain} from '../../../../lib/domain-data';
import {pageSEO} from '../../../../lib/domain-core.mjs';
import SiteHeader from '../../../../components/SiteHeader';
import SiteFooter from '../../../../components/SiteFooter';
import Home from '../../../../components/Home';
import BlankPage from '../../../../components/BlankPage';
import Downloads from '../../../../components/Downloads';
export const dynamic='force-dynamic';
export const revalidate=0;
async function locate(village,key){
 if(!validPage(key))return null;
 const ctx=await getPublicHostContext();
 if(ctx.kind!=='shared'&&ctx.kind!=='custom')return null;
 const site=await loadPublicVillage(village);
 if(!site)return null;
 if(ctx.kind==='custom'&&(ctx.domain.site.id!==site.id||ctx.domain.site.slug!==village))return null;
 const db=createPublicClient();
 const page=await loadPublicPage(db,site.id,key);
 // A site may be published while some pages are still drafts. No draft content leaks.
 if(!page)return null;
 return {site,page,db,ctx};
}
export async function generateMetadata({params}){
 const {village,parts=[]}=await params;
 const key=parts.length?parts.join('/'):'home';
 try{
  const found=await locate(village,key);
  if(!found)return {title:'संकेतस्थळ उपलब्ध नाही',robots:{index:false,follow:false}};
  const domain=found.ctx.kind==='custom'?found.ctx.host:await primaryDomain(found.site.id,found.db).catch(()=>null);
  return pageSEO({site:found.site,page:found.page,pageKey:key,domain,shared:found.ctx.kind!=='custom'});
 }catch{return {title:'संकेतस्थळ उपलब्ध नाही',robots:{index:false,follow:false}};}
}
export default async function VillagePage({params}){
 const {village,parts=[]}=await params;
 const key=parts.length?parts.join('/'):'home';
 const found=await locate(village,key);
 if(!found)notFound();
 const {site,page,db,ctx}=found;
 const [footer,docs]=await Promise.all([loadFooter(db,site.id),loadDocuments(db,site.id,key)]);
 const cleanUrls=ctx.kind==='custom';
 return <><SiteHeader site={site} cleanUrls={cleanUrls}/>{key==='home'?<Home site={site} page={page} cleanUrls={cleanUrls}/>:<BlankPage site={site} page={page} pageKey={key} cleanUrls={cleanUrls}/>}<Downloads files={docs}/><SiteFooter site={site} footer={footer} cleanUrls={cleanUrls}/></>;
}

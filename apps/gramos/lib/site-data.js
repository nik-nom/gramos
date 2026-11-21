import {createPublicClient} from './supabase';
import {safeSlug,mr,validPage} from './pages';
// Only published, non-archived villages and pages are ever returned to public pages.
export async function loadPublicVillage(slug){
 if(!safeSlug(slug))return null;
 const db=createPublicClient();
 const {data,error}=await db.from('village_sites')
  .select('id,slug,content,published,archived_at,updated_at')
  .eq('slug',slug).eq('published',true).is('archived_at',null).maybeSingle();
 if(error)throw error;return data;
}
export async function loadPublicPage(db,siteId,pageKey){
 if(!validPage(pageKey))return null;
 // Live grams-platform schema uses `path`, NOT the earlier speculative `page_key`.
 const path=pageKey==='home'?'/':`/${pageKey}`;
 const {data,error}=await db.from('site_pages')
  .select('id,path,title_mr,published_content,is_published,updated_at,published_at')
  .eq('site_id',siteId).eq('path',path).eq('is_published',true).maybeSingle();
 if(error){if(['42P01','PGRST205'].includes(error.code))return null;throw error;}
 return data;
}
export async function loadFooter(db,siteId){
 const {data,error}=await db.from('site_footer_settings')
  .select('published_content').eq('site_id',siteId).maybeSingle();
 if(error){if(['42P01','PGRST205'].includes(error.code))return null;throw error;}
 return data?.published_content||null;
}
export async function loadDocuments(db,siteId,pageKey){
 const path=pageKey==='home'?'/':`/${pageKey}`;
 const page=await db.from('site_pages').select('id').eq('site_id',siteId).eq('path',path).eq('is_published',true).maybeSingle();
 if(page.error)throw page.error;if(!page.data)return [];
 const {data,error}=await db.from('site_documents').select('id,title_mr,storage_path')
  .eq('site_id',siteId).eq('page_id',page.data.id).eq('is_published',true)
  .order('created_at',{ascending:false}).limit(40);
 if(error){if(['42P01','PGRST205'].includes(error.code))return [];throw error;}
 const resolved=await Promise.all((data||[]).map(async d=>{
  const r=await db.storage.from('gramos-documents').createSignedUrl(d.storage_path,120);
  return {...d,href:r.data?.signedUrl||''};
 }));return resolved.filter(d=>d.href);
}
export function villageDisplayName(site){return mr(site?.content?.general?.name)||site?.slug||''}

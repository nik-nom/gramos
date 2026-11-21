import {createPublicClient} from '../../lib/supabase';
import {getPublicHostContext} from '../../lib/domain-request';
import {sitemapXML} from '../../lib/domain-core.mjs';
export const dynamic='force-dynamic';
export const revalidate=0;
export async function GET() {
 let ctx;
 try{ctx=await getPublicHostContext()}catch{return new Response('Unavailable',{status:503,headers:{'Cache-Control':'no-store'}})}
 if(ctx.kind!=='custom')return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex','Cache-Control':'no-store'}});
 const db=createPublicClient();
 const r=await db.from('site_pages').select('path,is_published,published_at,updated_at')
  .eq('site_id',ctx.domain.site.id).eq('is_published',true).order('path');
 if(r.error)return new Response('Unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
 return new Response(sitemapXML(ctx.host,r.data||[]),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Vary':'Host'}});
}

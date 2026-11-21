import {normalizeHostname} from './domain-core.mjs';
/** Testable Supabase query resolver. Fails closed on missing or unverified mapping. */
export async function resolveDomainRows(host,db){
 const name=normalizeHostname(host);
 if(!name||name==='localhost'||name==='127.0.0.1')return null;
 const r=await db.from('village_domains').select('hostname,site_id,status,is_primary,redirect_to,verified_at,dns_verified_at')
  .eq('hostname',name).in('status',['active','redirect']).not('verified_at','is',null)
  .not('dns_verified_at','is',null).maybeSingle();
 if(r.error)throw r.error;
 if(!r.data)return null;
 const village=await db.from('village_sites').select('id,slug,published,archived_at')
  .eq('id',r.data.site_id).eq('published',true).is('archived_at',null).maybeSingle();
 if(village.error)throw village.error;
 if(!village.data)return null;
 if(r.data.status==='redirect'){
  if(!r.data.redirect_to)return null;
  const target=await db.from('village_domains').select('hostname,site_id,status,verified_at,dns_verified_at')
   .eq('hostname',r.data.redirect_to).eq('site_id',r.data.site_id).eq('status','active')
   .not('verified_at','is',null).not('dns_verified_at','is',null).maybeSingle();
  if(target.error)throw target.error;
  if(!target.data)return null;
  return {...r.data,site:village.data,redirectHost:target.data.hostname};
 }
 return {...r.data,site:village.data};
}
export async function primaryDomainRows(siteId,db){
 const r=await db.from('village_domains').select('hostname').eq('site_id',siteId)
  .eq('status','active').eq('is_primary',true).not('verified_at','is',null)
  .not('dns_verified_at','is',null).maybeSingle();
 if(r.error)throw r.error;return r.data?.hostname||null;
}

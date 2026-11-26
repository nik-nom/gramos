import {dbRows} from '../api/lib/seo-data.mjs';
import {normalizedHost} from './domain-routes.mjs?v=6.9.1';
const attrs='hostname,village_id,status,verified_at';
export async function activeDomainForHost(rawHost,opts){
 const host=normalizedHost(rawHost);
 if(!host)return null;
 const rows=await dbRows('village_domains',attrs,{hostname:`eq.${host}`,status:'eq.active'},opts);
 return rows.find(x=>x.hostname===host&&x.status==='active'&&x.verified_at)||null;
}
export async function activeDomainForVillage(villageId,opts){
 if(!/^[a-f0-9-]{36}$/i.test(String(villageId)))return null;
 const rows=await dbRows('village_domains',attrs,{village_id:`eq.${villageId}`,status:'eq.active'},opts);
 return rows.find(x=>x.village_id===villageId&&x.status==='active'&&x.verified_at)||null;
}
export async function allActiveDomains(opts){
 return (await dbRows('village_domains',attrs,{status:'eq.active'},opts)).filter(x=>x.status==='active'&&x.verified_at);
}

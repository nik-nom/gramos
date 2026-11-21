import {requirePlatformAdmin,requireVillage,requireHostname,addDomain,checkDomain,activateDomain,removeDomain,apiFailure,json,DomainError} from '../../../../lib/domain-admin-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request){
 try{
  const {service}=await requirePlatformAdmin(request);
  const siteId=new URL(request.url).searchParams.get('siteId');await requireVillage(service,siteId);
  const r=await service.from('village_domains').select('hostname,site_id,status,is_primary,redirect_to,verified_at,dns_verified_at,last_checked_at,verification_details,last_error,activated_at').eq('site_id',siteId).neq('status','removed').order('hostname');
  if(r.error)throw new DomainError('Unable to list village domains',503);
  return json({domains:r.data||[]});
 }catch(e){return apiFailure(e)}
}
export async function POST(request){
 try{
  const {service,actor}=await requirePlatformAdmin(request);
  if(Number(request.headers.get('content-length')||0)>4096)return json({error:'Request too large'},413);
  let body;try{body=await request.json()}catch{throw new DomainError('Invalid JSON body');}
  const {action,siteId,hostname}=body||{};
  await requireVillage(service,siteId);
  const name=requireHostname(hostname);
  let row;
  if(action==='add')row=await addDomain({service,actor,siteId,hostname:name});
  else if(action==='check')row=await checkDomain({service,actor,siteId,hostname:name});
  else if(action==='activate'||action==='rollback')row=await activateDomain({service,actor,siteId,hostname:name,redirectPrevious:body.redirectPrevious!==false});
  else if(action==='remove')row=await removeDomain({service,actor,siteId,hostname:name,confirmation:body.confirmation});
  else throw new DomainError('Unknown domain action');
  return json({domain:row});
 }catch(e){return apiFailure(e)}
}

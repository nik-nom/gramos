import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {validSiteId,normalizeHostname,isSharedHostname} from './domain-core.mjs';
import {makeVercelClient,ProviderError} from './vercel-domains.mjs';
const url=()=>process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=()=>process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export class DomainError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function adminDeployment(){if(process.env.GRAMOS_DEPLOYMENT_ROLE!=='admin')throw new DomainError('Not found',404);}
export async function requirePlatformAdmin(request){
 adminDeployment();
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)throw new DomainError('Invalid request origin',403);
 const h=request.headers.get('authorization')||'';
 if(!/^Bearer [a-zA-Z0-9._-]{20,}$/.test(h))throw new DomainError('Sign in to manage domains',401);
 const jwt=h.slice(7);
 if(!url()||!key())throw new DomainError('Supabase is not configured',503);
 const client=createClient(url(),key(),{global:{headers:{Authorization:`Bearer ${jwt}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const user=await client.auth.getUser(jwt);
 if(user.error||!user.data?.user||user.data.user.is_anonymous)throw new DomainError('Session expired. Please sign in again',401);
 const [role,mfa]=await Promise.all([client.rpc('is_platform_admin'),client.rpc('gramos_has_mfa_v13')]);
 if(role.error||role.data!==true||mfa.error||mfa.data!==true)throw new DomainError('Platform administrator and MFA verification are required',403);
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!serviceKey)throw new DomainError('Server service credentials are not configured',503);
 const service=createClient(url(),serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 return {service,actor:user.data.user.id};
}
export function requireHostname(host){
 const name=normalizeHostname(host);
 if(!name||name==='localhost'||name==='127.0.0.1'||name.endsWith('.vercel.app')||isSharedHostname(name,process.env))throw new DomainError('Enter a custom domain owned by the village, not a shared preview/admin address');
 return name;
}
export async function requireVillage(service,siteId){
 if(!validSiteId(siteId))throw new DomainError('Select a valid village');
 const row=await service.from('village_sites').select('id,slug,published,archived_at').eq('id',siteId).maybeSingle();
 if(row.error)throw new DomainError('Unable to check village',503);
 if(!row.data||row.data.archived_at)throw new DomainError('Village missing or archived',404);
 return row.data;
}
async function getDomain(service,siteId,hostname){
 const r=await service.from('village_domains').select('*').eq('hostname',hostname).maybeSingle();
 if(r.error)throw new DomainError('Unable to read domain',503);
 if(!r.data||r.data.site_id!==siteId)throw new DomainError('Domain not found for this village',404);
 return r.data;
}
async function persist(service,hostname,details){
 const r=await service.from('village_domains').update(details).eq('hostname',hostname).select().single();
 if(r.error)throw new DomainError(`Could not save domain state: ${r.error.message}`,503);
 return r.data;
}
async function log(service,actor,siteId,hostname,action,notes=''){
 const r=await service.from('village_domain_events').insert({actor_id:actor,site_id:siteId,hostname,action,notes:notes.slice(0,240)});
 if(r.error)throw new DomainError('Domain operation succeeded but audit logging failed. Contact platform owner.',503);
}
export async function checkDomain({service,actor,siteId,hostname,provider=makeVercelClient(),audit=true}){
 const existing=await getDomain(service,siteId,hostname);
 if(existing.status==='removed')throw new DomainError('This domain was removed. Register it again.',409);
 const result=await provider.check(hostname);
 const now=new Date().toISOString();
 const ready=result.ownershipVerified&&result.dnsConfigured;
 const status=existing.status==='removing'?'removing':ready?existing.status==='active'||existing.status==='redirect'?existing.status:'pending':'pending';
 const row=await persist(service,hostname,{status,verified_at:result.ownershipVerified?now:null,dns_verified_at:result.dnsConfigured?now:null,
   last_checked_at:now,verification_details:result.instructions,last_error:null,...(!ready?{is_primary:false,redirect_to:null}:{})});
 if(audit)await log(service,actor,siteId,hostname,'check',result.state);
 return {...row,providerState:result.state};
}
export async function addDomain({service,actor,siteId,hostname,provider=makeVercelClient()}){
 const village=await requireVillage(service,siteId);
 const target=requireHostname(hostname);
 const existing=await service.from('village_domains').select('site_id,status').eq('hostname',target).maybeSingle();
 if(existing.error)throw new DomainError('Unable to check hostname uniqueness',503);
 if(existing.data&&existing.data.site_id!==siteId)throw new DomainError('This hostname is reserved for another village',409);
 if(existing.data&&existing.data.status!=='removed'&&existing.data.status!=='pending')throw new DomainError('This domain is already registered',409);
 if(!existing.data){
  const created=await service.from('village_domains').insert({hostname:target,site_id:siteId,status:'pending',is_primary:false}).select().single();
  if(created.error)throw new DomainError(created.error.code==='23505'?'This hostname is already registered':'Unable to reserve domain',created.error.code==='23505'?409:503);
 }else if(existing.data.status==='removed'){
  await persist(service,target,{status:'pending',is_primary:false,redirect_to:null,verified_at:null,dns_verified_at:null,last_error:null});
 }
 try{
  await provider.add(target);
 }catch(err){
  // A retry after an earlier partial success may report already assigned. Re-check ownership instead of reassigning DB hostnames.
  if(err.status!==409) {await persist(service,target,{last_error:String(err.message).slice(0,220)});throw err;}
  try{await provider.get(target)}catch(checkError){
   await persist(service,target,{last_error:'Domain is already attached to another project or is not accessible'});
   throw new DomainError('This hostname belongs to another Vercel project. Verify ownership before retrying.',409);
  }
 }
 let row;
 try{row=await checkDomain({service,actor,siteId,hostname:target,provider,audit:false})}
 catch(err){row=await getDomain(service,siteId,target);row.providerState='pending';}
 await log(service,actor,siteId,target,'register',`Village ${village.slug}`);
 return row;
}
export async function activateDomain({service,actor,siteId,hostname,redirectPrevious=true,provider=makeVercelClient()}){
 const village=await requireVillage(service,siteId);
 if(!village.published)throw new DomainError('Publish the village before activating its domain',409);
 const target=requireHostname(hostname);
 const current=await getDomain(service,siteId,target);
 if(current.status==='removing'||current.status==='removed')throw new DomainError('This domain is being removed or has been removed',409);
 const verified=await checkDomain({service,actor,siteId,hostname:target,provider,audit:false});
 if(verified.providerState!=='ready')throw new DomainError('Ownership and DNS must both be verified in Vercel before activation',409);
 const res=await service.rpc('gramos_activate_domain_v1',{p_site_id:siteId,p_hostname:target,p_redirect_previous:Boolean(redirectPrevious)});
 if(res.error)throw new DomainError(`Activation denied by database: ${res.error.message}`,409);
 await log(service,actor,siteId,target,current.status==='redirect'?'rollback':'activate',redirectPrevious?'Old domain redirects to new':'Old domain disabled');
 return await getDomain(service,siteId,target);
}
export async function removeDomain({service,actor,siteId,hostname,confirmation,provider=makeVercelClient()}){
 const target=requireHostname(hostname);const current=await getDomain(service,siteId,target);
 if(confirmation!==target)throw new DomainError('Enter the exact hostname to confirm removal',400);
 if(current.status==='removed')return current;
 // Fail closed: disable host resolution BEFORE contacting provider.
 await persist(service,target,{status:'removing',is_primary:false,redirect_to:null});
 try{await provider.remove(target)}catch(e){
  if(e.status!==404){
   await persist(service,target,{last_error:String(e.message).slice(0,220)});
   throw new DomainError('Domain disabled in GramOS. Vercel removal is pending; retry removal.',502);
  }
 }
 const row=await persist(service,target,{status:'removed',is_primary:false,redirect_to:null,verified_at:null,dns_verified_at:null,last_error:null});
 await log(service,actor,siteId,target,'remove');
 return row;
}
export function apiFailure(error){
 if(error instanceof DomainError||error instanceof ProviderError)return json({error:error.message},error.status||400);
 return json({error:'Domain operation unavailable. Check server logs.'},503);
}

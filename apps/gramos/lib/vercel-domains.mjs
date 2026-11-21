/** Strict provider client. Values for DNS come from Vercel, never guessed. */
import {normalizeHostname,vercelStatus,dnsInstructions} from './domain-core.mjs';
export class ProviderError extends Error {constructor(message,status){super(message);this.status=status;}}
export function makeVercelClient(env=process.env, fetcher=fetch){
 const token=env.VERCEL_API_TOKEN,project=env.VERCEL_PUBLIC_PROJECT_ID,team=env.VERCEL_TEAM_ID;
 if(!token||!project||!/^[-_a-zA-Z0-9]{2,100}$/.test(project))throw new ProviderError('Vercel API credentials/project ID are missing',503);
 const domainBase=`/v9/projects/${encodeURIComponent(project)}/domains`;
 async function request(method,path,body){
  const u=new URL(`https://api.vercel.com${path}`);if(team)u.searchParams.set('teamId',team);
  const res=await fetcher(u.toString(),{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000),cache:'no-store'});
  let data=null;try{data=await res.json()}catch{}
  if(!res.ok){throw new ProviderError(typeof data?.error?.message==='string'?data.error.message.slice(0,220):`Vercel error ${res.status}`,res.status);}
  return data||{};
 }
 function valid(host){const x=normalizeHostname(host);if(!x)throw new ProviderError('Invalid domain name',400);return encodeURIComponent(x)}
 return {
  add:host=>request('POST',`/v10/projects/${encodeURIComponent(project)}/domains`,{name:normalizeHostname(host)}),
  get:host=>request('GET',`${domainBase}/${valid(host)}`),
  verify:host=>request('POST',`${domainBase}/${valid(host)}/verify`),
  config:host=>request('GET',`/v6/domains/${valid(host)}/config`),
  remove:host=>request('DELETE',`${domainBase}/${valid(host)}`),
  async check(host,{tryVerify=true}={}){
   let projectDomain=await this.get(host);
   if(tryVerify && !projectDomain.verified){
    try{await this.verify(host);projectDomain=await this.get(host)}catch(err){if(err.status>=500)throw err;}
   }
   const dns=await this.config(host);
   return {...vercelStatus(projectDomain,dns),instructions:dnsInstructions(projectDomain,dns)};
  }
 };
}

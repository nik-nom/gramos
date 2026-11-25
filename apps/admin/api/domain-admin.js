/** Domain registration and verification. Admin-only, server-side credentials only. */
import {validVillageDomain} from '../src/domain-routes.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
function json(res,code,payload){res.statusCode=code;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');return res.end(JSON.stringify(payload));}
const config=()=>{
 const url=process.env.SUPABASE_URL?.replace(/\/$/,'');
 const publicKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!publicKey||!secret)throw new Error('Supabase server configuration is incomplete');
 return {url,publicKey,secret};
};
async function supabase(c,path,{method='GET',body,auth=false}={}){
 const key=auth?c.publicKey:c.secret;
 const r=await fetch(c.url+path,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(9000)});
 if(!r.ok){const b=await r.text();throw new Error(`Database operation failed (${r.status}): ${b.slice(0,150)}`);}
 const txt=await r.text();return txt?JSON.parse(txt):null;
}
async function authenticate(req,c){
 const token=String(req.headers?.authorization||'').match(/^Bearer ([A-Za-z0-9._-]+)$/)?.[1];
 if(!token) return null;
 const resp=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.publicKey,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(9000)});
 if(!resp.ok)return null;
 const user=await resp.json();if(!uuid(user.id))return null;
 const admins=await supabase(c,`/rest/v1/platform_admins?user_id=eq.${user.id}&select=user_id`);
 return Array.isArray(admins)&&admins.length?user:null;
}
function vercelConfig(){const token=process.env.VERCEL_API_TOKEN, project=process.env.VERCEL_PUBLIC_PROJECT_ID;
 return {token,project,teamId:process.env.VERCEL_TEAM_ID||''};}
async function vercel(verb,path,body){const v=vercelConfig();if(!v.token||!v.project)throw new Error('Set VERCEL_API_TOKEN and VERCEL_PUBLIC_PROJECT_ID on the admin Vercel project');
 const u=new URL('https://api.vercel.com'+path);if(v.teamId)u.searchParams.set('teamId',v.teamId);
 const r=await fetch(u,{method:verb,headers:{Authorization:`Bearer ${v.token}`,Accept:'application/json','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const result=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`Vercel: ${String(result?.error?.message||r.status).slice(0,160)}`);
 return result;
}
async function domains(c,villageId){return supabase(c,`/rest/v1/village_domains?village_id=eq.${villageId}&select=hostname,village_id,status,verified_at,last_checked_at,vercel_details&order=created_at.desc`);}
export default async function handler(req,res){
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 let c;try{c=config();}catch(error){return json(res,503,{error:error.message});}
 let user;try{user=await authenticate(req,c);}catch(error){console.error('GramOS domain authorization unavailable',error.message);return json(res,503,{error:'Authentication temporarily unavailable'});}
 if(!user)return json(res,403,{error:'Only a signed-in Super Admin can manage village domains'});
 const body=req.method==='POST'?(req.body||{}):{};
 const villageId=req.method==='GET'?String(req.query?.village_id||''):String(body.village_id||'');
 if(!uuid(villageId))return json(res,400,{error:'Invalid village ID'});
 try{
  const villages=await supabase(c,`/rest/v1/villages?id=eq.${villageId}&select=id,slug,status`);
  if(villages?.length!==1)return json(res,404,{error:'Village does not exist'});
  if(req.method==='GET')return json(res,200,{domains:await domains(c,villageId),vercelConnected:!!(process.env.VERCEL_API_TOKEN&&process.env.VERCEL_PUBLIC_PROJECT_ID),villageSlug:villages[0].slug});
  const action=String(body.action||'');const hostname=validVillageDomain(body.hostname);
  if(!hostname)return json(res,400,{error:'Enter a complete domain such as village.in (without https:// or /v/village)'});
  const record=await supabase(c,`/rest/v1/village_domains?hostname=eq.${encodeURIComponent(hostname)}&select=hostname,village_id,status`);
  if(record?.length&&record[0].village_id!==villageId)return json(res,409,{error:'That domain already belongs to another village'});
  if(action==='register'){
    // The village keeps its old active domain while a replacement is pending.
    if(record?.length&&record[0].status==='active')return json(res,200,{message:'Domain already active',domains:await domains(c,villageId)});
    const v=vercelConfig();let mode='manual';let verification=[];
    if(v.token&&v.project){
      let result;
      try{result=await vercel('POST',`/v10/projects/${encodeURIComponent(v.project)}/domains`,{name:hostname});}
      catch(registrationError){
        // Domain may already have been added manually to this SAME project.
        // Project-specific GET must succeed; never accept membership on another project.
        try{result=await vercel('GET',`/v9/projects/${encodeURIComponent(v.project)}/domains/${encodeURIComponent(hostname)}`);}
        catch{throw registrationError;}
        if(result?.name!==hostname)throw registrationError;
      }
      mode='api';verification=Array.isArray(result.verification)?result.verification:[];
    }
    const patch={hostname,village_id:villageId,status:'pending',verified_at:null,last_checked_at:null,vercel_details:{registration:mode,verification}};
    if(record?.length){await supabase(c,`/rest/v1/village_domains?hostname=eq.${encodeURIComponent(hostname)}&village_id=eq.${villageId}`,{method:'PATCH',body:patch});}
    else{await supabase(c,'/rest/v1/village_domains',{method:'POST',body:patch});}
    return json(res,200,{message:mode==='manual'?'Saved as pending. Add this domain in Vercel → gramos-public → Domains, then configure the server token to verify it.':'Domain registered with Vercel. Configure DNS and click Verify & activate.',domains:await domains(c,villageId)});
  }
  if(action==='check'){
    if(!record?.length)return json(res,404,{error:'Add this domain first'});
    const v=vercelConfig();if(!v.token||!v.project)return json(res,409,{error:'To verify automatically, configure VERCEL_API_TOKEN and VERCEL_PUBLIC_PROJECT_ID in gramos-admin Vercel environment variables.'});
    const [membership,dns]=await Promise.all([
      vercel('GET',`/v9/projects/${encodeURIComponent(v.project)}/domains/${encodeURIComponent(hostname)}`),
      vercel('GET',`/v6/domains/${encodeURIComponent(hostname)}/config`)
    ]);
    // Fail closed: provider must positively confirm project ownership AND working DNS.
    const owns=membership?.name===hostname&&membership?.verified===true;
    const dnsReady=dns?.misconfigured===false;
    const checked=new Date().toISOString();
    await supabase(c,`/rest/v1/village_domains?hostname=eq.${encodeURIComponent(hostname)}&village_id=eq.${villageId}`,{method:'PATCH',body:{last_checked_at:checked,verified_at:owns&&dnsReady?checked:null,vercel_details:{dnsReady,vercelVerified:owns,verification:Array.isArray(membership?.verification)?membership.verification:[],recommendedCNAME:dns.recommendedCNAME||null,recommendedIPv4:dns.recommendedIPv4||null}}});
    if(!owns||!dnsReady)return json(res,200,{active:false,message:'Domain is still pending. Follow Vercel DNS / ownership instructions, then retry.',dnsReady,ownershipVerified:owns,domains:await domains(c,villageId)});
    if(villages[0].status!=='published')return json(res,409,{error:'Publish the village before activating the domain'});
    await supabase(c,'/rest/v1/rpc/gramos_activate_verified_domain',{method:'POST',body:{p_village_id:villageId,p_hostname:hostname}});
    return json(res,200,{active:true,message:'Verified and activated. Original /v/village path is preserved.',domains:await domains(c,villageId)});
  }
  if(action==='remove'){
    if(!record?.length)return json(res,404,{error:'Domain not registered'});
    const v=vercelConfig();if(v.token&&v.project){
      await vercel('DELETE',`/v9/projects/${encodeURIComponent(v.project)}/domains/${encodeURIComponent(hostname)}`);
    }
    await supabase(c,`/rest/v1/village_domains?hostname=eq.${encodeURIComponent(hostname)}&village_id=eq.${villageId}`,{method:'DELETE'});
    return json(res,200,{message:'Village domain removed; existing /v/village route remains accessible.',domains:await domains(c,villageId)});
  }
  return json(res,400,{error:'Unknown action'});
 }catch(error){console.error('GramOS domain action failed:',error.message);return json(res,409,{error:error.message.slice(0,190)});}
}

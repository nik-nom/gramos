// Same-origin, authenticated requests. Never send credentials to a redirected URL.
export async function requestDomain({villageId,action,hostname='',token,fetcher=globalThis.fetch,origin=globalThis.location?.origin,timeout=25000}){
 if(!token)throw new Error('Sign in again to manage domains.');
 const url=new URL('/api/domain-admin',origin);
 if(action==='list')url.searchParams.set('village_id',villageId);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  let res;
  try{res=await fetcher(url.href,{method:action==='list'?'GET':'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(action==='list'?{}:{'Content-Type':'application/json'})},cache:'no-store',redirect:'error',signal:controller.signal,body:action==='list'?undefined:JSON.stringify({village_id:villageId,action,hostname})});}
  catch(e){throw new Error(controller.signal.aborted?'Domain API timed out. Retry or inspect Vercel function logs.':'Cannot reach the Domain API. Check the admin deployment and network connection.');}
  const type=res.headers.get('content-type')||'';
  const http=`HTTP ${res.status}`;
  if(!type.toLowerCase().includes('application/json'))throw new Error(`Domain API returned a non-JSON response (${http}). Check apps/admin/api/domain-admin.js is deployed and the Vercel Root Directory is apps/admin.`);
  let result;try{result=await res.json();}catch{throw new Error(`Domain API returned invalid JSON (${http}). Check Vercel function logs.`);}
  if(!res.ok)throw new Error(`${typeof result?.error==='string'?result.error:'Domain request failed'} (${http})`);
  if(!result||typeof result!=='object'||Array.isArray(result)||(action==='list'&&!Array.isArray(result.domains)))throw new Error('Unexpected Domain API response. Deploy the current admin API.');
  return result;
 }finally{clearTimeout(timer);}
}

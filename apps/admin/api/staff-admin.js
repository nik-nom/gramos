/** Server-only staff provisioning. Only verified platform_admins can create logins. */
const json=(res,code,body)=>{res.setHeader('Cache-Control','no-store');res.status(code).json(body);};
const uuid=s=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(s||'');
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const headers=key=>({apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'});
async function reqSupabase(url,key,path,{method='GET',body}={}){
 const response=await fetch(`${url}${path}`,{method,headers:headers(key),body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok){const e=new Error(payload.msg||payload.message||payload.error_description||payload.error||'Supabase request failed');e.status=response.status;throw e;}
 return payload;
}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return json(res,503,{error:'Admin server credentials not configured in Vercel'});
 const origin=req.headers.origin;
 if(origin){let from;try{from=new URL(origin).host.toLowerCase();}catch{return json(res,403,{error:'Invalid origin'});}
   if(from!==(req.headers.host||'').toLowerCase())return json(res,403,{error:'Cross-origin request blocked'});
 }
 const bearer=String(req.headers.authorization||'').match(/^Bearer ([-\w.]+)$/i)?.[1];
 if(!bearer)return json(res,401,{error:'Admin session required'});
 let actor;
 try{
  const u=await fetch(`${base}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${bearer}`},cache:'no-store'});
  if(!u.ok)return json(res,401,{error:'Admin session is invalid or expired'});
  actor=await u.json();if(!uuid(actor?.id))return json(res,401,{error:'Admin session invalid'});
  const a=await reqSupabase(base,key,`/rest/v1/platform_admins?user_id=eq.${actor.id}&select=user_id&limit=1`);
  if(!a.length)return json(res,403,{error:'Only Super Admin can create logins'});
 }catch(error){return json(res,503,{error:'Cannot verify admin access'});}
 let body;
 try { body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}); }
 catch { return json(res,400,{error:'Invalid JSON request'}); }
 if(!body || typeof body!=='object' || Array.isArray(body)) return json(res,400,{error:'Invalid request body'});
 const villageId=String(body.village_id||'');const role=String(body.role||'');
 const fullName=String(body.name||'').trim();const email=String(body.email||'').trim().toLowerCase();
 const password=String(body.password||'');
 if(body.confirmed_recipient!=='true')return json(res,400,{error:'Confirm you verified the recipient and their email address before creating an account'});
 if(!uuid(villageId)||!['editor','reviewer'].includes(role)||fullName.length<2||fullName.length>120||
    !EMAIL.test(email)||email.length>254||password.length<14||password.length>128)
  return json(res,400,{error:'Select village, Admin or User, and provide a valid name, email and a password of 14+ characters'});
 let newUserId;
 try{
  const v=await reqSupabase(base,key,`/rest/v1/villages?id=eq.${villageId}&select=id&limit=1`);
  if(!v.length)return json(res,404,{error:'Village not found'});
  // A temporary password is supplied by the Super Admin and is NEVER stored in the client ledger.
  // Admin must verify recipient's email address out-of-band before sharing the password.
  const created=await reqSupabase(base,key,'/auth/v1/admin/users',{
   method:'POST',body:{email,password,email_confirm:true,user_metadata:{full_name:fullName}}
  });
  newUserId=created?.id;
  if(!uuid(newUserId))throw new Error('Auth account creation returned no user ID');
  await reqSupabase(base,key,'/rest/v1/village_members',{method:'POST',body:{village_id:villageId,user_id:newUserId,role}});
  return json(res,201,{ok:true,email,name:fullName,role,notice:'Account created. Share temporary password securely and ask user to reset it.'});
 }catch(error){
  if(newUserId){try{await reqSupabase(base,key,`/auth/v1/admin/users/${newUserId}`,{method:'DELETE'});}catch{console.error('Staff creation failed after Auth user creation; manual review required for user id',newUserId);}}
  console.error('Staff provisioning failed:',error.status||500);
  return json(res,error.status===422?409:400,{error:error.status===422?'That email is already registered. Use an existing-user assignment workflow.':error.message?.slice(0,160)||'Cannot create staff account'});
 }
}

// Signs a private visitor attachment URL for an authorized village editor.
const json=(res,status,data)=>{res.setHeader('Cache-Control','private, no-store');res.status(status).json(data);};
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s||''));
const serviceHeaders=key=>({apikey:key,Authorization:`Bearer ${key}`,Accept:'application/json'});
const read=async (url,key,path)=>{const r=await fetch(url+'/rest/v1/'+path,{headers:serviceHeaders(key),cache:'no-store'});if(!r.ok)throw new Error('Database lookup failed');return r.json();};
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 const url=(process.env.SUPABASE_URL||'').replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json(res,503,{error:'Attachment service not configured'});
 const id=req.query?.submission_id,token=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i)?.[1];
 if(!uuid(id)||!token)return json(res,400,{error:'Invalid request'});
 try{
   const verify=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:`Bearer ${token}`},cache:'no-store'});
   if(!verify.ok)return json(res,401,{error:'Sign in again to view private attachments'});
   const user=await verify.json();if(!uuid(user.id))return json(res,401,{error:'Invalid user'});
   const submissions=await read(url,key,`submissions?id=eq.${id}&select=village_id,attachment_path&limit=1`);
   const sub=submissions[0];if(!sub?.attachment_path)return json(res,404,{error:'Attachment not found'});
   const [platform,member]=await Promise.all([
      read(url,key,`platform_admins?user_id=eq.${user.id}&select=user_id&limit=1`),
      read(url,key,`village_members?user_id=eq.${user.id}&village_id=eq.${sub.village_id}&role=in.(owner,editor,reviewer)&select=user_id,role&limit=1`)
   ]);
   if(!platform.length&&!member.length)return json(res,403,{error:'Not authorized for this village'});
   const path=sub.attachment_path;
   if(!path.startsWith(sub.village_id+'/')||path.includes('..')||!/^[-a-zA-Z0-9_/.]+$/.test(path))return json(res,400,{error:'Unsafe attachment path'});
   const sign=await fetch(`${url}/storage/v1/object/sign/visitor-uploads/${path}`,{method:'POST',headers:{...serviceHeaders(key),'Content-Type':'application/json'},body:JSON.stringify({expiresIn:300})});
   if(!sign.ok)throw new Error('Could not sign attachment');
   const data=await sign.json();const signed=data.signedURL||data.signedUrl||'';
   if(!signed)return json(res,500,{error:'No attachment URL returned'});
   const target=signed.startsWith('http')?signed:`${url}/storage/v1${signed.startsWith('/')?'':'/'}${signed}`;
   return json(res,200,{url:target});
 }catch(error){console.error('Attachment lookup failed',error);return json(res,500,{error:'Unable to open attachment'});}
}

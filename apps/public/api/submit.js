// Vercel serverless endpoint for public contact forms + OPTIONAL private photo attachments.
// Only this server function sees the service_role key. The browser never does.
import {randomUUID,createHash} from 'node:crypto';

const json=(res,status,data)=>{res.setHeader('Cache-Control','no-store');res.status(status).json(data);};
const uuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s||''));
const env=()=>({url:(process.env.SUPABASE_URL||'').replace(/\/$/,''),key:process.env.SUPABASE_SERVICE_ROLE_KEY,turnstile:process.env.TURNSTILE_SECRET_KEY});
const hdr=key=>({apikey:key,Authorization:`Bearer ${key}`});
const rest=async ({url,key},table,query='')=>{
  const r=await fetch(`${url}/rest/v1/${table}${query}`,{headers:{...hdr(key),Accept:'application/json'},cache:'no-store'});
  if(!r.ok)throw new Error(`Database request failed (${r.status})`);
  return r.json();
};
function validatedImage(obj){
  if(!obj)return null;
  if(!['image/png','image/jpeg','image/webp'].includes(obj.mime)||typeof obj.base64!=='string'||obj.base64.length>2900000)throw new Error('Invalid image attachment');
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(obj.base64))throw new Error('Invalid image encoding');
  const buffer=Buffer.from(obj.base64,'base64');
  if(!buffer.length||buffer.length>2*1024*1024)throw new Error('Image must be under 2 MB');
  const png=buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg=buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
  const webp=buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
  if(!(obj.mime==='image/png'&&png||obj.mime==='image/jpeg'&&jpg||obj.mime==='image/webp'&&webp))throw new Error('Attachment is not a valid image');
  return {buffer,extension:{'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[obj.mime],mime:obj.mime};
}
export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  if(Number(req.headers?.['content-length']||0)>3_500_000)return json(res,413,{error:'Form attachment is too large'});
  const e=env();if(!e.url||!e.key)return json(res,503,{error:'Supabase form storage is not configured yet'});
  if(req.headers?.['sec-fetch-site']==='cross-site')return json(res,403,{error:'Cross-site submission rejected'});
  if(req.headers?.origin){try{if(new URL(req.headers.origin).host.toLowerCase()!==String(req.headers.host||'').toLowerCase())return json(res,403,{error:'Submission must originate from this website'});}catch{return json(res,403,{error:'Invalid origin'});}}
  try{
    const b=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!b||typeof b!=='object'||String(b.website||'').trim()||!uuid(b.village_id)||(b.turnstile_token&&String(b.turnstile_token).length>2000))return json(res,400,{error:'Invalid form'});
    const name=String(b.sender_name||'').trim(),email=String(b.sender_email||'').trim().toLowerCase(),message=String(b.message||'').trim(),subject=String(b.subject||'general').trim();
    if(!['general','complaint','suggestion','request'].includes(subject)||name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||message.length<10||message.length>2000)return json(res,400,{error:'Check your name, email and message length'});
    if(b.attachment && typeof b.attachment!=='object')return json(res,400,{error:'Invalid attachment'});
    const attachment=validatedImage(b.attachment);
    const registeredDomains=await rest(e,'village_domains',`?village_id=eq.${b.village_id}&status=eq.active&verified_at=not.is.null&select=hostname`);
    const allowedHosts=[process.env.SITE_URL,process.env.VERCEL_URL&&`https://${process.env.VERCEL_URL}`,'gramos-public.vercel.app',...registeredDomains.map(d=>d.hostname)]
       .filter(Boolean).map(v=>{try{return new URL(v).hostname.toLowerCase()}catch{return String(v).trim().toLowerCase()}});
    const currentHost=String(req.headers.host||'').toLowerCase().split(':')[0];
    if(!allowedHosts.includes(currentHost))return json(res,403,{error:'This hostname has not been assigned to the village'});
    // CAPTCHA is deliberately optional in GramOS v4.9. Default is a normal form.
    if(process.env.GRAMOS_FORM_CAPTCHA_ENABLED==='true'){
      if(!e.turnstile||typeof b.turnstile_token!=='string'||!b.turnstile_token)
        return json(res,503,{error:'Security verification is unavailable'});
      const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
        method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({secret:e.turnstile,response:b.turnstile_token})});
      const verified=await verify.json();
      if(!verified.success||String(verified.hostname||'').toLowerCase()!==currentHost)
        return json(res,403,{error:'Security verification failed'});
    }
    const villages=await rest(e,'villages',`?id=eq.${b.village_id}&status=eq.published&select=id&limit=1`);
    if(!villages.length)return json(res,404,{error:'Village not published'});
    // Concurrency-safe anti-spam counter. No raw IP address is stored.
    const remoteIp=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
    const ipHash=createHash('sha256').update(`${remoteIp}|${e.key.slice(-24)}`).digest('hex');
    const limited=await fetch(`${e.url}/rest/v1/rpc/gramos_check_form_rate_v49`,{
      method:'POST',headers:{...hdr(e.key),'Content-Type':'application/json'},
      body:JSON.stringify({p_village_id:b.village_id,p_ip_hash:ipHash})});
    if(!limited.ok)throw new Error('Form rate limiter unavailable. Try again later.');
    if(await limited.json()!==true)return json(res,429,{error:'Too many submissions. Please try later.'});
    const since=new Date(Date.now()-60*60*1000).toISOString();
    const recent=await rest(e,'submissions',`?village_id=eq.${b.village_id}&sender_email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=3`);
    if(recent.length>=3)return json(res,429,{error:'Too many submissions. Please try later.'});
    let path=null;
    if(attachment){
      path=`${b.village_id}/${randomUUID()}.${attachment.extension}`;
      const u=await fetch(`${e.url}/storage/v1/object/visitor-uploads/${path}`,{method:'POST',headers:{...hdr(e.key),'Content-Type':attachment.mime,'x-upsert':'false'},body:attachment.buffer});
      if(!u.ok){const msg=await u.text();console.error('Storage upload failed:',msg.slice(0,200));throw new Error('Image upload failed');}
    }
    const insert=await fetch(`${e.url}/rest/v1/submissions`,{method:'POST',headers:{...hdr(e.key),'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({village_id:b.village_id,sender_name:name,sender_email:email,message,subject,attachment_path:path,status:'new'})});
    if(!insert.ok){console.error('Submission insert failed:',(await insert.text()).slice(0,200));throw new Error('Unable to save submission');}
    return json(res,201,{ok:true});
  }catch(error){console.error('Submit failure:',error);return json(res,error instanceof SyntaxError?400:500,{error:error instanceof SyntaxError?'Invalid JSON':error.message==='Invalid image attachment'||error.message==='Invalid image encoding'||error.message==='Image must be under 2 MB'||error.message==='Attachment is not a valid image'?error.message:'Submission could not be processed'});}
}

/** Public downloads only after database publication + explicit PII review. Private storage. */
import {publicConfig,dbRows} from './lib/seo-data.mjs';
const uuid=x=>/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(String(x||''));
const slug=x=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(x||''))&&x.length<=90;
const json=(res,status,message)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({error:message}));};
export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,'Method not allowed');
 const q=req.query||Object.fromEntries(new URL(req.url||'/', 'https://localhost').searchParams);
 const id=String(q.id||''),v=String(q.v||'');if(!uuid(id)||!slug(v))return json(res,400,'Invalid download request');
 try{
  const config=await publicConfig();const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!service)throw new Error('Server file-download secret not configured');
  const village=await dbRows('villages','id,slug,status',{slug:'eq.'+v,status:'eq.published'},{config,max:1000});
  if(!village.length)return json(res,404,'List not found');
  const items=await dbRows('content_items','id,village_id,kind,status,details',{id:'eq.'+id,village_id:'eq.'+village[0].id,status:'eq.published',kind:'eq.beneficiary_lists'},{config,max:1000});
  const row=items[0];if(!row||row.details?.public_file_approved!==true)return json(res,404,'List not published or not approved');
  const path=String(row.details?.file_path||'');if(!new RegExp('^'+village[0].id+'/[0-9a-f-]{36}\\.xlsx$','i').test(path))return json(res,404,'Workbook unavailable');
  const sign=await fetch(`${config.url}/storage/v1/object/sign/beneficiary-files/${path}`,{
    method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},
    body:JSON.stringify({expiresIn:90}),signal:AbortSignal.timeout(8000)
  });
  if(!sign.ok)throw new Error('Signing request failed');
  const answer=await sign.json();const candidate=answer.signedURL||answer.signedUrl||'';
  const target=new URL(/^https?:\/\//i.test(candidate)?candidate:config.url+(candidate.startsWith('/storage/v1/')?'':'/storage/v1')+(candidate.startsWith('/')?candidate:'/'+candidate));
  if(target.origin!==new URL(config.url).origin||!target.pathname.startsWith('/storage/v1/object/sign/beneficiary-files/'))throw new Error('Unsafe signed URL');
  res.statusCode=302;res.setHeader('Location',target.href);return res.end();
 }catch(e){console.error('Beneficiary Excel delivery failed:',e.message);return json(res,503,'Excel download temporarily unavailable');}
}

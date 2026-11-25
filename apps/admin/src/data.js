const conf = window.GRAMOS_CONFIG || {};
const configValid = /^https:\/\/[\w-]+\.supabase\.co\/?$/.test(conf.supabaseUrl || '') && !!String(conf.supabaseAnonKey || '').trim() && !String(conf.supabaseAnonKey || '').includes('PASTE_');
// Load the official browser SDK ONLY when the owner has configured Supabase.
// The public demo must still work without a key or if a third-party CDN is unavailable.
if (configValid && !/^\/demo(?:\/|$)/.test(location.pathname) && !window.supabase?.createClient) {
  await new Promise(resolve => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => { script.remove(); resolve(); }, 8000);
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = script.onerror = () => { clearTimeout(timeout); resolve(); };
    document.head.appendChild(script);
  });
}
export const configured = configValid && !!window.supabase?.createClient;
export const api = configured ? window.supabase.createClient(conf.supabaseUrl.replace(/\/$/,''),conf.supabaseAnonKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;

export async function call(q) { const {data,error} = await q; if (error) throw new Error(error.message); return data; }
export async function publishedVillages() { return api ? call(api.from('villages').select('id,slug,name_en,name_mr,district_en,district_mr,status').eq('status','published').order('name_en')) : []; }
export async function villageBySlug(slug) { if (!api) return null; return await call(api.from('villages').select('*').eq('slug',slug).maybeSingle()); }
export async function villageById(id) { if (!api) return null; return await call(api.from('villages').select('*').eq('id',id).maybeSingle()); }
export async function itemsFor(id) { return api ? (await call(api.from('content_items').select('*').eq('village_id',id).order('sort_order',{ascending:true}).order('created_at',{ascending:false}))).filter(x=>!x.deleted_at) : []; }
export async function publishedItemsFor(id) { return api ? (await call(api.from('content_items').select('*').eq('village_id',id).eq('status','published').order('sort_order',{ascending:true}).order('created_at',{ascending:false}))).filter(x=>!x.deleted_at) : []; }
export async function getSession() { if(!api)return null; const {data,error}=await api.auth.getSession(); if(error)throw new Error(error.message||'Session check failed');return data?.session||null; }
export async function accessRole(userId) {
  if (!api || !userId) return {admin:false,ids:[],editorIds:[],reviewerIds:[]};
  const [a,mem] = await Promise.all([
    call(api.from('platform_admins').select('user_id').eq('user_id',userId)),
    call(api.from('village_members').select('village_id,role').eq('user_id',userId))
  ]);
  return {admin:a.length>0,ids:mem.map(x=>x.village_id),editorIds:mem.filter(x=>x.role==='owner'||x.role==='editor').map(x=>x.village_id),reviewerIds:mem.filter(x=>x.role==='reviewer').map(x=>x.village_id)};
}
export async function adminVillages(role) {
  if (!api) return [];
  if (role.admin) return call(api.from('villages').select('*').order('created_at',{ascending:false}));
  if (!role.ids.length) return [];
  return call(api.from('villages').select('*').in('id',role.ids).order('created_at',{ascending:false}));
}
export function storageUrl(path) { return api?.storage.from('village-media').getPublicUrl(path)?.data?.publicUrl || ''; }
/** Shrink camera photographs on the user's device before upload.
 * Photos are converted to WebP, max 1920px and 82% quality. Transparent diagrams
 * stay losslessly represented by WebP (browser encoder handles alpha).
 * The village logo retains its original format for sharp lettering.
 */
export async function compressImage(file, {maxDimension=1920, quality=.84, preserveOriginal=false}={}) {
 if(preserveOriginal || file.type==='image/svg+xml') return file;
 if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Only JPG, PNG and WebP images are accepted.');
 if (!('createImageBitmap' in window)) return file; // Older Safari fallback
 let image;
 try {
   image=await createImageBitmap(file, {imageOrientation:'from-image'});
   const factor=Math.min(1,maxDimension/Math.max(image.width,image.height));
   const width=Math.max(1,Math.round(image.width*factor));
   const height=Math.max(1,Math.round(image.height*factor));
   const canvas=document.createElement('canvas'); canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{alpha:true});
   if(!ctx)return file;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(image,0,0,width,height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
   if(!blob || blob.size>=file.size || blob.type!=='image/webp')return file;
   return new File([blob],file.name.replace(/\.[^.]+$/,'.webp'),{type:'image/webp',lastModified:Date.now()});
 } catch(error){console.warn('Image optimization unavailable; using original',error);return file;}
 finally{image?.close?.();}
}
export async function uploadPublicImage(file,villageId,{preserveOriginal=false}={}) {
 if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Upload a JPG, PNG or WebP image.');
 if (file.size>24*1024*1024) throw new Error('Choose an image smaller than 24 MB (it will be compressed before upload).');
 if (!api) throw new Error('Supabase connection unavailable.');
 const optimized=await compressImage(file,{maxDimension:1920,quality:.84,preserveOriginal});
 if (optimized.size>4*1024*1024)throw new Error('Optimized image remains above the 4 MB limit; use a smaller photograph.');
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[optimized.type];
 const path=`${villageId}/${crypto.randomUUID()}.${ext}`;
 const {error}=await api.storage.from('village-media').upload(path,optimized,{contentType:optimized.type,upsert:false,cacheControl:'31536000'});
 if (error) throw new Error(error.message);
 return storageUrl(path);
}

/** Public PDF forms only; never upload citizen-submitted files here. */
export async function uploadPublicDocument(file,villageId){
 if(!api)throw new Error('Supabase connection unavailable.');
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(villageId||'')))throw new Error('Invalid village ID for PDF upload.');
 if(!file || !/\.pdf$/i.test(file.name) || (file.type && file.type!=='application/pdf'))throw new Error('Select a PDF application form.');
 if(!file.size||file.size>5*1024*1024)throw new Error('PDF must be between 1 byte and 5 MB.');
 const header=new Uint8Array(await file.slice(0,5).arrayBuffer());
 if(String.fromCharCode(...header)!=='%PDF-')throw new Error('The uploaded document is not a valid PDF file.');
 const path=`${villageId}/${crypto.randomUUID()}.pdf`;
 const {error}=await api.storage.from('service-documents').upload(path,file,{contentType:'application/pdf',upsert:false,cacheControl:'31536000'});
 if(error)throw new Error(error.message);
 return api.storage.from('service-documents').getPublicUrl(path).data.publicUrl;
}

/** Upload an XLSX workbook into a private bucket; never expose raw storage URLs.
 * The workbook is NOT parsed into citizen records, and formula cells are never evaluated. */
export async function uploadBeneficiaryWorkbook(file,villageId){
 if(!api)throw new Error('Supabase connection unavailable.');
 if(!/^[0-9a-f-]{36}$/i.test(String(villageId)))throw new Error('Invalid village ID.');
 if(!file||!(/\.xlsx$/i.test(file.name)))throw new Error('Choose a .xlsx Excel workbook. Legacy .xls files are not accepted.');
 if(!file.size||file.size>5*1024*1024)throw new Error('Excel workbook must be 5 MB or smaller.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const dv=new DataView(bytes.buffer);const read16=o=>dv.getUint16(o,true),read32=o=>dv.getUint32(o,true);
 if(bytes.length<100||read32(0)!==0x04034b50)throw new Error('This file is not an XLSX workbook.');
 // Validate ZIP central directory entries without extracting or executing workbook content.
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(read32(i)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('Excel ZIP central directory is missing.');
 const total=read16(end+10),base=read32(end+16);let at=base,expanded=0;const names=[];
 if(total<2||total>1500||base>=end)throw new Error('Invalid Excel archive.');
 for(let i=0;i<total;i++){
  if(at+46>bytes.length||read32(at)!==0x02014b50)throw new Error('Corrupt Excel archive.');
  if(read16(at+8)&1)throw new Error('Encrypted Excel workbooks are not supported.');
  const size=read32(at+24),nlen=read16(at+28),extra=read16(at+30),comment=read16(at+32);
  expanded+=size;if(expanded>30*1024*1024)throw new Error('Excel workbook expands beyond the safe limit.');
  if(nlen>240||at+46+nlen>bytes.length)throw new Error('Invalid Excel entry name.');
  const name=new TextDecoder().decode(bytes.slice(at+46,at+46+nlen));
  if(/[\x00-\x1f]/.test(name)||name.includes('..')||name.startsWith('/')||name.includes('\\')||/(^|\/)vbaProject\.bin$|^xl\/externalLinks\/|^xl\/embeddings\//i.test(name))throw new Error('Macros, external connections and embedded files are not allowed.');
  names.push(name);at+=46+nlen+extra+comment;
 }
 if(!names.includes('[Content_Types].xml')||!names.includes('xl/workbook.xml')||!names.some(n=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(n)))throw new Error('The file is missing required XLSX workbook parts.');
 const path=`${villageId}/${crypto.randomUUID()}.xlsx`;
 const {error}=await api.storage.from('beneficiary-files').upload(path,file,{contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',upsert:false,cacheControl:'0'});
 if(error)throw new Error(error.message);
 return path;
}


/** Site editing drafts are independent from the live public village record. */
export async function getSiteDraft(id){
 if(!api||!id)return null;
 return call(api.from('village_site_drafts').select('changes,revision,updated_at').eq('village_id',id).maybeSingle());
}
export async function saveSiteDraft(id,patch){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_save_site_draft',{p_village_id:id,p_patch:patch}));
}
export async function publishSiteDraft(id){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_publish_site_draft',{p_village_id:id}));
}
export async function discardSiteDraft(id){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_discard_site_draft',{p_village_id:id}));
}
export async function getPlatformBranding(){
 if(!api)return {footer_logos:[]};
 return await call(api.from('gramos_platform_branding').select('footer_logos,footer_settings,updated_by').eq('id',1).maybeSingle()) || {footer_logos:[]};
}
export function withVillageDraft(v,changes){
 if(!v||!changes||typeof changes!=='object')return v;
 return {...v,...Object.fromEntries(Object.entries(changes).filter(([k])=>k!=='site_settings')),
   site_settings:{...(v.site_settings||{}),...(changes.site_settings||{})}};
}
/** @deprecated v4.3: each village exclusively owns its header and footer settings.
 * Keep the compatibility symbol but NEVER merge cross-village branding into public data. */
export function withGlobalLogos(v,_unusedPlatformBranding){return v;}
export async function saveGlobalLogos(logos,footerSettings={}){
 if(!api)throw new Error('Database connection unavailable.');
 return call(api.rpc('gramos_set_platform_branding',{p_logos:logos,p_settings:footerSettings}));
}
export async function uploadPlatformImage(file){
 if(!api||!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Upload a JPG, PNG or WebP image.');
 if(file.size>24*1024*1024)throw new Error('Choose an image smaller than 24 MB.');
 const f=await compressImage(file,{maxDimension:1440,quality:.88,preserveOriginal:true});
 if(f.size>4*1024*1024)throw new Error('Image exceeds 4 MB. Use a smaller file.');
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[f.type];
 const path=`platform/${crypto.randomUUID()}.${ext}`;
 const {error}=await api.storage.from('village-media').upload(path,f,{contentType:f.type,upsert:false});
 if(error)throw new Error(error.message);
 return storageUrl(path);
}

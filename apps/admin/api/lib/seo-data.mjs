/** Public-only Supabase REST reads. No service-role credentials. */
import {readFile} from 'node:fs/promises';
const configURL=new URL('../../config.js',import.meta.url);
export async function publicConfig(){
 let url=process.env.SUPABASE_URL||'';
 let key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
 // Development-only convenience: reuse the public, non-secret config.js settings.
 if((!url||!key)&&!process.env.VERCEL){
  try{const source=await readFile(configURL,'utf8');
   url ||= source.match(/supabaseUrl:\s*['"]([^'"\s]+)['"]/)?.[1]||'';
   key ||= source.match(/supabaseAnonKey:\s*['"]([^'"\s]+)['"]/)?.[1]||'';
  }catch{}
 }
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)||!key||/PASTE_|REPLACE_|YOUR_/.test(key))throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY on the server.');
 return {url:url.replace(/\/$/,''),key};
}
export async function dbRows(table,fields,filters={}, {fetcher=fetch,config,max=10000}={}){
 const conf=config||await publicConfig();let rows=[];
 for(let offset=0;offset<max;offset+=1000){
  const u=new URL(`${conf.url}/rest/v1/${table}`);u.searchParams.set('select',fields);
  for(const [k,v] of Object.entries(filters))u.searchParams.set(k,v);
  u.searchParams.set('limit','1000');u.searchParams.set('offset',String(offset));
  const r=await fetcher(u.href,{headers:{apikey:conf.key,Accept:'application/json'},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error(`Supabase public read failed (${r.status} for ${table}). Check RLS and env.`);
  const page=await r.json();if(!Array.isArray(page))throw new Error('Invalid Supabase response');
  rows.push(...page);if(page.length<1000)return rows;
 }
 throw new Error('Sitemap size limit reached. Use pagination/sitemap index for >10000 records.');
}
export const publicVillages=(opts)=>dbRows('villages','id,slug,name_mr,name_en,tagline_mr,tagline_en,hero_image_url,logo_url,site_settings,status,updated_at',{status:'eq.published'},opts);
export const publicNews=(opts)=>dbRows('content_items','id,village_id,slug,title_mr,title_en,body_mr,body_en,image_url,status,updated_at',{status:'eq.published',kind:'eq.news'},opts);
export const publicVillage=async(slug,opts)=>{
 const rows=await dbRows('villages','id,slug,name_mr,name_en,tagline_mr,tagline_en,hero_image_url,logo_url,site_settings,status,updated_at',{slug:`eq.${slug}`,status:'eq.published'},opts);
 return rows[0]||null;
};
export const publicArticle=async(villageId,slug,opts)=>{
 const rows=await dbRows('content_items','id,village_id,slug,title_mr,title_en,body_mr,body_en,image_url,status,updated_at',{village_id:`eq.${villageId}`,slug:`eq.${slug}`,kind:'eq.news',status:'eq.published'},opts);
 return rows[0]||null;
};

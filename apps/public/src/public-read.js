// Public-only REST reads. Never use private keys or read drafts here.
const config=window.GRAMOS_CONFIG||{};
const url=String(config.supabaseUrl||'').replace(/\/$/,'');
const key=String(config.supabaseAnonKey||'');
export const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)&&!!key&&!/PASTE_|REPLACE_|YOUR_/.test(key);
export async function publicRows(table,filters,signal){
 if(!configured)throw new Error('Website database configuration is missing.');
 if(!['villages','content_items'].includes(table))throw new Error('Unsupported public query');
 const endpoint=new URL(url+'/rest/v1/'+table);
 endpoint.searchParams.set('select','*');endpoint.searchParams.set('status','eq.published');
 for(const [k,v] of Object.entries(filters))endpoint.searchParams.set(k,v);
 const headers={apikey:key,Accept:'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const controller=new AbortController();const abort=()=>controller.abort();
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(abort,12000);
 try{const response=await fetch(endpoint,{headers,signal:controller.signal});
 if(!response.ok)throw new Error('Website database request failed ('+response.status+').');
 const rows=await response.json();if(!Array.isArray(rows))throw new Error('Invalid database response.');return rows;
 }catch(error){if(controller.signal.aborted)throw new Error('Website data request timed out or was cancelled.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
let initialVillage=window.GRAMOS_INITIAL_VILLAGE;
try{delete window.GRAMOS_INITIAL_VILLAGE;}catch{}
if(!initialVillage||initialVillage.status!=='published'||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(initialVillage.slug)||!(/^[a-f0-9-]{36}$/i).test(initialVillage.id))initialVillage=null;
// Start loading content while the rest of the application modules are downloading.
let initialContent=initialVillage?{id:initialVillage.id,promise:fetchPublishedItems(initialVillage.id).then(rows=>({rows}),error=>({error}))}:null;
export async function villageBySlug(slug,signal){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;if(signal?.aborted)throw new Error('Website data request cancelled.');const seed=initialVillage;initialVillage=null;if(seed?.slug===slug)return seed;initialContent=null;return (await publicRows('villages',{slug:'eq.'+slug,limit:'1'},signal))[0]||null;}
async function fetchPublishedItems(id,signal){
 const rows=[];for(let offset=0;offset<10000;offset+=1000){const batch=await publicRows('content_items',{village_id:'eq.'+id,order:'sort_order.asc,created_at.desc,id.asc',limit:'1000',offset:String(offset)},signal);rows.push(...batch);if(batch.length<1000)return rows.filter(x=>!x.deleted_at);}
 throw new Error('Website has too many content records.');
}

export async function publishedItemsFor(id,signal){
 const warm=initialContent;initialContent=null;
 if(warm?.id===id){const result=await warm.promise;if(signal?.aborted)throw new Error('Website data request cancelled.');if(result.error)throw result.error;return result.rows;}
 return fetchPublishedItems(id,signal);
}

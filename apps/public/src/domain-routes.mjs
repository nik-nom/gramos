/** Untrusted Host header normalization and tenant isolation helpers. */
export function normalizedHost(value){
 if(typeof value!=='string'||value.includes(',')||/[\s\\/@#?]/.test(value))return '';
 const host=value.toLowerCase().trim().replace(/\.$/,'').replace(/:\d{1,5}$/,'');
 if(host.length>253||!host||host.includes('..'))return '';
 if(host==='localhost'||host==='127.0.0.1')return host;
 if(!host.includes('.')||!host.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))return '';
 return host;
}
export function validVillageDomain(value){
 const host=normalizedHost(value);
 return host&&host.includes('.')&&!/^(?:localhost|127\.0\.0\.1)$/.test(host)&&!host.endsWith('.vercel.app')&& !host.endsWith('.supabase.co') && !/^\d+(?:\.\d+){3}$/.test(host)&& !host.endsWith('.local') ? host : '';
}
export function isSharedPublicHost(host,env=process.env){
 if(host==='localhost'||host==='127.0.0.1')return true;
 // Vercel routes requests to a project only for assigned domains. Never infer a tenant from this.
 if(host==='gramos-public.vercel.app')return true;
 if(host&&host===normalizedHost(env.PUBLIC_SHARED_HOST||''))return true;
 if(host&&host===normalizedHost(env.VERCEL_URL||''))return true;
 // Preview deployment domains for this Vercel project.
 if(env.VERCEL==='1' && /^gramos-public-[a-z0-9-]+\.vercel\.app$/.test(host))return true;
 return false;
}
export function villagePath(slug,tail=''){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug)))throw new Error('Invalid village slug');
 return '/v/'+slug+(tail||'');
}
export function domainDestination(host,originalPath,search=''){
 const canonical=validVillageDomain(host);
 if(!canonical||!/^\/v\/[a-z0-9-]+(?:\/[a-z0-9-]+){0,2}\/?$/.test(originalPath))return '';
 const params=new URLSearchParams(search.startsWith('?')?search.slice(1):search);
 params.delete('preview');
 return `https://${canonical}${originalPath}${params.size?'?'+params:''}`;
}

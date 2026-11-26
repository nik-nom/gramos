export const PAGES=['home','about','services','projects','schemes','beneficiaries','notices','news','gallery','contact','staff','leaders','facilities','pages'];
export const slugOK=s=>typeof s==='string'&&s.length<=90&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
export function routeFor(path,bound){
 const a=String(path).split('/').filter(Boolean);let slug,tail;
 if(a[0]==='v'){slug=a[1];tail=a.slice(2);if(bound&&slug!==bound)return null;}
 else{if(!bound)return null;slug=bound;tail=a;}
 if(!slugOK(slug)||tail.length>2||tail.length&&!PAGES.includes(tail[0])||tail.length===2&&(!['news','pages'].includes(tail[0])||!slugOK(tail[1])))return null;
 return {slug,page:tail[0]||'home',article:tail[1]||'',tail};
}
export function cleanPath(path,slug){const p='/v/'+slug;if(path===p||path===p+'/')return '/';return path.startsWith(p+'/')?path.slice(p.length):path;}
export function browserRoute(path,bound){if(!bound)return path.split('/').filter(Boolean);const r=routeFor(path,bound);return r?['v',r.slug,...r.tail]:['not-found'];}

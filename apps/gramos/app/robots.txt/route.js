import {getPublicHostContext} from '../../lib/domain-request';
import {robotsTXT} from '../../lib/domain-core.mjs';
export const dynamic='force-dynamic';
export const revalidate=0;
export async function GET(){
 let ctx;try{ctx=await getPublicHostContext()}catch{ctx={kind:'unknown',host:''};}
 return new Response(robotsTXT(ctx.host,ctx.kind==='custom'),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Vary':'Host'}});
}

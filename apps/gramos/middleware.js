import {NextResponse} from 'next/server';
import {normalizeHostname,isSharedHostname,routeOnCustomHost,previewToClean} from './lib/domain-core.mjs';
import {resolveDomain} from './lib/domain-data';
export async function middleware(request){
 if(process.env.GRAMOS_DEPLOYMENT_ROLE==='admin')return NextResponse.next();
 // Do not trust x-forwarded-host or any caller-provided x-gramos-* headers.
 const host=normalizeHostname(request.headers.get('host'));
 if(!host)return new NextResponse('Invalid hostname',{status:400});
 if(isSharedHostname(host,process.env)){
  if(request.nextUrl.pathname.startsWith('/admin')||request.nextUrl.pathname.startsWith('/api/admin'))return new NextResponse('Not found',{status:404});
  const r=NextResponse.next();
  if(request.nextUrl.pathname.startsWith('/v/')||request.nextUrl.pathname==='/')r.headers.set('X-Robots-Tag','noindex, nofollow');
  return r;
 }
 let domain;
 try{domain=await resolveDomain(host);}catch{return new NextResponse('Site unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
 if(!domain)return new NextResponse('Domain not active',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
 const {pathname,search}=request.nextUrl;
 if(domain.redirectHost){
  if(pathname==='/robots.txt')return new NextResponse('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  if(pathname==='/sitemap.xml')return new NextResponse('Not found',{status:404});
  const target=previewToClean(pathname,domain.site.slug)||pathname;
  const safe=routeOnCustomHost(target,domain.site.slug);
  if(safe.kind!=='rewrite')return new NextResponse('Not found',{status:404});
  return NextResponse.redirect(new URL(`https://${domain.redirectHost}${target}${search}`),308);
 }
 const action=routeOnCustomHost(pathname,domain.site.slug);
 if(action.kind==='reject')return new NextResponse('Not found',{status:404});
 if(action.kind==='redirect')return NextResponse.redirect(new URL(action.target+search,request.url),308);
 if(action.kind==='pass')return NextResponse.next();
 const url=request.nextUrl.clone();url.pathname=action.target;
 return NextResponse.rewrite(url,{headers:{'Cache-Control':'no-store'}});
}
export const config={matcher:['/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|woff|woff2)$).*)']};

import {headers} from 'next/headers';
import {normalizeHostname,isSharedHostname} from './domain-core.mjs';
import {resolveDomain} from './domain-data';
export async function getPublicHostContext() {
 const h=await headers();
 // Never use x-forwarded-host; it is not an authorization source.
 const host=normalizeHostname(h.get('host'));
 if(!host)return {kind:'unknown',host:''};
 if(isSharedHostname(host,process.env))return {kind:'shared',host};
 const domain=await resolveDomain(host);
 if(!domain)return {kind:'unknown',host};
 return {kind:domain.redirectHost?'redirect':'custom',host,domain};
}

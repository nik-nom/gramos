import {createPublicClient} from './supabase';
import {resolveDomainRows,primaryDomainRows} from './domain-lookup.mjs';
export const resolveDomain=(host,db=createPublicClient())=>resolveDomainRows(host,db);
export const primaryDomain=(siteId,db=createPublicClient())=>primaryDomainRows(siteId,db);

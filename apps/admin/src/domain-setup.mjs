import {validVillageDomain} from './domain-routes.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseDomainInput(raw){
 let value=String(raw||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
 if(value&&!value.includes('.'))value+='.vercel.app';
 const hostname=validVillageDomain(value);if(!hostname||value.includes(':'))throw new Error('Enter a valid domain, such as village.com, without a page path.');return hostname;
}
function preferred(raw,key){if(!Array.isArray(raw))return [];const ranked=raw.filter(x=>x&&typeof x==='object'&&(Array.isArray(x[key])||typeof x[key]==='string'));if(!ranked.length)return [];const best=Math.min(...ranked.map(x=>Number.isFinite(x.rank)?x.rank:Infinity));return [...new Set(ranked.filter(x=>(Number.isFinite(x.rank)?x.rank:Infinity)===best).flatMap(x=>x[key]).filter(x=>typeof x==='string'&&x.length<254))];}
export function dnsRows(domain){const d=domain.vercel_details||{}, rows=[];const host=domain.hostname||'';
 // Use full hostnames, not guessed relative names; registrars differ in their input format.
 const apex=d.apexDomain===host || (!d.apexDomain&&host.split('.').length===2);
 if(!host.endsWith('.vercel.app')){
  if(apex)for(const value of preferred(d.recommendedIPv4,'value'))rows.push(['A',host,value]);
  else for(const value of preferred(d.recommendedCNAME,'value'))rows.push(['CNAME',host,value]);
 }
 for(const x of Array.isArray(d.verification)?d.verification:[])if(x?.value&&x?.domain)rows.push([x.type||'TXT',x.domain,x.value]);
 return rows;
}
export function renderDNSRecords(domain,lang){const mr=lang==='mr',d=domain.vercel_details||{},rows=dnsRows(domain);if(domain.hostname.endsWith('.vercel.app'))return '';return `<div class="admin-blue-note"><strong>${mr?'DNS सेटअप':'DNS setup at your domain provider'}</strong><p>${mr?'डोमेनच्या DNS सेटिंग्जमध्ये खालील रेकॉर्ड जोडा.':'Open DNS settings at your registrar (e.g. GoDaddy or Hostinger). Use @ for the root domain if required; for a subdomain use the relative name. Keep existing email MX records.'}</p>${rows.length?`<div style="overflow-x:auto"><table><thead><tr><th>Type</th><th>Host</th><th>Value</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td><code style="user-select:all">${esc(v)}</code></td>`).join('')}</tr>`).join('')}</tbody></table></div>`:`<p>${mr?'Vercel मधील DNS रेकॉर्ड पहा किंवा पडताळणी पुन्हा करा.':'No DNS values returned yet. Open the public project’s Domains tab in Vercel for the exact records, or click Verify & activate again.'}</p>`}<p>${d.dnsReady===true?'DNS: ready':d.dnsReady===false?'DNS: pending':'DNS: not checked'} · ${d.vercelVerified===true?'Ownership: verified':d.vercelVerified===false?'Ownership: pending':'Ownership: not checked'}</p><a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">Open Vercel dashboard ↗</a></div>`;}

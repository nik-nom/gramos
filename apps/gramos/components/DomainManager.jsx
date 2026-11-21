'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '../lib/supabase';

const words={
 en:{title:'Domain Management',subtitle:'Connect a village’s own domain to the shared public website.',back:'Back to Studio',village:'Village website',domain:'New domain',add:'Register domain',list:'Registered domains',none:'No domains registered for this village.',check:'Check DNS and ownership',activate:'Activate website',rollback:'Restore as primary',remove:'Remove domain',confirm:'Type the hostname to confirm removal:',ready:'Ready for activation',pending:'DNS or ownership pending',active:'Active domain',redirect:'Redirecting old domain',removing:'Removal pending',dns:'DNS setup',verify:'Ownership verification',records:'Vercel DNS recommendations',help:'Ask the village domain owner to add the DNS records at their registrar. Wait for DNS propagation, then check again. No changes to their domain ownership or registrar account are required.',change:'To change the domain: register the new one, verify it, then activate it. The old one redirects to the new one and can be restored.',notAdmin:'Only a platform administrator with verified MFA can manage domains.',login:'Sign in and verify MFA in Studio first.',activated:'Domain activated. The village remains on its own URL.',removed:'Domain disabled and removed from the Vercel project.',registered:'Registered with Vercel. Follow the DNS instructions below.',checked:'Provider status updated.',loading:'Checking your permissions…',retry:'Try again'},
 mr:{title:'डोमेन व्यवस्थापन',subtitle:'प्रत्येक गावाचे स्वतंत्र डोमेन एका सार्वजनिक वेबसाइट प्रकल्पाशी जोडा.',back:'स्टुडिओकडे परत',village:'ग्रामपंचायत वेबसाइट',domain:'नवीन डोमेन',add:'डोमेन नोंदवा',list:'नोंदवलेली डोमेन',none:'या गावासाठी अजून डोमेन नाही.',check:'DNS आणि मालकी तपासा',activate:'वेबसाइट सुरू करा',rollback:'मुख्य डोमेन पुन्हा सुरू करा',remove:'डोमेन काढा',confirm:'काढण्यासाठी डोमेन नाव तंतोतंत लिहा:',ready:'सुरू करण्यास तयार',pending:'DNS / मालकी पडताळणी बाकी',active:'सक्रिय डोमेन',redirect:'जुन्या डोमेनवरून वळवत आहे',removing:'काढण्याची प्रक्रिया बाकी',dns:'DNS सेटिंग',verify:'मालकी पडताळणी',records:'Vercel ने दिलेले DNS रेकॉर्ड',help:'डोमेन मालकाने आपल्या रजिस्ट्रारमध्ये दिलेले DNS रेकॉर्ड टाकावेत. DNS बदल लागू झाल्यावर पुन्हा तपासा. डोमेनची मालकी बदलण्याची गरज नाही.',change:'डोमेन बदलण्यासाठी नवीन नोंदवा, पडताळा आणि सक्रिय करा. जुने डोमेन नवीनकडे वळेल. आवश्यक असल्यास जुने पुन्हा सुरू करता येईल.',notAdmin:'हे काम फक्त MFA पडताळणी पूर्ण केलेला मुख्य प्रशासक करू शकतो.',login:'आधी स्टुडिओमध्ये प्रवेश करून MFA पडताळा.',activated:'डोमेन सक्रिय झाले. वेबसाइट स्वतःच्या पत्त्यावर दिसेल.',removed:'डोमेन Vercel प्रकल्पातून काढले.',registered:'Vercel मध्ये नोंदले. खालील DNS सेटिंग पूर्ण करा.',checked:'नवीन स्थिती तपासली.',loading:'अधिकार तपासत आहे…',retry:'पुन्हा प्रयत्न करा'}
};
function DnsRecords({row,w}){
 const details=row.verification_details||{},verify=details.verification||[],cnames=details.recommendedCNAME||[],ipv4=details.recommendedIPv4||[];
 return <div className="domains-dns">
  <h4>{w.verify}</h4>{verify.length?verify.map((r,i)=><div className="dns-value" key={i}><span>{r.type} / {r.name}</span><code>{r.value}</code></div>):<p>No additional ownership TXT record returned by Vercel. Check the domain’s status after setting DNS.</p>}
  <h4>{w.records}</h4>{cnames.length||ipv4.length?<>{cnames.map((r,i)=><div className="dns-value" key={'c'+i}><span>CNAME</span><code>{typeof r==='string'?r:JSON.stringify(r)}</code></div>)}{ipv4.map((r,i)=><div className="dns-value" key={'a'+i}><span>A / IPv4</span><code>{typeof r==='string'?r:JSON.stringify(r)}</code></div>)}</>:<p>Open Vercel → Public project → Settings → Domains → {row.hostname} for the exact DNS values. Do not guess the IP address or CNAME.</p>}
 </div>;
}
export default function DomainManager(){
 const db=useMemo(()=>createBrowserClient(),[]);
 const [lang,setLang]=useState('en');const w=words[lang];
 const [authorized,setAuthorized]=useState(false),[checking,setChecking]=useState(true),[villages,setVillages]=useState([]),[selected,setSelected]=useState('');
 const [domains,setDomains]=useState([]),[hostname,setHostname]=useState(''),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState('');
 useEffect(()=>{try{setLang(localStorage.getItem('gramos_admin_language')==='mr'?'mr':'en')}catch{}},[]);
 const accessToken=useCallback(async()=>{
  const s=await db.auth.getSession();const token=s.data?.session?.access_token;
  if(!token)throw new Error(w.login);
  return token;
 },[db,w.login]);
 const call=useCallback(async(body,method='POST')=>{
  const token=await accessToken();
  const path='/api/admin/domains'+(method==='GET'?`?siteId=${encodeURIComponent(body.siteId)}`:'');
  const res=await fetch(path,{method,headers:{Authorization:`Bearer ${token}`,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{}),cache:'no-store'});
  const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||`HTTP ${res.status}`);return data;
 },[accessToken]);
 useEffect(()=>{let live=true;(async()=>{
  const s=await db.auth.getSession();if(!s.data?.session)return;
  const [mfa,admin,sites]=await Promise.all([db.auth.mfa.getAuthenticatorAssuranceLevel(),db.rpc('is_platform_admin'),db.from('village_sites').select('id,slug').order('slug')]);
  if(!live)return;
  const ok=mfa.data?.currentLevel==='aal2'&&admin.data===true&&!sites.error;
  setAuthorized(ok);if(ok){setVillages(sites.data||[]);setSelected(sites.data?.[0]?.id||'');}
 })().catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setChecking(false)});return()=>{live=false}},[db]);
 const refresh=useCallback(async()=>{if(!authorized||!selected)return;try{const r=await call({siteId:selected},'GET');setDomains(r.domains||[]);setError('');}catch(e){setError(e.message)}},[authorized,selected,call]);
 useEffect(()=>{refresh()},[refresh]);
 async function act(action,name){
  if(!selected||busy)return;
  let confirmation;
  if(action==='remove'){
   confirmation=window.prompt(`${w.confirm} ${name}`);
   if(confirmation!==name)return;
  }
  if((action==='activate'||action==='rollback')&&!window.confirm(`${name}: ${w.activate}?`))return;
  setBusy(name||action);setNotice('');setError('');
  try{
   await call({action,siteId:selected,hostname:name||hostname.trim().toLowerCase(),...(action==='remove'?{confirmation}:{})});
   setNotice(action==='add'?w.registered:action==='remove'?w.removed:action==='activate'||action==='rollback'?w.activated:w.checked);
   if(action==='add')setHostname('');await refresh();
  }catch(e){setError(e.message);await refresh()}finally{setBusy('')}
 }
 return <main className="domain-manager"><div className="domain-manager-inner"><div className="domains-top"><div><div className="domains-eyebrow">GRAMOS / ADMIN</div><h1>{w.title}</h1><p>{w.subtitle}</p></div><div className="domains-actions"><select value={lang} onChange={e=>{setLang(e.target.value);try{localStorage.setItem('gramos_admin_language',e.target.value)}catch{}}}><option value="en">English</option><option value="mr">मराठी</option></select><Link href="/admin" className="domains-back">{w.back}</Link></div></div>
 {checking?<section className="domains-panel">{w.loading}</section>:!authorized?<section className="domains-panel"><p>{w.notAdmin}</p><p>{w.login}</p><Link href="/admin">{w.back}</Link></section>:<>
 <section className="domains-panel"><label className="domains-label">{w.village}<select value={selected} onChange={e=>setSelected(e.target.value)}>{villages.map(v=><option value={v.id} key={v.id}>{v.slug}</option>)}</select></label><div className="domains-add"><label className="domains-label">{w.domain}<input value={hostname} maxLength={253} onChange={e=>setHostname(e.target.value)} placeholder="myvillage.in" autoCapitalize="none" spellCheck={false}/></label><button disabled={!hostname.trim()||Boolean(busy)||!selected} onClick={()=>act('add')}>{w.add}</button></div><p className="domains-hint">{w.help}</p><p className="domains-hint">{w.change}</p></section>
 {error?<p className="domains-error" role="alert">{error}</p>:null}{notice?<p className="domains-success" role="status">{notice}</p>:null}
 <h2 className="domains-list-heading">{w.list}</h2>{!domains.length?<section className="domains-panel">{w.none}</section>:domains.map(row=>{
  const verified=Boolean(row.verified_at&&row.dns_verified_at);const live=row.status==='active';
  const title=live?w.active:row.status==='redirect'?w.redirect:row.status==='removing'?w.removing:verified?w.ready:w.pending;
  return <section className="domains-panel domains-entry" key={row.hostname}><div className="domains-entry-top"><div><h3>{row.hostname}</h3><p>{title}</p></div><span className="domain-state">{row.status}{verified?' · verified':''}</span></div>
   <div className="domains-entry-links">{live?<a href={'https://'+row.hostname} target="_blank" rel="noopener noreferrer">https://{row.hostname}</a>:null}{row.redirect_to?<span>→ {row.redirect_to}</span>:null}</div>
   <div className="domains-buttons"><button disabled={Boolean(busy)} onClick={()=>act('check',row.hostname)}>{w.check}</button>{verified&&row.status==='pending'?<button disabled={Boolean(busy)} onClick={()=>act('activate',row.hostname)}>{w.activate}</button>:null}{verified&&row.status==='redirect'?<button disabled={Boolean(busy)} onClick={()=>act('rollback',row.hostname)}>{w.rollback}</button>:null}<button className="domains-danger" disabled={Boolean(busy)} onClick={()=>act('remove',row.hostname)}>{w.remove}</button></div>
   {!verified?<DnsRecords row={row} w={w}/>:null}{row.last_error?<p className="domains-error">{row.last_error}</p>:null}{row.last_checked_at?<small>Last checked: {new Date(row.last_checked_at).toLocaleString()}</small>:null}
  </section>})}
 </>}
 </div></main>;
}

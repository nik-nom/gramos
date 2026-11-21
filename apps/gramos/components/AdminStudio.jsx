'use client';
import {useEffect,useMemo,useState,useCallback} from 'react';
import Link from 'next/link';
import {createBrowserClient} from '../lib/supabase';
import {ALL_PAGES,hrefFor} from '../lib/pages';
import {UI,t} from '../lib/admin-i18n';
import {HOME_SECTIONS,printCards,parseCardLines} from '../lib/home-sections';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import Home from './Home';
import BlankPage from './BlankPage';

const EMPTY_FOOTER={social_heading:'समाज माध्यमे',social_text:'ग्रामपंचायत कार्यालयाची अधिकृत समाज माध्यमे',resources_heading:'महत्वाची संकेतस्थळे',pages_heading:'महत्वाची पाने',contact_heading:'संपर्क माहिती',copyright_note:'सर्व हक्क राखीव.',credit:'',office:'',phone:'',email:'',hours:'',year_override:null,links:[]};
const EMPTY_HOME={title:'',welcome:'',hero_image:'',sections:{}};
const EMPTY_BODY={body_mr:''};
const MIME=['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg','image/webp'];
const fingerprint=x=>JSON.stringify(x||{});
const prefix='GramOS 2.1 + Domains';
const isSchemaMissing=error=>['PGRST202','PGRST205','42P01','42883'].includes(error?.code)||/could not find the function|does not exist|schema cache/i.test(error?.message||'');
function defaultValue(pageKey){return pageKey==='home'?EMPTY_HOME:EMPTY_BODY}
function Field({label,value,onChange,textarea=false,rows=3,type='text',placeholder=''}){
 return <label className="studio-field"><span>{label}</span>{textarea?<textarea rows={rows} value={value??''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>:<input type={type} value={value??''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</label>;
}
function Modal({title,children,onClose}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="help-modal" role="dialog" aria-modal="true" aria-label={title}><div className="between"><h2>{title}</h2><button className="icon-close" onClick={onClose} aria-label="Close">✕</button></div>{children}</section></div>}
export default function AdminStudio(){
 const db=useMemo(()=>createBrowserClient(),[]);
 const [locale,setLocale]=useState('mr');
 const l=useCallback((key)=>t(locale,key),[locale]);
 const [session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [status,setStatus]=useState(''),[statusError,setStatusError]=useState(false),[busy,setBusy]=useState(false),[initialized,setInitialized]=useState(false);
 const [verified,setVerified]=useState(false),[platformAdmin,setPlatformAdmin]=useState(false),[mfaFactor,setMfaFactor]=useState(''),[mfaChallenge,setMfaChallenge]=useState(''),[mfaCode,setMfaCode]=useState('');
 const [villages,setVillages]=useState([]),[selected,setSelected]=useState(''),[pageKey,setPageKey]=useState('home'),[mode,setMode]=useState('villages');
 const [schemaReady,setSchemaReady]=useState(null),[data,setData]=useState(EMPTY_HOME),[savedData,setSavedData]=useState(EMPTY_HOME),[pageRevision,setPageRevision]=useState(1),[publishedVersion,setPublishedVersion]=useState(0);
 const [footer,setFooter]=useState(EMPTY_FOOTER),[savedFooter,setSavedFooter]=useState(EMPTY_FOOTER),[footerRevision,setFooterRevision]=useState(1),[footerLinks,setFooterLinks]=useState(''),[savedLinks,setSavedLinks]=useState('');
 const [files,setFiles]=useState([]),[currentPageId,setCurrentPageId]=useState(''),[file,setFile]=useState(null),[fileTitle,setFileTitle]=useState('');
 const [showCreate,setShowCreate]=useState(false),[showHelp,setShowHelp]=useState(false),[showDelete,setShowDelete]=useState(null),[deleteConfirm,setDeleteConfirm]=useState('');
 const [newName,setNewName]=useState(''),[newSlug,setNewSlug]=useState(''),[newTaluka,setNewTaluka]=useState(''),[newDistrict,setNewDistrict]=useState('');
 const [activeSection,setActiveSection]=useState('gallery'),[previewDevice,setPreviewDevice]=useState('desktop');
 const selectedSite=villages.find(x=>x.id===selected);
 const page=ALL_PAGES.find(p=>p.key===pageKey);
 const currentPublicUrl=hrefFor(selectedSite?.slug||'village',pageKey);
 const publicBase=process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/,'')||'';
 const pageDirty=fingerprint(data)!==fingerprint(savedData);
 const footerDirty=fingerprint(footer)!==fingerprint(savedFooter)||footerLinks!==savedLinks;
 const dirty=pageDirty||footerDirty;
 const isArchived=!!selectedSite?.archived_at;
 const isPublic=!!selectedSite?.published&&!isArchived;
 const [viewArchived,setViewArchived]=useState(false);
 const visibleVillages=villages.filter(v=>viewArchived?!!v.archived_at:!v.archived_at);
 const say=(s,error=false)=>{setStatus(s);setStatusError(error)};
 const field=(key,value)=>setData(d=>({...d,[key]:value}));
 function selectLang(next){setLocale(next);try{localStorage.setItem('gramos_admin_language',next)}catch{}}
 useEffect(()=>{try{setLocale(localStorage.getItem('gramos_admin_language')==='en'?'en':'mr')}catch{}},[]);
 const refreshVillages=useCallback(async()=>{
  const res=await db.from('village_sites').select('id,slug,published,archived_at,content').order('slug');
  if(res.error){say(res.error.message,true);return;}
  setVillages(res.data||[]);
  setSelected(old=>old&&(res.data||[]).some(v=>v.id===old)?old:((res.data||[]).find(v=>!v.archived_at)?.id||res.data?.[0]?.id||''));
 },[db]);
 const bootstrap=useCallback(async()=>{
  const s=await db.auth.getSession();setSession(s.data?.session||null);
  if(!s.data?.session){setVerified(false);setInitialized(true);return;}
  const [mfa,role]=await Promise.all([db.auth.mfa.getAuthenticatorAssuranceLevel(),db.rpc('is_platform_admin')]);
  const good=mfa.data?.currentLevel==='aal2';setVerified(good);setPlatformAdmin(role.data===true);
  if(!good){const factors=await db.auth.mfa.listFactors();setMfaFactor((factors.data?.totp||[]).find(x=>x.status==='verified')?.id||'');setInitialized(true);return;}
  await refreshVillages();setInitialized(true);
 },[db,refreshVillages]);
 useEffect(()=>{bootstrap().catch(e=>say(e.message,true));const sub=db.auth.onAuthStateChange((event,s)=>{setSession(s||null);if(!s){setVillages([]);setVerified(false);setSelected('')}});return()=>sub.data.subscription.unsubscribe()},[db,bootstrap]);
 useEffect(()=>{if(!verified)return;let alive=true;db.from('site_pages').select('id').limit(1).then(r=>{if(!alive)return;if(r.error){setSchemaReady(false);if(isSchemaMissing(r.error))say(t(locale,'setupRequired'),true)}else setSchemaReady(true)});return()=>{alive=false}},[verified,db]);
 useEffect(()=>{if(!selected||!verified){return;}let alive=true;(async()=>{
  const [pr,fr,dr,pub]=await Promise.all([
   db.rpc('gramos_get_page_draft',{p_site_id:selected,p_page_key:pageKey}),
   db.rpc('gramos_get_footer_draft',{p_site_id:selected}),
   db.from('site_documents').select('id,site_id,page_id,title_mr,storage_path,draft_visible,is_published,created_at').eq('site_id',selected).order('created_at',{ascending:false}),
   db.from('site_pages').select('id,path,published_revision,is_published').eq('site_id',selected).eq('path',pageKey==='home'?'/':`/${pageKey}`).maybeSingle()
  ]);
  if(!alive)return;
  if(pr.error){setSchemaReady(false);say((isSchemaMissing(pr.error)?l('setupRequired'):pr.error.message),true);return;}
  setSchemaReady(true);
  const v=pr.data?.draft_content||defaultValue(pageKey);setData(v);setSavedData(v);setPageRevision(Number(pr.data?.draft_version||1));
  setCurrentPageId(pub.data?.id||'');setPublishedVersion(Number(pub.data?.published_revision||0));
  if(fr.error){say(fr.error.message,true)}else{
   const f={...EMPTY_FOOTER,...(fr.data?.draft_content||{})};const links=(f.links||[]).map(x=>`${x.group}|${x.label_mr}|${x.url}`).join('\n');
   setFooter(f);setSavedFooter(f);setFooterLinks(links);setSavedLinks(links);setFooterRevision(Number(fr.data?.draft_version||1));
  }
  if(!dr.error)setFiles(dr.data||[]);
 })().catch(e=>alive&&say(e.message,true));return()=>{alive=false}},[selected,pageKey,verified,db]);
 async function signIn(e){e.preventDefault();setBusy(true);const r=await db.auth.signInWithPassword({email,password});setBusy(false);if(r.error){say(r.error.message,true);return;}setPassword('');await bootstrap();}
 async function verifyMfa(e){e.preventDefault();if(!mfaFactor)return;setBusy(true);let challenge=mfaChallenge;
  if(!challenge){const c=await db.auth.mfa.challenge({factorId:mfaFactor});if(c.error){setBusy(false);say(c.error.message,true);return;}challenge=c.data.id;setMfaChallenge(challenge)}
  const r=await db.auth.mfa.verify({factorId:mfaFactor,challengeId:challenge,code:mfaCode});setBusy(false);
  if(r.error){setMfaChallenge('');say(r.error.message,true);return;}setMfaCode('');setMfaChallenge('');await bootstrap();
 }
 async function createVillage(e){e.preventDefault();if(!platformAdmin)return say(l('insufficientRights'),true);
  if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(newSlug))return say('The URL slug must use lowercase letters, digits or hyphens.',true);
  setBusy(true);
  const r=await db.rpc('create_village_site',{p_slug:newSlug,p_name_mr:newName,p_name_en:newName,p_taluka_mr:newTaluka,p_taluka_en:newTaluka,p_district_mr:newDistrict,p_district_en:newDistrict});
  if(r.error){setBusy(false);return say(r.error.message,true)}
  // The legacy function may publish by default. Immediately make new blank sites private.
  const read=await db.from('village_sites').select('id').eq('slug',newSlug).maybeSingle();
  let privacyFailed=false;if(read.data?.id){const priv=await db.rpc('set_village_published',{p_site_id:read.data.id,p_published:false});if(priv.error){privacyFailed=true;say('Village created, but making it private failed: '+priv.error.message,true)}}else{privacyFailed=true;say('Village created, but its private status could not be confirmed.',true)}
  setBusy(false);setShowCreate(false);setNewName('');setNewSlug('');setNewTaluka('');setNewDistrict('');await refreshVillages();if(!privacyFailed)say('Village created as a private draft. Add content and publish when ready.');
 }
 async function savePageInternal(){if(!schemaReady)throw new Error(l('notReady'));if(page?.locked)return false;
  const r=await db.rpc('gramos_save_page_draft',{p_site_id:selected,p_page_key:pageKey,p_content:data,p_expected_version:pageRevision});
  if(r.error)throw new Error(r.error.code==='40001'?l('draftConflict'):r.error.message);
  setPageRevision(Number(r.data));setSavedData(data);return true;
 }
 function parseLinks(){return footerLinks.split('\n').filter(x=>x.trim()).map(line=>{const [group,label_mr,...url]=line.split('|');return {group:group?.trim(),label_mr:label_mr?.trim(),url:url.join('|').trim()}})}
 async function saveFooterInternal(){const links=parseLinks();if(links.some(x=>!['social','resources','pages'].includes(x.group)||!x.label_mr||!x.url))throw new Error('Footer links format: social|मराठी नाव|https://...');
  const draft={...footer,links};const r=await db.rpc('gramos_save_footer_draft',{p_site_id:selected,p_content:draft,p_expected_version:footerRevision});
  if(r.error)throw new Error(r.error.code==='40001'?l('draftConflict'):r.error.message);
  setFooterRevision(Number(r.data));setFooter(draft);setSavedFooter(draft);setSavedLinks(footerLinks);
 }
 async function saveChanges(which='page'){if(!selected)return;setBusy(true);try{
  if(which==='page'){if(page?.locked)return;if(pageDirty)await savePageInternal()}
  if(which==='footer'){if(footerDirty)await saveFooterInternal()}
  say(l('draftSaved'));
 }catch(e){say('Save failed: '+e.message,true)}finally{setBusy(false)}}
 async function publish(autoSave=false){if(!selected||!schemaReady||isArchived){say(l('notReady'),true);return}
  if(!autoSave&&dirty){say(l('mustSave'),true);return}
  if(!autoSave&&!window.confirm(l('confirmPublish')))return;
  setBusy(true);try{
   if(autoSave){if(pageDirty&&!page?.locked)await savePageInternal();if(footerDirty)await saveFooterInternal()}
   const r=await db.rpc('gramos_publish_site_pages',{p_site_id:selected});if(r.error)throw new Error(r.error.message);
   await refreshVillages();
   // Read the published record, rather than assuming every failure to fetch means publication failed.
   const v=await db.from('site_pages').select('published_revision,is_published').eq('site_id',selected).eq('path',pageKey==='home'?'/':`/${pageKey}`).maybeSingle();
   if(v.error){say('Publishing RPC succeeded; verification could not complete: '+v.error.message,true)}
   else{setPublishedVersion(Number(v.data?.published_revision||0));say(l('publishedSuccess'))}
  }catch(e){say('Publish failed: '+e.message,true)}finally{setBusy(false)}
 }
 async function changeSiteState(action,site){if(!platformAdmin){say(l('insufficientRights'),true);return}
  const question=action==='archive'?l('confirmArchive'):action==='private'?l('confirmUnpublish'):l('confirmPublish');if(!confirm(question))return;
  setBusy(true);let r;
  if(action==='archive')r=await db.rpc('archive_village_site',{p_site_id:site.id,p_confirm_slug:site.slug});
  else if(action==='restore')r=await db.rpc('restore_village_site',{p_site_id:site.id,p_confirm_slug:site.slug});
  else r=await db.rpc('set_village_published',{p_site_id:site.id,p_published:action==='public'});
  setBusy(false);if(r.error){say(r.error.message,true);return;}await refreshVillages();say('Village status updated.');
 }
 async function deleteForever(){if(!platformAdmin||!showDelete)return;if(deleteConfirm!==`DELETE ${showDelete.slug}`){say('Type DELETE '+showDelete.slug,true);return}
  setBusy(true);const r=await db.functions.invoke('delete-village',{body:{siteId:showDelete.id,slug:showDelete.slug,confirmation:deleteConfirm}});setBusy(false);
  if(r.error||!r.data?.ok){say('Permanent deletion failed: '+(r.data?.message||r.error?.message||'Edge Function is not configured'),true);return}
  setShowDelete(null);setDeleteConfirm('');await refreshVillages();say('Village permanently deleted.');
 }
 async function upload(){if(!currentPageId){say('Select a valid village page before uploading.',true);return;}if(!file||!selected||!fileTitle.trim()){say('A file and Marathi title are required.',true);return}
  if(file.size>15728640||!MIME.includes(file.type)){say('Allowed: PDF, DOCX, XLSX, JPG, PNG, WebP up to 15 MB.',true);return}
  setBusy(true);try{
   const path=`${selected}/downloads/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,90)}`;
   const u=await db.storage.from('gramos-documents').upload(path,file,{contentType:file.type,upsert:false});if(u.error)throw new Error(u.error.message);
   const r=await db.from('site_documents').insert({site_id:selected,page_id:currentPageId,title_mr:fileTitle.trim(),storage_path:path,mime_type:file.type,size_bytes:file.size,draft_visible:true,is_published:false}).select().single();
   if(r.error){await db.storage.from('gramos-documents').remove([path]);throw new Error(r.error.message)}
   setFiles(v=>[r.data,...v]);setFile(null);setFileTitle('');say('Document uploaded. Publish the website to make it public.');
  }catch(e){say(e.message,true)}finally{setBusy(false)}
 }
 async function removeDocument(d){if(!window.confirm('Remove this document from the website?'))return;setBusy(true);
  const r=await db.from('site_documents').delete().eq('id',d.id).eq('site_id',selected);if(r.error){say(r.error.message,true);setBusy(false);return}
  const sr=await db.storage.from('gramos-documents').remove([d.storage_path]);if(sr.error)say('Database entry removed; Storage cleanup failed: '+sr.error.message,true);else say('Document removed.');
  setFiles(v=>v.filter(x=>x.id!==d.id));setBusy(false);
 }
 async function renameDocument(d){const name=window.prompt('Marathi document title:',d.title_mr);if(!name?.trim())return;
  const r=await db.from('site_documents').update({title_mr:name.trim()}).eq('id',d.id).eq('site_id',selected).select().single();
  if(r.error)return say(r.error.message,true);setFiles(v=>v.map(x=>x.id===d.id?r.data:x));say('Document title updated.');
 }
 const activeConfig=HOME_SECTIONS.find(x=>x.key===activeSection);
 const sectionState=data.sections?.[activeSection]||{};
 function updateSection(field,value){setData(d=>({...d,sections:{...(d.sections||{}),[activeSection]:{...(d.sections?.[activeSection]||{}),[field]:value}}}))}
 const nav=[['villages','⌂'],['pages','▣'],['footer','▤'],['documents','↓']];
 const helpContent=mode==='villages'?l('modeStatus'):mode==='pages'?l('tips'):mode==='footer'?l('footerEditor'):l('uploadHint');
 const previewSite=selectedSite?{...selectedSite,content:selectedSite.content||{}}:null;
 const previewPage={title_mr:page?.title||'',published_content:data};
 if(!initialized)return <main className="admin-login">{l('loading')}</main>;
 if(!session)return <main className="admin-login"><form className="auth-card" onSubmit={signIn}><div className="login-actions"><strong>GramOS</strong><select aria-label="Admin language" value={locale} onChange={e=>selectLang(e.target.value)}><option value="mr">मराठी</option><option value="en">English</option></select></div><h1>{l('signIn')}</h1><p>{l('authRequired')}</p><Field label={l('email')} value={email} onChange={setEmail} type="email"/><Field label={l('password')} value={password} onChange={setPassword} type="password"/><button className="button" disabled={busy}>{l('signIn')}</button>{status?<p role="alert">{status}</p>:null}</form></main>;
 if(!verified)return <main className="admin-login"><form className="auth-card" onSubmit={verifyMfa}><div className="login-actions"><h2>{l('mfa')}</h2><select value={locale} onChange={e=>selectLang(e.target.value)}><option value="mr">मराठी</option><option value="en">English</option></select></div>{mfaFactor?<><Field label={l('mfaCode')} value={mfaCode} onChange={setMfaCode}/><button className="button" disabled={busy}>{l('verify')}</button></>:<p>{l('noMfa')}</p>}<button type="button" className="subtle-btn" onClick={()=>db.auth.signOut()}>{l('signOut')}</button>{status?<p role="alert">{status}</p>:null}</form></main>;
 return <div className="studio-layout admin-v21">
   <aside className="studio-sidebar"><div className="studio-logo"><span className="logo-mark">G</span><span>GramOS<small>STUDIO 2.1</small></span></div><div className="sidebar-caption">{l('overview')}</div>
    {nav.map(([key,icon])=><button key={key} className={`navitem ${mode===key?'active':''}`} onClick={()=>setMode(key)}><span aria-hidden="true">{icon}</span><span>{l(key)}</span></button>)}
    {platformAdmin?<Link className="navitem" href="/admin/domains"><span aria-hidden="true">⌁</span><span>{locale==='en'?'Domain Management':'डोमेन व्यवस्थापन'}</span></Link>:null}<div className="sidebar-bottom"><span>{session.user?.email}</span><button onClick={()=>db.auth.signOut()}>{l('signOut')}</button></div>
   </aside>
   <div className="studio-main"><header className="studio-top"><div><span className="eyebrow">GRAMOS / WEBSITE MANAGER</span><h1>{l(mode)}</h1></div>
    <div className="studio-actions"><label className="sr-only" htmlFor="lang">{l('language')}</label><select id="lang" value={locale} onChange={e=>selectLang(e.target.value)} aria-label={l('language')}><option value="mr">मराठी</option><option value="en">English</option></select>
     <select aria-label={l('chooseVillage')} value={selected} onChange={e=>setSelected(e.target.value)}>{!selected?<option value="">{l('chooseVillage')}</option>:null}{villages.filter(v=>!v.archived_at).map(v=><option value={v.id} key={v.id}>{v.slug}</option>)}</select>
     <button className="subtle-btn" onClick={()=>setShowCreate(true)} disabled={!platformAdmin||schemaReady===false}>{l('addVillage')}</button>
     <button className="help-btn" aria-label={l('help')} onClick={()=>setShowHelp(true)}>?</button>
    </div></header>
    {status?<div className={statusError?'status-line error':'status-line'} role={statusError?'alert':'status'}>{status}</div>:null}
    {schemaReady===false?<div className="setup-warning"><strong>{l('setupRequired')}</strong><p>{l('setupHint')}</p><code>supabase/migrations/20261120_gramos2_pages_footer_documents.sql</code></div>:null}
    {mode==='villages'?<section className="studio-card dashboard-card"><div className="between"><div><h2>{l('villages')}</h2><p className="field-note">{l('modeStatus')}</p></div><button className="subtle-btn" onClick={()=>setViewArchived(v=>!v)}>{viewArchived?l('villages'):l('archived')}</button></div>
      <div className="village-list">{visibleVillages.map(v=><div className="village-row" key={v.id}><div><strong>{v.slug}</strong><small>{v.archived_at?l('archived'):v.published?l('published'):l('unpublished')}</small></div><div className="row-actions">
       {!v.archived_at?<><button onClick={()=>{setSelected(v.id);setPageKey('home');setMode('pages')}}>{l('edit')}</button><a href={publicBase+hrefFor(v.slug)} rel="noreferrer" target="_blank">{l('website')}</a>{platformAdmin?<button onClick={()=>changeSiteState(v.published?'private':'public',v)} disabled={busy}>{v.published?l('unpublish'):l('makePublic')}</button>:null}{platformAdmin?<button className="danger-outline" onClick={()=>changeSiteState('archive',v)} disabled={busy}>{l('archive')}</button>:null}</>:platformAdmin?<><button onClick={()=>changeSiteState('restore',v)} disabled={busy}>{l('restore')}</button><button className="danger-outline" onClick={()=>{setShowDelete(v);setDeleteConfirm('')}}>{l('deleteForever')}</button></>:null}
       </div></div>)}{!visibleVillages.length?<p className="field-note">{l('none')}</p>:null}</div>
     </section>:selectedSite?<><section className="studio-subbar"><div className="page-selector"><label>{l('selectPage')}<select value={pageKey} onChange={e=>setPageKey(e.target.value)}>{ALL_PAGES.map(p=><option key={p.key} value={p.key}>{p.title}{p.locked?' 🔒':''}</option>)}</select></label><div className="publish-meta"><span>{isPublic?l('published'):l('unpublished')}</span><span>v{publishedVersion}</span>{dirty?<strong>{l('unsaved')}</strong>:<span>{l('saved')}</span>}</div></div><div className="publish-actions"><a className="subtle-btn" href={publicBase+currentPublicUrl} target="_blank" rel="noreferrer">{l('viewPublished')} ↗</a><button className="button" disabled={busy||schemaReady!==true||isArchived||!isPublic} onClick={()=>publish(false)}>{l('publish')}</button><button className="button primary" disabled={busy||schemaReady!==true||isArchived} onClick={()=>publish(true)}>{l('savePublish')}</button></div></section>
     {mode==='pages'?<div className="editor-columns"><section className="studio-card"><div className="between"><h2>{l('pageEditor')}</h2><span className="small-meta">{page?.title}</span></div>
       {page?.locked?<p>{l('pageLocked')}</p>:pageKey==='home'?<><Field label={l('title')} value={data.title||''} onChange={v=>field('title',v)}/><Field textarea label={l('welcome')} value={data.welcome||''} onChange={v=>field('welcome',v)}/><Field label={l('hero')} value={data.hero_image||''} onChange={v=>field('hero_image',v)} placeholder="https://..."/>
       <div className="section-editor"><label>{l('homeSection')}<select value={activeSection} onChange={e=>setActiveSection(e.target.value)}>{HOME_SECTIONS.map(s=><option key={s.key} value={s.key}>{s.title}</option>)}</select></label><Field label={l('sectionHeading')} value={sectionState.title||''} onChange={v=>updateSection('title',v)} placeholder={activeConfig?.title}/>
         {activeConfig?.dataKey?<Field textarea rows={8} label={l('sectionCards')} value={sectionState.cards===undefined?'':printCards(sectionState.cards)} onChange={v=>updateSection('cards',parseCardLines(v))} placeholder="नाव | माहिती | https://..."/>:<Field textarea rows={5} label={l('sectionText')} value={sectionState.text||''} onChange={v=>updateSection('text',v)}/>}</div></>:<Field textarea rows={15} label={l('body')} value={data.body_mr||''} onChange={v=>field('body_mr',v)}/>}
       <div className="editor-bottom"><span className="small-meta">{l('draft')} v{pageRevision}</span><button className="button" disabled={busy||schemaReady!==true||isArchived||page?.locked||!pageDirty} onClick={()=>saveChanges('page')}>{l('save')}</button></div>
      </section><section className="studio-card preview-card"><div className="between"><h2>{l('preview')}</h2><div className="device-buttons"><button className={previewDevice==='desktop'?'active':''} onClick={()=>setPreviewDevice('desktop')}>{l('desktop')}</button><button className={previewDevice==='mobile'?'active':''} onClick={()=>setPreviewDevice('mobile')}>{l('mobile')}</button></div></div><div className={`actual-preview ${previewDevice}`}><div className="site-preview" key={`${selected}-${pageKey}`}><SiteHeader site={previewSite}/>{pageKey==='home'?<Home site={previewSite} page={previewPage}/>:<BlankPage site={previewSite} page={previewPage} pageKey={pageKey}/>}<SiteFooter site={previewSite} footer={footer}/></div></div><p className="field-note">{l('previewCaption')}</p></section></div>:null}
     {mode==='footer'?<div className="editor-columns"><section className="studio-card"><h2>{l('footerEditor')}</h2>{[['social_heading','socialHeading'],['social_text','socialText'],['resources_heading','resourceHeading'],['pages_heading','pagesHeading'],['contact_heading','contactHeading'],['office','office'],['phone','phone'],['email','email'],['hours','hours'],['copyright_note','copyright'],['credit','credit']].map(([k,text])=><Field key={k} label={l(text)} value={footer[k]||''} onChange={v=>setFooter(f=>({...f,[k]:v}))}/>)}
       <Field label={l('year')} type="number" value={footer.year_override??''} onChange={v=>setFooter(f=>({...f,year_override:v?Number(v):null}))}/><Field textarea rows={7} label={l('footerLinks')} value={footerLinks} onChange={setFooterLinks}/><div className="editor-bottom"><span className="small-meta">{l('draft')} v{footerRevision}</span><button className="button" disabled={busy||schemaReady!==true||isArchived||!footerDirty} onClick={()=>saveChanges('footer')}>{l('save')}</button></div></section>
       <section className="studio-card preview-card"><h2>{l('preview')}</h2><div className="actual-preview desktop"><div className="site-preview"><SiteFooter site={previewSite} footer={{...footer,links:parseLinks()}}/></div></div></section></div>:null}
     {mode==='documents'?<section className="studio-card"><h2>{l('uploadDocument')}</h2><p className="field-note">{l('uploadHint')}</p><Field label={l('documentTitle')} value={fileTitle} onChange={setFileTitle}/><label className="studio-field"><span>{l('chooseFile')}</span><input type="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="button" onClick={upload} disabled={busy||schemaReady!==true||isArchived}>{l('upload')}</button><h3>{l('downloaded')}</h3><div className="village-list">{files.filter(d=>d.page_id===currentPageId).map(d=><div className="village-row" key={d.id}><div><strong>{d.title_mr}</strong><small>{d.is_published?l('docPublished'):l('docDraft')}</small></div><div className="row-actions"><button onClick={()=>renameDocument(d)}>{l('edit')}</button><button className="danger-outline" onClick={()=>removeDocument(d)}>{l('remove')}</button></div></div>)}{!files.filter(d=>d.page_id===currentPageId).length?<p className="field-note">{l('noFiles')}</p>:null}</div></section>:null}
    </>:<section className="studio-card">{l('noVillage')}</section>}
    <footer className="admin-build">{prefix} · {new Date().getFullYear()}</footer>
   </div>
   {showHelp?<Modal title={l('help')} onClose={()=>setShowHelp(false)}><p>{helpContent}</p><p>{l('tips')}</p><button className="button" onClick={()=>setShowHelp(false)}>{l('dismiss')}</button></Modal>:null}
   {showCreate?<Modal title={l('createVillage')} onClose={()=>setShowCreate(false)}><form onSubmit={createVillage}><Field label={l('villageName')} value={newName} onChange={setNewName}/><Field label={l('slug')} value={newSlug} onChange={v=>setNewSlug(v.toLowerCase())}/><Field label={l('taluka')} value={newTaluka} onChange={setNewTaluka}/><Field label={l('district')} value={newDistrict} onChange={setNewDistrict}/><button className="button" disabled={busy||!newName||!newSlug||!newTaluka||!newDistrict}>{l('createVillage')}</button></form></Modal>:null}
   {showDelete?<Modal title={l('deleteForever')} onClose={()=>setShowDelete(null)}><p className="danger-copy">{l('confirmPermanent')}</p><p>{l('confirmDelete')}: <code>DELETE {showDelete.slug}</code></p><Field label={l('confirmDelete')} value={deleteConfirm} onChange={setDeleteConfirm}/><button className="button danger" disabled={busy||deleteConfirm!==`DELETE ${showDelete.slug}`} onClick={deleteForever}>{l('deleteForever')}</button><p className="field-note">{l('cannotDelete')}</p></Modal>:null}
 </div>;
}

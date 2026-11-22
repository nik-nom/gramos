/** GramOS v4.9 — one village per customer; records persist in Supabase, not in Vercel filesystem. */
import {api,call,adminVillages} from './data.js';
import {esc,loc,notif} from './utils.js';
import {clientsCSV,clientsXLSX} from './client-export.mjs';
const tr=(l,m,e)=>l==='mr'?m:e;
const fld=(key,label,value='',type='text',required=false)=>`<label class="field"><span>${esc(label)}</span><input name="${esc(key)}" type="${esc(type)}" value="${esc(value||'')}" ${required?'required':''} autocomplete="off" maxlength="${type==='email'?254:170}"/></label>`;
const payment=(value)=>`<label class="field"><span>Payment received? / पेमेंट मिळाले?</span><select name="payment_received"><option value="" ${value==null?'selected':''}>Not recorded / अजून नोंद नाही</option><option value="true" ${value===true?'selected':''}>Yes / होय</option><option value="false" ${value===false?'selected':''}>No / नाही</option></select></label>`;
export async function fetchClientRows(role){
 const villages=await adminVillages(role);
 if(!villages.length)return [];
 const ids=villages.map(v=>v.id);
 const [records,domains]=await Promise.all([call(api.from('village_clients').select('*').in('village_id',ids)),call(api.from('village_domains').select('village_id,hostname').in('village_id',ids).eq('status','active'))]);
 return villages.map(v=>({village:v,record:records.find(x=>x.village_id===v.id)||{},domain:domains.find(x=>x.village_id===v.id)}));
}
export function newVillagePage(lang){
 return `<main class="admin-shell container admin-v49-workspace"><div class="admin-page-top"><div><p class="eyebrow">NEW VILLAGE / CUSTOMER</p><h1>${tr(lang,'नवीन ग्रामपंचायत नोंदणी','Register a new village')}</h1><p>${tr(lang,'ग्राहकाची माहिती एकदाच भरा. गाव मसुदा स्वरूपात तयार होईल आणि ग्राहक नोंदवहीत आपोआप जोडले जाईल.','Fill in the customer details once. A draft village and customer record are created together.')}</p></div><a class="button-lite" href="/admin">← Dashboard</a></div>
 <form id="createVillageForm" class="admin-v49-form">
 <section class="admin-panel form-panel"><h2>1. ${tr(lang,'वेबसाइट माहिती','Website details')}</h2><div class="form-grid">
 ${fld('slug','Website slug / /v/village','', 'text',true)}${fld('name_mr','ग्रामपंचायतीचे नाव — मराठी','', 'text',true)}
 ${fld('name_en','Village name — English')}${fld('taluka_mr','तालुका — मराठी','', 'text',true)}
 ${fld('taluka_en','Taluka — English')}${fld('district_mr','जिल्हा — मराठी','', 'text',true)}
 ${fld('district_en','District — English')}
 </div><p class="small-muted">The website starts as a private draft. It is not published automatically.</p></section>
 <section class="admin-panel form-panel"><h2>2. ${tr(lang,'ग्राहक / संपर्क माहिती','Client and contact details')}</h2><div class="form-grid">
 ${fld('customer_name','Contact person / ग्राहकाचे नाव','', 'text',true)}${fld('customer_email','Email / ईमेल','', 'email',true)}
 ${fld('customer_phone','Mobile / मोबाइल नंबर','', 'tel',true)}${fld('gram_sevak_name','Gram Sevak / ग्रामसेवक नाव','', 'text',true)}
 ${fld('panchayat_name','Gram Panchayat name / ग्रामपंचायत')}${payment(null)}
 </div><p class="small-muted">Only the Super Admin creates websites. No customer password is stored in this record.</p></section>
 <section class="admin-panel form-panel"><h2>3. ${tr(lang,'अंतिम तपासणी','Confirm & create')}</h2><label class="field wide"><span>Payment / notes (optional)</span><textarea name="payment_notes" maxlength="2000" rows="2"></textarea></label><div class="settings-actions"><button type="submit" class="btn btn-dark">Create village + customer record</button><a class="button-lite" href="/admin/clients">View customer register</a></div></section>
 </form></main>`;
}
export async function clientsPage(lang,role){
 const rows=await fetchClientRows(role);
 const selectedId=new URLSearchParams(location.search).get('site');const chosen=rows.find(x=>x.village.id===selectedId)||rows[0];
 const v=chosen?.village;const r=chosen?.record||{};
 return `<main class="admin-shell container admin-v49-workspace"><div class="admin-page-top"><div><p class="eyebrow">CUSTOMERS / REGISTER</p><h1>${tr(lang,'ग्राहक नोंदवही','Customer register')}</h1><p>${tr(lang,'प्रत्येक ग्रामपंचायत एक नोंद. Excel/CSV मध्ये सर्व ग्राहकांची अद्ययावत यादी डाउनलोड करा.','One record per village. Download an up-to-date Excel or CSV register, including every customer.')}</p></div><a class="button-lite" href="/admin">← Dashboard</a></div>
 <section class="admin-panel admin-v49-collection"><div class="panel-heading"><h2>${tr(lang,'नोंदवही','Client records')} (${rows.length})</h2><div class="admin-v49-tools"><button type="button" class="button-lite" data-action="export-clients-csv">Download CSV</button><button type="button" class="btn btn-dark" data-action="export-clients-xlsx">Download Excel</button></div></div>
 <div class="admin-v49-table-wrap"><table class="admin-v49-table"><thead><tr><th>Village</th><th>Contact</th><th>Website</th><th>Payment</th><th>Action</th></tr></thead><tbody>${rows.map(({village:x,record:y,domain:z})=>`<tr><td><strong>${esc(loc(x,'name',lang)||x.slug)}</strong><small>/v/${esc(x.slug)}</small><a href="https://${esc(z?.hostname||'gramos-public.vercel.app')}/v/${encodeURIComponent(x.slug)}" target="_blank" rel="noopener noreferrer">${x.status==='published'?'Live website':'Website route'} ↗</a></td><td>${esc(y.customer_name||'Not entered')}<small>${esc(y.customer_email||'')}</small></td><td><span class="status status-${esc(x.status)}">${esc(x.status)}</span></td><td>${y.payment_received===true?'Received':y.payment_received===false?'Not received':'Not recorded'}</td><td><a class="button-lite" href="/admin/clients?site=${encodeURIComponent(x.id)}">Edit</a></td></tr>`).join('')}</tbody></table></div></section>
 ${v?`<section class="admin-panel form-panel"><div class="panel-heading"><div><h2>${tr(lang,'ग्राहक नोंद संपादित करा','Edit customer record')}: ${esc(loc(v,'name',lang)||v.slug)}</h2><p>Village /v/${esc(v.slug)} · ${esc(v.status)} · <a href="/admin/villages/${esc(v.id)}/overview">Website publishing ↗</a></p></div></div><form id="clientRecordForm" data-id="${esc(v.id)}"><div class="form-grid">
 ${fld('customer_name','Customer / contact person',r.customer_name||'','text',true)}${fld('customer_email','Email address',r.customer_email||'','email',true)}
 ${fld('customer_phone','Mobile number',r.customer_phone||'','tel',true)}${fld('gram_sevak_name','Gram Sevak / officer name',r.gram_sevak_name||'')}
 ${fld('panchayat_name','Gram Panchayat',r.panchayat_name||loc(v,'name',lang))}${fld('taluka','Taluka',r.taluka||loc(v,'taluka',lang))}
 ${fld('district','District',r.district||loc(v,'district',lang))}${payment(r.payment_received)}
 </div><label class="field wide"><span>Payment notes</span><textarea name="payment_notes" rows="3" maxlength="2000">${esc(r.payment_notes||'')}</textarea></label><p class="small-muted">Website status is taken directly from the village's actual Publish/Unpublish state. No passwords are saved or exported.</p><div class="settings-actions"><button type="submit" class="btn btn-dark">${tr(lang,'नोंद जतन करा','Save customer record')}</button><a class="button-lite" href="/admin/villages/${esc(v.id)}/contact">Edit village contact & Google Maps</a></div></form></section>`:`<section class="admin-panel"><p>No village assigned to this account.</p></section>`}
 </main>`;
}
export async function staffPage(lang,role){
 if(!role.admin)return '<main class="admin-shell"><h1>Super Admin only</h1></main>';
 const villages=await adminVillages(role);
 return `<main class="admin-shell container admin-v49-workspace"><div class="admin-page-top"><div><p class="eyebrow">ACCOUNTS / SUPER ADMIN</p><h1>${tr(lang,'नवीन Admin / User लॉगिन','Create Admin / User login')}</h1><p>${tr(lang,'खाते या गावापुरतेच मर्यादित असेल. User ला फक्त तक्रारी पाहता येतील; Admin ला संपादन करता येईल.','Each account is limited to its selected village. Users can only review complaints; Admins can edit the website.')}</p></div><a class="button-lite" href="/admin">← Dashboard</a></div>
 <section class="admin-panel form-panel"><form id="createStaffLoginForm" class="stacked-form"><div class="form-grid">${fld('name','Full name / नाव','', 'text',true)}${fld('email','Login email / ईमेल','', 'email',true)}
 <label class="field"><span>Village / ग्रामपंचायत</span><select name="village_id" required>${villages.map(v=>`<option value="${esc(v.id)}">${esc(loc(v,'name',lang)||v.slug)}</option>`).join('')}</select></label>
 <label class="field"><span>Role</span><select name="role"><option value="editor">Admin — edit assigned village</option><option value="reviewer">User — read complaints only</option></select></label>
 ${fld('password','Temporary password (14+ characters)','', 'password',true)}</div>
 <label class="admin-v49-confirm"><input type="checkbox" name="confirmed_recipient" value="true" required/> I have verified the recipient and their email address.</label><div class="admin-blue-note"><strong>Security:</strong> Only the Super Admin can create logins. Do not reuse passwords or save them in spreadsheets. Share the password through a secure channel and ask the person to change it.</div>
 <div class="settings-actions"><button class="btn btn-dark" type="submit">Create login & assign village</button></div></form></section>
 </main>`;
}
const mandatory=['customer_name','customer_email','customer_phone','gram_sevak_name'];
export async function createVillageWithClient(form,role){
 if(!role.admin)throw new Error('Only platform admins (Super Admin) can create villages');
 const d=new FormData(form),get=k=>String(d.get(k)||'').trim();
 for(const key of ['slug','name_mr','taluka_mr','district_mr',...mandatory]){
  if(!get(key))throw new Error(`Please enter ${key.replaceAll('_',' ')}`);
 }
 const village=Object.fromEntries(['slug','name_en','name_mr','taluka_mr','taluka_en','district_mr','district_en'].map(k=>[k,get(k)]));
 const customer=Object.fromEntries(['customer_name','customer_email','customer_phone','gram_sevak_name','panchayat_name','payment_received','payment_notes'].map(k=>[k,get(k)]));
 customer.taluka=get('taluka_mr');customer.district=get('district_mr');
 const villageId=await call(api.rpc('gramos_create_village_customer',{p_village:village,p_customer:customer}));
 if(!villageId)throw new Error('Village could not be created');
 return villageId;
}
export async function saveClientRecord(form,role){
 const d=new FormData(form),get=k=>String(d.get(k)||'').trim();const village_id=form.dataset.id;
 if(!role.admin&&!role.editorIds?.includes(village_id))throw new Error('Not permitted to edit this village');
 for(const k of ['customer_name','customer_email','customer_phone'])if(!get(k))throw new Error(`Please enter ${k}`);
 const payload={village_id,...Object.fromEntries(['customer_name','customer_email','customer_phone','gram_sevak_name','panchayat_name','taluka','district','payment_notes'].map(k=>[k,get(k)])),payment_received:get('payment_received')===''?null:get('payment_received')==='true',updated_at:new Date().toISOString()};
 const rows=await call(api.from('village_clients').upsert(payload,{onConflict:'village_id'}).select('village_id'));
 if(!rows?.length)throw new Error('Customer changes were not saved');
 return true;
}
export async function createStaffLogin(form,role){
 if(!role.admin)throw new Error('Only Super Admin can create accounts');
 const d=new FormData(form),values=Object.fromEntries(['name','email','village_id','role','password','confirmed_recipient'].map(k=>[k,String(d.get(k)||'').trim()]));
 const {data}=await api.auth.getSession();if(!data?.session?.access_token)throw new Error('Sign in again');
 const res=await fetch('/api/staff-admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(values)});
 const payload=await res.json().catch(()=>({}));if(!res.ok)throw new Error(payload.error||'Cannot create account');
 return payload;
}
export async function exportClients(role,format){
 if(!role.admin&&!role.editorIds?.length)throw new Error('No access to customer register');
 const rows=await fetchClientRows(role);
 const bytes=format==='xlsx'?clientsXLSX(rows):clientsCSV(rows);
 const type=format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv;charset=utf-8';
 const blob=new Blob([bytes],{type});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=`GramOS_Customers_${new Date().toISOString().slice(0,10)}.${format}`;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}

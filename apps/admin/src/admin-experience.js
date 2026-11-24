import {api,call} from './data.js';
import {esc,icon,formatDate} from './utils.js';
import {CSV_KINDS,CSV_FIELDS,csvTemplate,parseCSV,generateCSV,validateCSVRows,rowsForInsert} from './admin-csv.mjs';

const t=(language,mr,en)=>language==='mr'?mr:en;
export function villageQuickLinks(v,language){
 const base=`/admin/villages/${encodeURIComponent(v.id)}`;
 const links=[
  ['home','home',t(language,'मुख्यपृष्ठ','Edit homepage'),`${base}/home`],
  ['forms','mail',t(language,'आलेले अर्ज','Received forms'),`${base}/submissions`],
  ['notices','bell',t(language,'सूचना','Notices'),`${base}/content/notices`],
  ['schemes','document',t(language,'योजना','Schemes'),`${base}/content/schemes`],
  ['gallery','image',t(language,'गॅलरी','Gallery'),`${base}/content/gallery`],
  ['documents','document',t(language,'PDF अर्ज','PDF forms'),`${base}/content/service_forms`],
  ['village','pin',t(language,'गाव माहिती','Village Info'),`${base}`],
  ['settings','settings',t(language,'सेटिंग्ज','Settings'),`${base}/overview`],
  ['publish','check',t(language,'प्रकाशित करा','Publish'),`${base}/overview`]
 ];
 return `<nav class="gx-action-grid" aria-label="${t(language,'मुख्य कृती','Main actions')}">${links.map(([id,glyph,title,href])=>`<a class="gx-action" href="${href}" data-gx-shortcut="${id}"><span class="gx-action-icon">${icon(glyph)}</span><strong>${title}</strong></a>`).join('')}</nav>`;
}
export async function recentAdminActivity(role,villageId,language){
 if(!api)return '';
 try{
  let q=api.from('gramos_activity_log').select('id,entity,operation,title,actor_label,old_status,new_status,created_at').order('created_at',{ascending:false}).limit(8);
  if(villageId)q=q.eq('village_id',villageId);
  const rows=await call(q);
  const title=t(language,'अलीकडील बदल','Recent changes');
  const empty=t(language,'अजून कोणताही बदल नोंदलेला नाही.','Changes will appear here after you save an item.');
  return `<section class="admin-panel gx-activity"><div class="panel-heading"><h2>${title}</h2></div>${rows?.length?`<ol class="gx-timeline">${rows.map(row=>`<li><span class="gx-timeline-point"></span><div><strong>${esc(row.title||row.entity)}</strong><small>${esc(row.operation==='INSERT'?t(language,'तयार','Created'):row.operation==='DELETE'?t(language,'काढले','Removed'):t(language,'बदलले','Updated'))} · ${esc(row.actor_label||t(language,'कर्मचारी','Staff account'))} · ${esc(formatDate(row.created_at,language))}</small></div></li>`).join('')}</ol>`:`<p class="gx-empty">${empty}</p>`}</section>`;
 }catch(error){return `<section class="admin-panel gx-activity"><h2>${t(language,'अलीकडील बदल','Recent changes')}</h2><p class="gx-empty">${t(language,'इतिहास उपलब्ध नाही. नंतर पुन्हा प्रयत्न करा.','History is unavailable. Try refreshing later.')}</p></section>`;}
}
const supported=kind=>{if(!CSV_KINDS.includes(kind))throw new Error('CSV import is available for Notices, Schemes, Gallery, News, Projects and Services.');return kind;};
function download(bytes,name){const blob=new Blob([bytes],{type:'text/csv;charset=utf-8'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1600);}
export function downloadCSVTemplate(kind){kind=supported(kind);download(csvTemplate(kind),`GramOS_${kind}_template.csv`);}
export async function exportContentCSV(villageId,kind){kind=supported(kind);const rows=await call(api.from('content_items').select(CSV_FIELDS.join(',')).eq('village_id',villageId).eq('kind',kind).is('deleted_at',null).order('sort_order'));download(generateCSV(rows),`GramOS_${kind}_${new Date().toISOString().slice(0,10)}.csv`);return rows.length;}
let draftImport=null;
export async function previewCSV(input){
 const file=input.files?.[0];if(!file)return;
 if(file.size>1024*1024)throw new Error('Choose a CSV file smaller than 1 MB.');
 const id=input.dataset.id,kind=supported(input.dataset.kind),output=document.getElementById('gx-csv-preview');
 if(!output)throw new Error('Preview panel missing. Refresh this page.');
 draftImport=null;output.innerHTML='<p role="status">Checking your CSV file…</p>';
 try{
  const parsed=parseCSV(await file.text());
  const existing=await call(api.from('content_items').select('slug').eq('village_id',id).eq('kind',kind));
  const validated=validateCSVRows(parsed,existing),invalid=validated.filter(x=>x._errors.length),valid=validated.length-invalid.length;
  draftImport=invalid.length?null:{id,kind,rows:rowsForInsert(validated)};
  output.innerHTML=`<div class="gx-import-summary" role="status"><strong>${validated.length} rows</strong><span>${valid} ready · ${invalid.length} need fixing</span></div><div class="gx-preview-scroll"><table class="gx-import-table"><thead><tr><th>Row</th><th>Marathi</th><th>English</th><th>Short link</th><th>Check</th></tr></thead><tbody>${validated.map(row=>`<tr class="${row._errors.length?'gx-bad-row':'gx-good-row'}"><td>${row._line}</td><td>${esc(row.title_mr)}</td><td>${esc(row.title_en)}</td><td>${esc(row.slug)}</td><td>${row._errors.length?`<span class="gx-error">${esc(row._errors.join('; '))}</span>`:'Ready'}</td></tr>`).join('')}</tbody></table></div><button type="button" data-action="gx-csv-confirm" class="btn btn-dark" ${invalid.length?'disabled':''}>${invalid.length?'Fix the highlighted rows first':`Save ${valid} drafts`}</button><p class="small-muted">All rows are saved together. Nothing is published until you choose Publish.</p>`;
 }catch(e){output.innerHTML=`<p class="gx-error" role="alert">${esc(e.message)}</p>`;throw e;}
}
export async function commitCSVImport(role,navigate){
 const pending=draftImport;if(!pending?.rows?.length)throw new Error('Upload and review a valid CSV file first.');
 if(!role.admin&&!role.editorIds?.includes(pending.id))throw new Error('You can only import records for your own village.');
 const confirmText=`Save ${pending.rows.length} draft records? Nothing will be visible publicly until published.`;
 if(!window.confirm(confirmText))return false;
 // Single transactional PostgreSQL function: if any row fails, none are inserted.
 const count=await call(api.rpc('gramos_import_content_csv',{p_village_id:pending.id,p_kind:pending.kind,p_rows:pending.rows}));
 draftImport=null;navigate(`/admin/villages/${pending.id}/content/${pending.kind}`);return count;
}
export function csvImportPage(v,kind,language){supported(kind);return `<div class="gx-import-page"><div class="admin-page-top"><div><p class="eyebrow">${t(language,'यादी आयात','IMPORT LIST')}</p><h1>${t(language,'CSV यादी जोडा','Import CSV')}</h1><p>${t(language,'फाइल निवडा, चुका तपासा, मग जतन करा.','Choose a file. Check every row. Then save.')}</p></div><a class="button-lite" href="/admin/villages/${esc(v.id)}/content/${kind}">← ${t(language,'यादीकडे परत','Back to list')}</a></div><section class="admin-panel gx-import-panel"><div class="gx-steps"><span>1. ${t(language,'नमुना','Template')}</span><span>2. ${t(language,'तपासा','Review')}</span><span>3. ${t(language,'जतन करा','Save')}</span></div><button type="button" data-action="gx-csv-template" data-kind="${esc(kind)}" class="button-lite">↓ ${t(language,'नमुना CSV डाउनलोड','Download template')}</button><label class="field gx-file-label"><span>${t(language,'CSV फाइल निवडा','Choose CSV file')}</span><input type="file" accept=".csv,text/csv" data-gx-csv-input data-id="${esc(v.id)}" data-kind="${esc(kind)}"/></label><div id="gx-csv-preview" aria-live="polite"><p class="gx-empty">${t(language,'फाइल निवडल्यानंतर येथे प्रत्येक नोंद दिसेल.','Every record will appear here after you choose a file.')}</p></div></section></div>`;}

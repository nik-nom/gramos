// GramOS CSV contract. Shared between browser UI and Node's automated tests.
export const CSV_KINDS=Object.freeze(['notices','schemes','gallery','news','projects','services']);
export const CSV_FIELDS=Object.freeze(['slug','title_mr','title_en','body_mr','body_en','image_url','external_url','sort_order']);
export const CSV_LIMIT=200;
const slugOkay=s=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)&&s.length>=2&&s.length<=90;
export function escapeCSV(value){const raw=String(value??'');const s=/^[\t\r\n ]*[=+@-]/.test(raw)?`'${raw}`:raw;return /[,"\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}
export function generateCSV(rows,columns=CSV_FIELDS){return '\uFEFF'+[columns.join(','),...rows.map(row=>columns.map(c=>escapeCSV(row[c])).join(','))].join('\r\n')+'\r\n';}
export function csvTemplate(kind){if(!CSV_KINDS.includes(kind))throw new Error('This list does not support CSV import');return generateCSV([]);}
export function parseCSV(raw){
 const text=String(raw??'').replace(/^\uFEFF/,'');const records=[];
 let values=[],value='',quoted=false,endedQuote=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++;}else if(c==='"'){quoted=false;endedQuote=true;}else value+=c;continue;}
  if(c==='"'){if(value||endedQuote)throw new Error(`Invalid quotation near character ${i+1}`);quoted=true;continue;}
  if(c===','){values.push(value);value='';endedQuote=false;continue;}
  if(c==='\n'||c==='\r'){
   if(c==='\r'&&text[i+1]==='\n')i++;
   values.push(value);if(values.some(x=>x.trim()!==''))records.push(values);
   values=[];value='';endedQuote=false;continue;
  }
  if(endedQuote&&!/\s/.test(c))throw new Error(`Unexpected characters after a quoted value (character ${i+1})`);
  value+=c;
 }
 if(quoted)throw new Error('A quoted value was not closed. Check the CSV file.');
 if(value.length||values.length){values.push(value);if(values.some(x=>x.trim()!==''))records.push(values);}
 if(!records.length)throw new Error('This CSV file is empty. Download a template first.');
 const headers=records.shift().map(x=>x.trim());
 if(headers.join('|')!==CSV_FIELDS.join('|'))throw new Error('Wrong columns. Download the template and keep its headings unchanged.');
 if(records.length>CSV_LIMIT)throw new Error(`Upload up to ${CSV_LIMIT} records at once.`);
 return records.map((cells,i)=>{
  const result={_line:i+2,_errors:[]};
  if(cells.length!==CSV_FIELDS.length)result._errors.push(`Expected ${CSV_FIELDS.length} columns, found ${cells.length}`);
  CSV_FIELDS.forEach((key,j)=>result[key]=String(cells[j]??'').trim());
  return result;
 });
}
export function validateCSVRows(rows,existing=[]){
 if(!Array.isArray(rows)||!rows.length)throw new Error('Add at least one row to your CSV file.');
 const seen=new Set();const already=new Set(existing.map(x=>String(x.slug||'').toLowerCase()));
 return rows.map(row=>{
  const errors=[...(row._errors||[])];const s=String(row.slug||'').trim();
  if(!slugOkay(s))errors.push('Short link: use lowercase letters, numbers and hyphens (2–90 characters)');
  if(!row.title_mr&&!row.title_en)errors.push('Enter a Marathi or English title');
  for(const field of ['title_mr','title_en'])if(String(row[field]||'').length>250)errors.push(`${field}: title too long`);
  for(const field of ['body_mr','body_en'])if(String(row[field]||'').length>10000)errors.push(`${field}: description too long`);
  for(const field of ['external_url','image_url']){
   const v=String(row[field]||'');if(v && (!/^https:\/\/[^\s]+$/i.test(v)||v.length>2048))errors.push(`${field}: use a valid HTTPS link`);
  }
  if(row.sort_order&&!/^-?[0-9]{1,6}$/.test(row.sort_order))errors.push('Display order must be a whole number');
  if(seen.has(s))errors.push('Repeated short link in this CSV');
  if(already.has(s))errors.push('Short link already exists for this village');
  seen.add(s);
  return {...row,_errors:errors};
 });
}
export function rowsForInsert(rows){return rows.map(row=>Object.fromEntries(CSV_FIELDS.map(k=>[k,row[k]??''])));}

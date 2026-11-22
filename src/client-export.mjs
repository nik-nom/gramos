/** Client-side CSV/XLSX generation from Supabase rows. Never include passwords. */
const HEADERS=['Village slug','Website URL','Panchayat','Customer name','Customer email','Mobile','Gram sevak / officer','Taluka','District','Website status','Payment received','Notes','Record updated'];
export const clientTable=rows=>[HEADERS,...rows.map(({village,record={},domain})=>[
 village.slug||'',`https://${domain?.hostname||'gramos-public.vercel.app'}/v/${encodeURIComponent(village.slug||'')}`,record.panchayat_name||village.name_mr||village.name_en||'',record.customer_name||'',
 record.customer_email||'',record.customer_phone||'',record.gram_sevak_name||'',record.taluka||'',
 record.district||'',village.status==='published'?'Live':village.status==='archived'?'Archived':'Draft',
 record.payment_received===true?'Yes':record.payment_received===false?'No':'Not recorded',
 record.payment_notes||'',record.updated_at||''
])];
const formulaSafe=value=>{const s=String(value??'');return /^[\s\r\n]*[=+@\-\t\r]/.test(s)?`'${s}`:s;};
const csvCell=value=>`"${formulaSafe(value).replace(/"/g,'""')}"`;
export const clientsCSV=rows=>'\uFEFF'+clientTable(rows).map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
const xmlEscape=value=>formulaSafe(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
function crc32(bytes){let crc=~0;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(-(crc&1)&0xedb88320);}return (~crc)>>>0;}
const textBytes=s=>new TextEncoder().encode(s);
function zipFiles(files){
 const parts=[],central=[];let offset=0;
 const u16=(v)=>[v&255,(v>>>8)&255],u32=(v)=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 for(const [name,content] of Object.entries(files)){
  const nameBytes=textBytes(name),data=textBytes(content),sum=crc32(data),size=data.length;
  const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(size),...u32(size),...u16(nameBytes.length),...u16(0),...nameBytes]);
  parts.push(local,data);
  central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(size),...u32(size),...u16(nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...nameBytes]));
  offset+=local.length+data.length;
 }
 const directorySize=central.reduce((n,v)=>n+v.length,0);
 const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(central.length),...u16(central.length),...u32(directorySize),...u32(offset),...u16(0)]);
 const out=new Uint8Array(offset+directorySize+end.length);let p=0;
 for(const chunk of [...parts,...central,end]){out.set(chunk,p);p+=chunk.length;}
 return out;
}
const colName=n=>{let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
export const clientsXLSX=rows=>{
 const table=clientTable(rows),endCell=colName(HEADERS.length-1)+table.length;
 const lines=table.map((data,i)=>`<row r="${i+1}">${data.map((value,j)=>`<c r="${colName(j)}${i+1}" t="inlineStr" s="${i===0?1:0}"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`).join('')}</row>`).join('');
 const widths=HEADERS.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="${[18,46,30,25,30,18,27,20,20,18,18,40,24][i]}" customWidth="1"/>`).join('');
 return zipFiles({
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Customers" sheetId="1" r:id="rId1"/></sheets></workbook>',
 'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
 'xl/styles.xml':'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF133660"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>',
 'xl/worksheets/sheet1.xml':`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${endCell}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${lines}</sheetData><autoFilter ref="A1:${endCell}"/></worksheet>`
 });
};

/**
 * Screenshot-backed RTI list. The two source PDFs were NOT supplied here.
 * A reference card is only a label, not an official document or download.
 * Each village can publish an approved PDF using the same slug, or add more.
 */
export const referenceRTI=Object.freeze([
 {id:'template-notices-rti-bench-order',kind:'notices',slug:'rti-bench-order',title_mr:'खंडपीठ आदेश',title_en:'Bench Order',body_mr:'',body_en:'',status:'published',details:{notice_type:'rti'},external_url:'',sort_order:0,template_default:true},
 {id:'template-notices-rti-sections-1-13',kind:'notices',slug:'rti-sections-1-13',title_mr:'माहिती अधिकार १ ते १३',title_en:'Right to Information, Sections 1–13',body_mr:'',body_en:'',status:'published',details:{notice_type:'rti'},external_url:'',sort_order:1,template_default:true}
]);
export function mergeReferenceNotices(items,preview=false){
 const merged=new Map(referenceRTI.map(r=>[r.slug,r]));
 for(const r of (items||[])){
  if(r?.kind==='notices'&&(preview||r.status==='published'))merged.set(r.slug,r);
 }
 return [...merged.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}

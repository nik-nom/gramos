/**
 * Screenshot-backed RTI list. The two actual RTI source PDFs have not been supplied. Other supplied documents are labelled references, not RTI orders.
 * A reference card is only a label, not an official document or download.
 * Each village can publish an approved PDF using the same slug, or add more.
 */
export const referenceRTI=Object.freeze([
 {id:'template-notices-rti-bench-order',kind:'notices',slug:'rti-bench-order',title_mr:'खंडपीठ आदेश',title_en:'Bench Order',body_mr:'',body_en:'',status:'published',details:{notice_type:'rti'},external_url:'',sort_order:0,template_default:true},
 {id:'template-notices-rti-sections-1-13',kind:'notices',slug:'rti-sections-1-13',title_mr:'माहिती अधिकार १ ते १३',title_en:'Right to Information, Sections 1–13',body_mr:'',body_en:'',status:'published',details:{notice_type:'rti'},external_url:'',sort_order:1,template_default:true},
 {"id": "template-notices-reference-panchayat-campaign", "kind": "notices", "slug": "reference-panchayat-campaign", "title_mr": "मुख्यमंत्री समृद्ध पंचायतराज अभियान — शासन निर्णय", "title_en": "Panchayati Raj prosperity campaign — government resolution", "body_mr": "", "body_en": "", "status": "published", "details": {"notice_type": "rti", "event_date": "2025-08-06"}, "external_url": "/assets/forms/reference-panchayat-campaign.pdf", "sort_order": 2, "template_default": true},
 {"id": "template-notices-reference-rural-employment-faq", "kind": "notices", "slug": "reference-rural-employment-faq", "title_mr": "विकसित भारत-जी राम जी अधिनियम, २०२५ — प्रश्नोत्तरे (हिंदी)", "title_en": "Viksit Bharat G RAM G Act, 2025 — Hindi FAQ", "body_mr": "", "body_en": "", "status": "published", "details": {"notice_type": "rti", "event_date": "2026-05-11"}, "external_url": "/assets/forms/reference-rural-employment-faq.pdf", "sort_order": 3, "template_default": true},
 {"id": "template-notices-monthly-report-template", "kind": "notices", "slug": "monthly-report-template", "title_mr": "मासिक अहवाल — रिकामा नमुना", "title_en": "Monthly report — blank template", "body_mr": "", "body_en": "", "status": "published", "details": {"notice_type": "financial"}, "external_url": "/assets/forms/monthly-report-template.pdf", "sort_order": 4, "template_default": true}
]);
export const referenceNoticePaths=new Set(referenceRTI.map(r=>r.external_url).filter(Boolean));
export const rtiReferenceSlugs=new Set(["reference-panchayat-campaign","reference-rural-employment-faq"]);
export function mergeReferenceNotices(items,preview=false){
 const merged=new Map(referenceRTI.map(r=>[r.slug,r]));
 for(const r of (items||[])){
  if(r?.kind==='notices'&&(preview||r.status==='published')){const fallback=merged.get(r.slug);merged.set(r.slug,fallback?.external_url&&!r.external_url?{...r,external_url:fallback.external_url}:r);}
 }
 return [...merged.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}

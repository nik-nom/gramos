import {canonicalFormURL,referenceFormsPaths} from "./services-reference.js?v=6.9.3";
export const referenceRTI=Object.freeze([
  {
    "id": "template-notices-rti-bench-order",
    "kind": "notices",
    "slug": "rti-bench-order",
    "title_mr": "लोकसेवा हक्क अर्ज — नमुना १",
    "title_en": "Right to Service application — Form 1",
    "body_mr": "लोकसेवा हक्काचा अर्ज; माहिती अधिकाराचा आदेश नाही.",
    "body_en": "Right to Service application; not an RTI order.",
    "status": "published",
    "details": {
      "notice_type": "rti"
    },
    "external_url": "/assets/forms/lokseva-right-to-service-application.pdf",
    "sort_order": 0,
    "template_default": true
  },
  {
    "id": "template-notices-rti-sections-1-13",
    "kind": "notices",
    "slug": "rti-sections-1-13",
    "title_mr": "लोकसेवा हक्क अर्ज — नमुना २",
    "title_en": "Right to Service application — Form 2",
    "body_mr": "लोकसेवा हक्काचा अर्ज; माहिती अधिकाराचा आदेश नाही.",
    "body_en": "Right to Service application; not an RTI order.",
    "status": "published",
    "details": {
      "notice_type": "rti"
    },
    "external_url": "/assets/forms/lokseva-right-to-service-form-2.pdf",
    "sort_order": 1,
    "template_default": true
  },
  {
    "id": "template-notices-monthly-report-template",
    "kind": "notices",
    "slug": "monthly-report-template",
    "title_mr": "मासिक अहवाल — रिकामा नमुना",
    "title_en": "Monthly report — blank template",
    "body_mr": "",
    "body_en": "",
    "status": "published",
    "details": {
      "notice_type": "financial"
    },
    "external_url": "/assets/forms/gram-panchayat-monthly-report-template.pdf",
    "sort_order": 4,
    "template_default": true
  }
]);
export const referenceNoticePaths=new Set(referenceRTI.map(r=>r.external_url).filter(Boolean));
export const rtiReferenceSlugs=new Set(['reference-panchayat-campaign','reference-rural-employment-faq']);
export function mergeReferenceNotices(items,preview=false){
 const merged=new Map(referenceRTI.map(r=>[r.slug,r]));
 for(const original of (items||[])){
 if(original.kind!=='notices'||(!preview&&original.status!=='published')||original.deleted_at)continue;
 const row={...original,external_url:canonicalFormURL(original.external_url)};
 if(rtiReferenceSlugs.has(row.slug)&&row.details?.notice_type==='rti'&&(!row.external_url||referenceFormsPaths.has(row.external_url)))continue;
 const base=merged.get(row.slug);
 if(base&&(!row.external_url||row.external_url===base.external_url)&&base.details.notice_type==='rti')merged.set(row.slug,{...row,...base,id:row.id,template_default:false});
 else merged.set(row.slug,base?.external_url&&!row.external_url?{...row,external_url:base.external_url}:row);
 }
 return [...merged.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}

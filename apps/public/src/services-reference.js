
const renamedPdfPaths={"/assets/forms/V_Swaraj_Gramsoft_Form_1.pdf": "/assets/forms/birth-death-non-availability-form.pdf", "/assets/forms/V_Swaraj_Gramsoft_Form_3.pdf": "/assets/forms/marriage-registration-form.pdf", "/assets/forms/V_Swaraj_Gramsoft_Right_to_Service_Form_2.pdf": "/assets/forms/lokseva-right-to-service-form-2.pdf", "/assets/forms/declaration-toilet.pdf": "/assets/forms/toilet-self-declaration.pdf", "/assets/forms/declaration-residence.pdf": "/assets/forms/residence-self-declaration.pdf", "/assets/forms/declaration-electricity.pdf": "/assets/forms/electricity-connection-self-declaration.pdf", "/assets/forms/declaration-alive.pdf": "/assets/forms/life-self-declaration.pdf", "/assets/forms/declaration-deserted.pdf": "/assets/forms/deserted-woman-self-declaration.pdf", "/assets/forms/declaration-separated-family.pdf": "/assets/forms/separate-family-self-declaration.pdf", "/assets/forms/declaration-no-scheme.pdf": "/assets/forms/no-scheme-benefit-self-declaration.pdf", "/assets/forms/employment-registration.pdf": "/assets/forms/mgnrega-household-registration-form-1.pdf", "/assets/forms/required-documents.pdf": "/assets/forms/lokseva-required-documents-list.pdf", "/assets/forms/building-permission.pdf": "/assets/forms/building-permission-andarsul-sample.pdf"};
/**
 * GramOS / V Swaraj default Lokseva page data.
 * Static template content is shared by DEMO and every village; it is not copied
 * into Supabase, and is never a substitute for locally confirmed service rules.
 * Published village records with matching slugs override the corresponding card.
 * Additional published records are appended. 3 supplied PDFs are byte-for-byte
 * unchanged originals under /assets/forms/.
 */
const entry=(kind,slug,title_mr,title_en,body_mr='',body_en='',details={},external_url='',sort_order=0)=>({
 id:`template-${kind}-${slug}`,kind,slug,status:'published',title_mr,title_en,body_mr,body_en,
 details,external_url,sort_order,template_default:true
});
const desc=(required,process,fee='',duration='')=>({required_documents_mr:required,process_mr:process,fee_mr:fee,duration_mr:duration});
export const referenceServices=Object.freeze([
 entry('services','birth-certificate','जन्म नोंदणी व प्रमाणपत्र','Birth Registration and Certificate',
  'गावाच्या हद्दीत जन्म झाला असल्यास २१ दिवसांच्या आत जन्म नोंदणी केली जाते व प्रमाणपत्र दिले जाते.',
  'Information about birth registration and certificate requests within the village jurisdiction.',
  desc('अर्ज\nआई-वडील यांचे आधारकार्ड\nआशा/अंगणवाडी कार्यकर्ती यांचा अहवाल\nआवश्यकतेनुसार रुग्णालय कागदपत्रे',
       'जन्म गावाच्या हद्दीत झाला असल्याची खात्री झाल्यावर नोंदणी केली जाते. प्राथमिक आरोग्य केंद्र येथे झालेल्या जन्माची नोंदणी त्या ठिकाणी केली जाते.',
       'पहिले प्रमाणपत्र मोफत त्यानंतर २० रुपये','७ दिवस'),'',0),
 entry('services','death-certificate','मृत्यू नोंदणी व प्रमाणपत्र','Death Registration and Certificate',
  'गावाच्या हद्दीत मृत्यू झाला असल्यास २१ दिवसांच्या आत मृत्यू नोंदणी केली जाते व प्रमाणपत्र दिले जाते.',
  'Information about death registration and certificate requests within the village jurisdiction.',
  desc('अर्ज\nमयत व्यक्तीचे आधारकार्ड\nआवश्यकतेनुसार रुग्णालय/पोलीस स्टेशन कागदपत्रे',
       'मृत्यू गावाच्या हद्दीत झाला असल्याची खात्री झाल्यावर नोंदणी केली जाते.',
       'पहिले प्रमाणपत्र मोफत त्यानंतर २० रुपये','७ दिवस'),'',1),
 entry('services','marriage','विवाह नोंदणी व प्रमाणपत्र','Marriage Registration and Certificate',
  'विवाह नोंदणी अधिनियम 1998 नुसार विवाह नोंदणी केली जाते.',
  'Marriage registration information and required forms.',
  desc('विवाहाचे ज्ञापन\nवर-वधूचे जन्म प्रमाणपत्र\nशाळा सोडल्याचा दाखला\nआधार/मतदार कार्ड/ड्रायव्हिंग लायसन्स\nरेशन कार्ड/वीजबिल/पासपोर्ट\nलग्नपत्रिका\nशपथपत्र\nलग्नाचे फोटोग्राफ्स\nपासपोर्ट फोटो (2)\nतीन साक्षीदार फोटो (2)',
       'अर्ज व आवश्यक कागदपत्रे संबंधित कार्यालयात सादर करा.','कार्यालयात तपासा','कार्यालयात तपासा'),'',2),
 entry('services','below-poverty-line','दारिद्र्य रेषेखालील असल्याचा दाखला','Below Poverty Line Certificate',
  'दारिद्र्य रेषेखालील असलेल्या यादीत नाव असल्यास दाखला दिला जातो.',
  'Certificate based on a name in the applicable Below Poverty Line list.',
  desc('अर्ज','यादीत नाव तपासून दाखला दिला जातो.','२० रुपये','७ दिवस'),'',3),
 entry('services','namuna-eight','नमुना नं ८ चा उतारा','Form No. 8 Extract',
  'नमुना नंबर ८ मधील स्वमालकीच्या मालमत्तेचा उतारा दिला जातो.',
  'Property extract from the village Form No. 8 register.',
  desc('अर्ज','नमुना नं ८ रजिस्टरवरून नाव तपासून उतारा दिला जातो.','२० रुपये','५ दिवस'),'',4),
 entry('services','no-dues','थकबाकी नसल्याचे प्रमाणपत्र','No Dues Certificate',
  'ग्रामपंचायत करांची येणे बाकी नसल्यास प्रमाणपत्र दिले जाते.',
  'Certificate issued when no applicable village taxes remain outstanding.',
  desc('अर्ज','नमुना नं ९ रजिस्टरवरून नाव तपासून प्रमाणपत्र दिले जाते.','२० रुपये','—'),'',5),
 entry('services','destitute-certificate','निराधार असल्याचा दाखला','Destitute Certificate',
  'कुटुंब प्रमुखाच्या मृत्यूनंतर कुटुंब प्रमुख नसल्याचा दाखला दिला जातो.',
  'Certificate relating to family circumstances after the death of the head of household.',
  desc('अर्ज\nकुटुंब प्रमुख मृत्यू प्रमाणपत्र','चौकशी व खात्री करून प्रमाणपत्र दिले जाते.','नि:शुल्क','२० दिवस'),'',6),
]);
export const referenceSteps=Object.freeze([
 entry('service_steps','submit-application','अर्ज सादर करा','Submit Application','विहित नमुन्यात ग्रामपंचायत कार्यालयात अर्ज दाखल करा.','Submit the prescribed application to the Gram Panchayat office.',{},'',0),
 entry('service_steps','verify-documents','अर्ज व कागदपत्रे पडताळणी','Application and Document Verification','ग्रामपंचायत कार्यालयात प्राप्त अर्ज व कागदपत्रे यांची पडताळणी होईल.','The office verifies the application and its documents.',{},'',1),
 entry('service_steps','issue-certificate','प्रमाणपत्र वितरण','Certificate Issue','पात्र अर्जदारास विहित कालमर्यादेत प्रमाणपत्र दिले जाईल.','Eligible applicants receive the certificate within the applicable period.',{},'',2),
]);
export const referenceForms=Object.freeze([
 entry('service_forms','birth-death-nonavailability','जन्म मृत्यू अनुपलब्धता अर्ज','Birth/Death Non-availability Form','जन्म/मृत्यू नोंद अनुपलब्धतेसंबंधी अर्ज व जोडपत्रे.','Application and supporting documents for a birth/death non-availability certificate.',{},'/assets/forms/birth-death-non-availability-form.pdf',0),
 entry('service_forms','citizen-services-application','लोकसेवा अर्ज','Citizen Services Application','लोकसेवा हक्कांतर्गत दाखला किंवा प्रमाणपत्रासाठी अर्जाचा नमुना.','Application form for village certificates and citizen services.',{},'/assets/forms/lokseva-right-to-service-application.pdf',1),
 entry('service_forms','marriage-registration','विवाहनोंदणी अर्ज','Marriage Registration Application','विवाह नोंदणी चेकलिस्ट, ज्ञापन, शपथपत्र व इतर नमुने.','Marriage registration checklist, memorandum, affidavit and related templates.',{},'/assets/forms/marriage-registration-form.pdf',2),
 entry("service_forms","declaration-toilet","शौचालय असल्याबाबत स्वयंघोषणापत्र","Toilet self-declaration","","",{},"/assets/forms/toilet-self-declaration.pdf",3),
 entry("service_forms","declaration-residence","रहिवासी स्वयंघोषणापत्र","Residence self-declaration","","",{},"/assets/forms/residence-self-declaration.pdf",4),
 entry("service_forms","declaration-electricity","वीज जोडणीसाठी स्वयंघोषणापत्र","Electricity connection self-declaration","","",{},"/assets/forms/electricity-connection-self-declaration.pdf",5),
 entry("service_forms","declaration-alive","हयात असल्याबाबत स्वयंघोषणापत्र","Life self-declaration","","",{},"/assets/forms/life-self-declaration.pdf",6),
 entry("service_forms","declaration-deserted","परित्यक्त्या असल्याबाबत स्वयंघोषणापत्र","Deserted woman self-declaration","","",{},"/assets/forms/deserted-woman-self-declaration.pdf",7),
 entry("service_forms","declaration-separated-family","विभक्त कुटुंबाबाबत स्वयंघोषणापत्र","Separate household self-declaration","","",{},"/assets/forms/separate-family-self-declaration.pdf",8),
 entry("service_forms","declaration-no-scheme","कोणत्याही योजनेचा लाभ न घेतल्याचे स्वयंघोषणापत्र","No scheme benefit self-declaration","","",{},"/assets/forms/no-scheme-benefit-self-declaration.pdf",9),
 entry("service_forms","employment-registration","मनरेगा — मजूर कुटुंब नोंदणी अर्ज (नमुना १)","MGNREGA household registration (Form 1)","जुना संदर्भ नमुना; सध्याची प्रक्रिया कार्यालयात तपासा.","Legacy reference form; confirm current procedure locally.",{},"/assets/forms/mgnrega-household-registration-form-1.pdf",10),
 entry("service_forms","required-documents","अर्जासोबत जोडावयाच्या कागदपत्रांची यादी","Required documents checklist","","",{},"/assets/forms/lokseva-required-documents-list.pdf",11),
 entry("service_forms","building-permission","बांधकाम परवानगी अर्ज — अंदरसूल नमुना","Building permission application — Andarsul sample","अंदरसूल ग्रामपंचायतीचा २०२१ चा नमुना; आपल्या गावासाठी कार्यालयातून पडताळा.","2021 Andarsul sample; confirm the applicable local form before use.",{},"/assets/forms/building-permission-andarsul-sample.pdf",12),
 entry("service_forms","right-to-service-form-2","लोकसेवा हक्क अर्ज — नमुना २","Right to Service application — Form 2","","",{},"/assets/forms/lokseva-right-to-service-form-2.pdf",13),
 entry("service_forms","lokseva-application-alternate","अर्ज नमुना","Application specimen","","",{},"/assets/forms/lokseva-application-specimen.pdf",14),
 entry("service_forms","panchayat-campaign-gr","मुख्यमंत्री समृद्धी योजने GR","Mukhyamantri Samruddh Panchayatraj Abhiyan GR","","",{},"/assets/forms/mukhyamantri-samruddh-panchayatraj-abhiyan-gr-2025-08-06.pdf",15),
 entry("service_forms","rural-employment-faq","विकसित भारत-जी राम जी अधिनियम, २०२५ — प्रश्नोत्तरे (हिंदी)","Viksit Bharat G RAM G Act — Hindi FAQ","","",{},"/assets/forms/viksit-bharat-g-ram-g-act-2025-hindi-faq.pdf",16),
 entry("service_forms","monthly-report-template","मासिक अहवाल — रिकामा नमुना","Monthly report — blank template","","",{},"/assets/forms/gram-panchayat-monthly-report-template.pdf",17),
]);
export const referenceLinks=Object.freeze([
 ['aaple-sarkar','आपले सरकार सेवा केंद्र- ऑनलाइन सेवा','Aaple Sarkar Online Services','https://aaplesarkar.mahaonline.gov.in','blue'],
 ['rojgar','रोजगार पोर्टल (महास्वयंम)','Maharashtra Employment Portal','https://rojgar.mahaswayam.gov.in','gray'],
 ['crs','जन्म मृत्यू नोंदणी','Birth and Death Registration','https://dc.crsorgi.gov.in','yellow'],
 ['vistar','महाविस्तार AI - शास्त्रशुद्ध आणि रिअल-टाइम कृषीविषयक सल्ला','Mahavistar AI Agricultural Advice','https://vistar.maharashtra.gov.in','green'],
 ['egramswaraj','ई- ग्रामस्वराज','eGramSwaraj','https://egramswaraj.gov.in','peach'],
 ['imdpune','हवामान अंदाज','Weather Forecast','https://www.imdpune.gov.in/marathi/indexmarathi.php','lavender'],
 ['krishi','कृषि विभाग','Agriculture Department','https://krishi.maharashtra.gov.in','green'],
 ['mahabhumi','डिजिटल सातबारा','Digital Satbara','https://digitalsatbara.mahabhumi.gov.in','green'],
 ['social-justice','सामाजिक न्याय व विशेष सहाय्य विभाग','Social Justice Department','https://sjsa.maharashtra.gov.in','blue'],
 ['grievance','तक्रार निवारण प्रणाली','Grievance Redressal','https://grievances.maharashtra.gov.in/mr','blue'],
].map(([slug,mr,en,url,color],i)=>entry('service_links',slug,mr,en,'','',{color},url,i)));
export const referenceFormsPaths=new Set(referenceForms.map(x=>x.external_url));
const legacyPaths={...renamedPdfPaths,
 '/assets/forms/V_Swaraj_Gramsoft_Form_2.pdf':'/assets/forms/lokseva-right-to-service-application.pdf',
 '/assets/forms/V_Swaraj_Gramsoft_Right_to_Service_Form_1.pdf':'/assets/forms/lokseva-right-to-service-application.pdf',
 '/assets/forms/reference-panchayat-campaign.pdf':'/assets/forms/mukhyamantri-samruddh-panchayatraj-abhiyan-gr-2025-08-06.pdf',
 '/assets/forms/reference-rural-employment-faq.pdf':'/assets/forms/viksit-bharat-g-ram-g-act-2025-hindi-faq.pdf',
 '/assets/forms/monthly-report-template.pdf':'/assets/forms/gram-panchayat-monthly-report-template.pdf'};
export function canonicalFormURL(raw){
 const value=String(raw||'').trim(); let key=value;
 try{const u=new URL(value,globalThis.location?.origin||'https://local.invalid');if(u.origin===globalThis.location?.origin)key=u.pathname;}catch{}
 const canonical=legacyPaths[key]||key;
 return referenceFormsPaths.has(canonical)?canonical:value;
}
export function mergeReferenceRows(items,kind,preview=false){
 const defaults={services:referenceServices,service_steps:referenceSteps,service_forms:referenceForms,service_links:referenceLinks}[kind]||[];
 const saved=(items||[]).filter(x=>x.kind===kind&&(preview||x.status==='published')&&!x.deleted_at).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
 const merged=new Map(defaults.map(x=>[x.slug,x]));
 for(const original of saved){const row={...original,external_url:canonicalFormURL(original.external_url)};const base=merged.get(row.slug);
 if(kind==='service_forms'){
 // A legacy Form 2 link saved on the main Lokseva slot must not hide Form 1.
 if(row.slug==='citizen-services-application'&&row.external_url==='/assets/forms/lokseva-right-to-service-form-2.pdf')row.external_url=base.external_url;
 if(base?.external_url&&!row.external_url)row.external_url=base.external_url;
 // Old imported copies of the same bundled form use its existing card, not a duplicate.
 if(!base&&referenceFormsPaths.has(row.external_url)){const match=defaults.find(x=>x.external_url===row.external_url);if(match)continue;}
 }
 merged.set(row.slug,row);
 }
 return [...merged.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}

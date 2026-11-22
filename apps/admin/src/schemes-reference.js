/**
 * GramOS v4.6 — supplied Shamvadi screenshot reference for शासकीय योजना.
 * These are STATIC fallback templates, never copied into another village's DB.
 * Only passages visible in the supplied screenshots were transcribed. In
 * particular the public-development cards have very similar water-programme
 * text in the source screenshots; do not silently substitute different claims.
 * Historical amounts/eligibility are NOT represented as currently verified.
 */
const row=(slug,mr,en,type,bodyMr,bodyEn,details={},sort_order=0)=>({
 id:`template-schemes-${slug}`,kind:'schemes',slug,status:'published',
 title_mr:mr,title_en:en,body_mr:bodyMr,body_en:bodyEn,
 details:{scheme_type:type,...details},external_url:'',sort_order,template_default:true
});
const waterBody=`ग्रामीण भागातील सर्व कुटुंबांना सन 2024 पर्यंत हर घर नल से जल संकल्पनेनुसार राज्यातील ग्रामीण भागातील प्रत्येक घरात वैयक्तिक नळ जोडणीद्वारे दरडोई किमान 55 लिटर प्रति दिन, गुणवत्तापूर्ण पाणी पुरवठा करणे हे जलजीवन मिशनचे प्रमुख उद्दिष्ट आहे.\n\nजल जीवन मिशनसाठी संस्थात्मक यंत्रणा:-\nजल जीवन मिशनच्या मार्गदर्शक सूचना दिनांक 25.12.2019 रोजी केंद्र शासनाने प्रसिद्ध केल्या आहेत हा एक कालमर्यादित कार्यक्रम आहे. विहित कालावधीत उद्दिष्टपूर्ती करण्याचे लक्ष्य असल्याने यासाठी मजबूत चार स्तरीय संस्थात्मक संरचना तयार करण्यात आली आहे. ती अशी:\n1) राष्ट्रीय स्तरावर राष्ट्रीय जल जीवन मिशन (NJJM)\n2) राज्य स्तरावर राज्य पाणी व स्वच्छता मिशन (SWSM)\n3) जिल्हा स्तरावर जिल्हा पाणी व स्वच्छता मिशन (DWSM)\n4) ग्राम पातळीवर ग्रामीण पाणी पुरवठा व स्वच्छता समिती (VWSC)`;
const waterEnglish=`The reference describes the Jal Jeevan Mission goal of supplying at least 55 litres of quality water per person per day through household tap connections in rural areas by 2024.\n\nThe programme's four-level structure shown in the screenshot:\n1) National Jal Jeevan Mission (NJJM)\n2) State Water and Sanitation Mission (SWSM)\n3) District Water and Sanitation Mission (DWSM)\n4) Village Water and Sanitation Committee (VWSC)`;
export const referenceSchemes=Object.freeze([
 row('pmay','प्रधानमंत्री आवास योजना','Pradhan Mantri Awas Yojana','individual',
 `ही घरकुलाची केंद्र पुरस्कृत योजना असून पूर्वीच्या इंदिरा आवास योजनेचे रूपांतर प्रधानमंत्री आवास योजना ग्रामीण मध्ये करण्यात आले आहे. महाराष्ट्र राज्यात या योजनेची अंमलबजावणी सन 2016-17 या वित्तीय वर्षापासून करण्यात येत आहे. या योजनेसाठी केंद्र व राज्य हिस्सा अनुक्रमे 60:40 इतका आहे.`,
 'This centrally sponsored rural housing programme replaced the earlier Indira Awas Yojana. The screenshot states that Maharashtra implemented it from financial year 2016–17 with a central/state share of 60:40.',{
 benefits_mr:'2 लक्ष रुपये पर्यंत',benefits_en:'Up to ₹2 lakh (amount shown in supplied screenshot)',
 documents_mr:'आधार कार्ड, बँक पासबुक झेरॉक्स, जागेची कागदपत्रे, जॉबकार्ड',
 documents_en:'Aadhaar card, bank passbook copy, plot-related papers, job card',
 process_mr:'लाभार्थ्यांची निवड सामाजिक आर्थिक जात सर्वेक्षण-2011 मधील माहितीच्या आधारे करण्यात येते.',
 process_en:'Beneficiaries are selected using the information from the Socio-Economic and Caste Census 2011 (as shown in the reference).'
 },0),
 row('ramai','रमाई आवास योजना','Ramai Awas Yojana','individual',
 `रमाई आवास योजना ही महाराष्ट्र राज्य सरकारची योजना आहे, जी राज्यातील अनुसूचित जाती (SC) आणि नवबौद्ध घटकांतील व्यक्ती/कुटुंबांना पक्के घर उपलब्ध करून देण्यासाठी राबवली जाते.`,
 'A Maharashtra state housing scheme described in the reference for Scheduled Caste and Neo-Buddhist households.',{
 eligibility_mr:'लाभार्थी अनुसूचित जाती (SC) किंवा नवबौद्ध प्रवर्गातील असावा.\nवार्षिक उत्पन्न रु.1,20,000/- पर्यंत\nलाभार्थी बेघर असावा किंवा त्याच्याकडे पक्के घर नसावे.\nयापूर्वी शासनाच्या कोणत्याही घरकुल योजनेचा लाभ घेतलेला नसावा.',
 eligibility_en:'Scheduled Caste or Neo-Buddhist category\nAnnual income up to ₹1,20,000 (screenshot reference)\nHomeless or without a permanent home\nNo previous housing-scheme benefit',
 documents_mr:'सक्षम प्राधिकाऱ्याने दिलेले रहिवासी प्रमाणपत्र\nजातीचा दाखला\nउत्पन्नाचा दाखला\nबँक पासबुक झेरॉक्स\nजॉबकार्ड\nजागेची कागदपत्रे',
 documents_en:'Residence certificate\nCaste certificate\nIncome certificate\nBank passbook copy\nJob card\nPlot documents',
 benefits_mr:'1,20,000 + मनरेगा मजुरी + शौचालय अनुदान',benefits_en:'₹1,20,000 + MGNREGA wages + toilet grant (screenshot reference)',
 process_mr:'प्राप्त अर्जानुसार लाभार्थ्यांची निवड ग्रामसभेत केली जाते. अंतिम निवड मुख्य कार्यकारी जिल्हा परिषद यांच्या अध्यक्षतेखालील समितीकडून केली जाते.',
 process_en:'The Gram Sabha examines applications; the final selection is made by the committee chaired by the Zilla Parishad Chief Executive Officer, as described in the reference.'
 },1),
 row('pandit-dindayal','पंडित दीनदयाळ उपाध्याय घरकुल जागा खरेदी अर्थसहाय्य योजना','Pandit Deendayal Upadhyay Housing Plot Purchase Assistance','individual',
 `केंद्र पुरस्कृत प्रधानमंत्री आवास योजना (ग्रामीण) व राज्य पुरस्कृत अन्य ग्रामीण घरकुल योजनांतील घरकुल पात्र लाभार्थी केवळ जागे अभावी घरकुलाच्या लाभ मिळण्यापासून वंचित राहू नये यासाठी पंडित दीनदयाळ उपाध्याय घरकुल जागा खरेदी अर्थसहाय्य योजना सुरू करण्यात आली आहे.`,
 'Housing plot-purchase assistance for otherwise eligible rural housing beneficiaries who do not own land for building a house.',{
 eligibility_mr:'केंद्र पुरस्कृत प्रधानमंत्री आवास योजना (ग्रामीण) व राज्य पुरस्कृत ग्रामीण घरकुल योजनेतील घरकुल पात्र परंतु घरकुल बांधकामासाठी जागा उपलब्ध नसलेले कुटुंब',
 eligibility_en:'Eligible PMAY-G or state rural-housing households without land to build a house',
 documents_mr:'आधार कार्ड\nबँक पासबुक झेरॉक्स\nजागा खरेदी कागदपत्रे',documents_en:'Aadhaar card\nBank passbook copy\nPlot-purchase documents',
 benefits_mr:'जागा उपलब्ध नसलेल्या कुटुंबांना जागा खरेदी करण्यासाठी रु.100,000/- पर्यंत अर्थसहाय्य उपलब्ध',
 benefits_en:'Up to ₹1,00,000 for purchase of land (screenshot reference)',
 process_mr:'गट विकास अधिकारी पंचायत समिती यांच्या अध्यक्षतेखालील समिती',process_en:'Selection through the committee chaired by the Panchayat Samiti Block Development Officer (screenshot reference)'
 },2),
 row('transport-development','यात्रास्थळ विकास कार्यक्रम','Pilgrimage Site Development Programme','public',
 waterBody,waterEnglish,{},3),
 row('jal-jeevan','जल जीवन मिशन','Jal Jeevan Mission','public',
 waterBody,waterEnglish,{},4),
]);
/** Replace only a matching-slug reference card; new village cards append. */
export function mergeReferenceSchemes(items,preview=false){
 const merged=new Map(referenceSchemes.map(r=>[r.slug,r]));
 for(const record of (items||[])){
  if(record?.kind==='schemes'&&(preview||record.status==='published'))merged.set(record.slug,record);
 }
 return [...merged.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}

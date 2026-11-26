import {referenceSchemes} from './schemes-reference.js?v=6.9.3';
const demoVillage = {
  id:'demo', slug:'demo', status:'published', name_en:'Shamvadi', name_mr:'शामवाडी',
  tagline_en:'Welcome to the official Gram Panchayat website.', tagline_mr:'या अधिकृत संकेतस्थळावर आपले स्वागत आहे',
  about_en:'Welcome to this demonstration of a modern Gram Panchayat portal. All names, activities and content shown here are sample data. Create your own village in the admin panel to publish real information.',
  about_mr:'आधुनिक ग्रामपंचायत संकेतस्थळाच्या प्रात्यक्षिकात आपले स्वागत आहे. येथे दाखवलेली माहिती केवळ नमुना आहे. अधिकृत माहिती प्रकाशित करण्यासाठी ॲडमिनमधून आपले गाव तयार करा.',
  taluka_en:'Bhor',taluka_mr:'भोर',district_en:'Pune',district_mr:'पुणे',
  address_en:'Demo Gram Panchayat Office',address_mr:'नमुना ग्रामपंचायत कार्यालय',phone:'',email:'',
  hero_image_url:'/assets/reference-demo/hero-tree.webp',logo_url:'/assets/reference-demo/reference-logo.png',template_style:'classic',site_settings:{quote_mr:'गोष्टी तशाच राहतात; जोपर्यंत त्या कुणी बदलत नाही.',quote_en:'Things remain unchanged until someone changes them.',office_hours_mr:'सोमवार - शुक्रवार, सकाळ 09:45 - संध्याकाळ 06:15',office_hours_en:'Monday–Friday, 9:45 AM–6:15 PM'},home_sections:['gallery','services','news','projects']
};
function c(kind,slug,en,mr,bodyEn='',bodyMr='',subtitleEn='',subtitleMr='',image='') { return {id:`demo-${slug}`,village_id:'demo',kind,slug,title_en:en,title_mr:mr,body_en:bodyEn,body_mr:bodyMr,subtitle_en:subtitleEn,subtitle_mr:subtitleMr,image_url:image,status:'published',sort_order:0,created_at:'2026-01-02T00:00:00Z'}; }
const demoItems = [
 c('beneficiary_lists','disabled-district','Disabled beneficiaries (district/panchayat level)','दिव्यांग लाभार्थी जि. प. / पं. स. स्तर'),
 c('beneficiary_lists','disabled-village','Disabled beneficiaries (village level)','दिव्यांग लाभार्थी ग्रामस्तर'),
 c('beneficiary_lists','village-benefits','Gram Sabha Beneficiary List','ग्रामसभा लाभार्थी'),
 c('beneficiary_lists','social-welfare','Social Welfare Beneficiaries','समाजकल्याण लाभार्थी'),
 c('beneficiary_lists','ujjwala','Ujjwala Scheme Beneficiaries','उज्ज्वला योजना लाभार्थी'),
 c('beneficiary_lists','pm-kisan','PM Kisan Beneficiaries','पीएम किसान लाभार्थी'),
 c('services','birth-certificate','Birth Certificate','जन्म प्रमाणपत्र','Information about registering births and obtaining certificates.','जन्म नोंदणी आणि प्रमाणपत्र मिळवण्यासाठी माहिती.'),
 c('services','death-certificate','Death Certificate','मृत्यू प्रमाणपत्र','Information about registration and certificate requests.','मृत्यू नोंदणी आणि प्रमाणपत्रासाठी माहिती.'),
 c('services','marriage','Marriage Registration','विवाह नोंदणी','Information about marriage registration.','विवाह नोंदणी बाबत माहिती.'),
 c('services','no-dues','No Dues Certificate','थकबाकी नसल्याचे प्रमाणपत्र','Information on getting a no-dues certificate.','करांची थकबाकी नसल्याचे प्रमाणपत्र मिळविण्याची माहिती.'),
 c('notices','gram-sabha','Gram Sabha Meeting','ग्रामसभा दि. ३०/११/२०२५ रोजी सकाळी १० वाजता आहे','Sample notice: add the correct date and meeting details from the admin panel.','नमुना सूचना: ॲडमिनमधून बैठक दिनांक व तपशील भरा.'),
 c('notices','water-maintenance','Water Supply Maintenance','घरकुल मेळावा','Sample notice about scheduled maintenance.','नियोजित देखभालीबाबत नमुना सूचना.'),
 c('news','clean-village-drive','Clean Village Campaign','भारताची स्टील फ्रेम – अखिल भारतीय सेवा आणि राष्ट्रनिर्माण','A community cleanliness drive demonstrating how local news appears on the website.','ग्रामपातळीवरील बातम्या कशा दिसतात याचे हे प्रात्यक्षिक आहे.','Community','ग्राम विकास'),
 c('news','digital-services','Digital Citizen Services','नगरपरिषद सार्वत्रिक निवडणूक–२०२५ काय करावे व काय करू नये','A sample article about making local information accessible.','ग्रामपंचायत माहिती अधिक सुलभ करण्याविषयी नमुना लेख.'),
 c('leaders','state-leadership','State leadership','राज्यस्तरीय मान्यवर','Add verified current officeholders and photos in the admin.', 'ॲडमिनमधून सध्याचे पदाधिकारी व अधिकृत फोटो जोडा.'),
 c('officials','sarpanch','Sarpanch','सरपंच','Upload a verified profile photo and details in the admin.','ॲडमिनमधून अधिकृत छायाचित्र व तपशील भरा.','Elected representative','निवडून आलेले प्रतिनिधी'),
 c('officials','secretary','Gram Panchayat Officer','ग्रामपंचायत अधिकारी','Add verified office staff details here.','येथे अधिकृत कर्मचारी माहिती भरा.','Administration','प्रशासन'),
 c('projects','water-supply','Drinking Water Improvement','पाणीपुरवठा विहीर','Sample project summary, scheme, progress and location.','योजना, प्रगती आणि ठिकाण यांसह नमुना प्रकल्प माहिती.','Infrastructure','पायाभूत सुविधा'),
 c('projects','road-upgrade','Village Road Upgrade','सिमेंट रस्ता','Sample village development project description.','नमुना ग्रामविकास प्रकल्प वर्णन.','Development','विकासकाम'),
 c('schemes','housing','Housing Assistance','वैयक्तिक लाभाच्या योजना','Enter eligibility, required documents and application steps.','पात्रता, कागदपत्रे व अर्ज प्रक्रिया नमूद करा.'),
 c('schemes','sanitation','Public Development Schemes','सार्वजनिक विकासाच्या योजना','Information for citizens about local scheme applications.','स्थानिक योजनेच्या अर्जाविषयी नागरिकांना माहिती.'),
 c('facilities','primary-school','Primary School','प्राथमिक शाळा','Education facilities in the village.','गावातील शिक्षण सुविधा.'),
 c('facilities','health-subcentre','Health Sub-Centre','आरोग्य उपकेंद्र','Health facility information.','आरोग्य सुविधांची माहिती.'),
 c('gallery','village-landscape','Our Village','आपले गाव','Add actual village photography to this gallery.','या गॅलरीत गावाची खरी छायाचित्रे जोडा.','', '', '/assets/reference-demo/gallery-photo.webp'),
 c('gallery','rural-sunrise','Village Landscape','गावाचे दृश्य','Sample landscape photo.','नमुना फोटो.','','','/assets/reference-demo/gallery-photo.webp'),
 c('gallery','community-view','Village Surroundings','ग्रामपरिसर','Sample photo.','नमुना फोटो.','','','/assets/reference-demo/gallery-photo.webp'),
 c('news','village-information','Village Development Update','२६/११ च्या दहशतवादी हल्ल्यातील शहिदांना मुख्यमंत्र्यांचे अभिवादन','Sample community news update.','नमुना ग्रामविकास बातमी.'),
 c('projects','water-well','Water Supply Well','पाणीपुरवठा विहीर','Sample drinking water project.','नमुना पाणीपुरवठा काम.'),
 c('projects','panchayat-building','Panchayat Office Building','ग्रामपंचायत इमारत बांधकाम','Sample civic building work.','नमुना ग्रामपंचायत इमारत काम.'),
 c('pages','local-history','Village History','गावाचा इतिहास','A custom page that can be edited from the admin dashboard.','ॲडमिनमध्ये संपादित करता येणारे स्वतंत्र पान.')
];

// Reference-based, clearly labelled DEMO records. Real villages only use Supabase entries.
const reference='/assets/reference-demo/';
demoVillage.site_settings={...demoVillage.site_settings,
 quote_mr:'गोष्टी तशाच राहतात; जोपर्यंत त्या कुणी बदलत नाही.',quote_en:'Things remain the same until somebody changes them.',
 welcome_title_mr:'ग्रामपंचायत शामवाडी',welcome_title_en:'Gram Panchayat Shamvadi',
 welcome_subtitle_mr:'या अधिकृत संकेतस्थळावर आपले स्वागत आहे',welcome_subtitle_en:'Welcome to our official Gram Panchayat website',
 welcome_button_mr:'ग्रामपंचायतीबद्दल',welcome_button_en:'About Gram Panchayat',
 nav_mr:'home|मुखपृष्ठ\nabout|ग्रामपंचायतीबद्दल\nservices|लोकसेवा\nprojects|विकासकामे\nschemes|योजना\nnotices|नोटीस बोर्ड\nnews|बातम्या\ngallery|फोटो गॅलरी\ncontact|संपर्क',
 nav_en:'home|Home\nabout|About Panchayat\nservices|Services\nprojects|Development Works\nschemes|Schemes\nnotices|Notice Board\nnews|News\ngallery|Photo Gallery\ncontact|Contact',
 links_mr:'ग्रामविकास विभाग|https://rdd.maharashtra.gov.in/\nमहाराष्ट्र शासन|https://maharashtra.gov.in/\nई-ग्रामस्वराज|https://egramswaraj.gov.in/\nMGNREGA|https://nrega.dord.gov.in/\nशासन निर्णय|https://gr.maharashtra.gov.in/',
 links_en:'Rural Development|https://rdd.maharashtra.gov.in/\nMaharashtra Government|https://maharashtra.gov.in/\neGramSwaraj|https://egramswaraj.gov.in/',
 footer_social_heading_mr:'सोशल मीडिया',footer_social_heading_en:'Social Media',
 footer_social_body_mr:'ग्रामपंचायतीची अधिकृत सोशल मीडिया खाती',footer_social_body_en:'Official Panchayat social channels',
 copyright_mr:'© 2026 — हे एक डेमो संकेतस्थळ आहे.',copyright_en:'© 2026 — Demonstration only.'
};
demoVillage.home_sections=['gallery_notice','leaders_schemes','services_video','news','projects','facilities'];
demoVillage.site_settings={...demoVillage.site_settings,
 about_page_title_mr:'ग्रामपंचायतीबद्दल',about_page_title_en:'About Gram Panchayat',
 about_overview_heading_mr:'ग्रामपंचायतीची ओळख',about_overview_heading_en:'About Our Gram Panchayat',
 about_intro_mr:'ही माहिती प्रात्यक्षिकासाठी आहे. खरी माहिती ॲडमिनमधून भरा.',
 about_intro_en:'This is sample content. Enter real information through the admin.',
 about_mission_mr:'लोकसेवेसाठी माहिती सहज उपलब्ध करणे.',
 about_mission_en:'Make village information and services easy to access.',
 about_vision_mr:'अधिक पारदर्शक व सुलभ माहिती व्यवस्थापन.',
 about_vision_en:'Accessible and transparent village information.',
 about_cover_image_url:'',
 about_sections_heading_mr:'ग्रामपंचायतीची अधिक माहिती',about_sections_heading_en:'More About the Village'
};

function sample(kind,slug,title_mr,title_en,image_url='',body_mr='',body_en=''){
  return {id:'demo-'+slug,village_id:'demo',kind,slug,title_mr,title_en,body_mr,body_en,image_url,
  status:'published',sort_order:demoItems.filter(x=>x.kind===kind).length,created_at:'2025-11-26T00:00:00Z',details:{}};
}
// V11: The All Information demo intentionally has no fake extra-information box or photo.
demoItems.push(sample('banners','tree-plantation','वृक्षारोपण कार्यक्रम','Tree Planting Event',reference+'hero-tree.webp'));
demoItems.push(sample('banners','village-activities','ग्रामपंचायत उपक्रम','Village Activities',reference+'hero-tree.webp'));
demoItems.push(sample('banners','village-photo','ग्राम विकास','Village Development',reference+'hero-tree.webp'));
demoItems.push(sample('metrics','waste-projects','घनकचरा व्यवस्थापन प्रकल्प संख्या','Waste Management Projects'));
demoItems.push(sample('metrics','street-lights','रस्त्यावरील पथदिवे संख्या','Street Lights'));
demoItems.find(x=>x.slug==='waste-projects').details.value='1';
demoItems.find(x=>x.slug==='street-lights').details.value='210';
const demoPictures={
 'road-upgrade':'project-1.webp',
 'water-supply':'project-2.webp',
 'water-well':'project-3.webp',
 'panchayat-building':'project-4.webp'
};
for(const item of demoItems){
 if(item.kind==='projects'&&demoPictures[item.slug])item.image_url=reference+demoPictures[item.slug];
}
const demoNewsImages=[
 'news-1.webp',
 'news-2.webp',
 'news-3.webp'
];
for(const [i,item] of demoItems.filter(x=>x.kind==='news').entries()){if(demoNewsImages[i])item.image_url=reference+demoNewsImages[i];}

for(const item of demoItems){
  if(item.kind==='news')item.details={event_date:'2025-11-26',author_mr:'ग्रामपंचायत अधिकारी',author_en:'Panchayat Officer'};
  if(item.kind==='notices')item.details={...item.details,event_date:item.slug==='gram-sabha'?'2025-11-30':'2025-12-03',notice_type:'notice'};
  if(item.kind==='projects'){
    const rows={
      'road-upgrade':['15 वा वित्त आयोग','15th Finance Commission',2025,'शामवाडी फाटा','Shamvadi road'],
      'water-supply':['जल जीवन मिशन','Jal Jeevan Mission',2024,'शामवाडी तलाव','Village tank'],
      'water-well':['जल जीवन मिशन','Jal Jeevan Mission',2024,'शामवाडी','Shamvadi'],
      'panchayat-building':['जनसुविधा योजना','Public Facilities Scheme',2024,'शामवाडी','Shamvadi']
    };
    const d=rows[item.slug]||[];item.details={scheme_mr:d[0],scheme_en:d[1],project_year:d[2],location_mr:d[3],location_en:d[4],project_status:'completed'};
  }
}

// V7 demo-only examples so all reference-layout panels are visible before a village is created.
for (const [kind,slug,mr,en,roleMr,roleEn] of [
 ['leaders','demo-leader-1','माननीय मंत्री','State Representative','माननीय प्रतिनिधी','Honourable Representative'],
 ['leaders','demo-leader-2','माननीय उपमंत्री','Deputy Representative','माननीय उपमंत्री','Deputy Representative'],
 ['leaders','demo-leader-3','माननीय पदाधिकारी','Official Representative','माननीय पदाधिकारी','Representative'],
 ['officials','demo-official-1','ग्रामपंचायत अधिकारी','Panchayat Officer','कार्यालय प्रमुख','Village Administration'],
 ['officials','demo-official-2','ग्रामपंचायत कर्मचारी','Village Staff','कार्यालय कर्मचारी','Staff'],
 ['officials','demo-official-3','ग्रामसेवक','Village Secretary','ग्रामसेवक','Secretary']
]) demoItems.push({...sample(kind,slug,mr,en),subtitle_mr:roleMr,subtitle_en:roleEn});

// Only demonstration content; these are reference layout examples, not official records.
for(const item of demoItems.filter(x=>x.kind==='notices')){
  item.details={...item.details,notice_type:'notice'};
  item.external_url='/assets/reference-demo/notice-sample.pdf';
}
const sampleNotice=(slug,mr,en,type,date='')=>{
 const i=sample('notices',slug,mr,en);i.details={notice_type:type,...date?{event_date:date}:{}};i.external_url='/assets/reference-demo/notice-sample.pdf';demoItems.push(i);return i;
};
sampleNotice('demo-gpdp-notice','gpdp प्रशिक्षण','GPDP Training','notice','2025-11-29');
sampleNotice('demo-finance-report','वार्षिक अहवाल सन २०२४–२५','Annual Income & Expense Report 2024–25','financial');
sampleNotice('rti-bench-order','खंडपीठ आदेश','RTI Bench Order','rti');
sampleNotice('rti-sections-1-13','माहिती अधिकार १ ते १३','RTI Sections 1–13','rti');
// The reference screenshot shows RTI download buttons, but the matching RTI PDFs
// were not supplied. Do not mislabel an unrelated sample PDF as an RTI order.
for(const record of demoItems.filter(x=>x.kind==='notices'&&['rti-bench-order','rti-sections-1-13'].includes(x.slug)))record.external_url='';
sampleNotice('demo-gr-1','मुख्यमंत्री समृद्ध पंचायत राज अभियान — शासन निर्णय','Gram Panchayat Development — Government Resolution','resolutions');
sampleNotice('demo-gr-2','महाराष्ट्र लोकसेवा हक्क अधिनियम — शासन निर्णय','Public Service Guarantee Act — Government Resolution','resolutions');
sampleNotice('demo-gr-3','आदिवासी अभियान — शासन निर्णय','Tribal Development — Government Resolution','resolutions');
sampleNotice('demo-gr-4','माझं गाव, आरोग्य संपन्न गाव — शासन निर्णय','Healthy Village — Government Resolution','resolutions');
sampleNotice('demo-gr-5','१६ वा वित्त आयोग मार्गदर्शक सूचना','16th Finance Commission Guidance','resolutions');
// Match the visible reference order in the demo; live records use admin display order.
for(const [slug,order] of [['water-maintenance',1],['demo-gpdp-notice',2],['gram-sabha',3]]){
 const record=demoItems.find(x=>x.kind==='notices'&&x.slug===slug);if(record)record.sort_order=order;
}
export const getDemo = () => ({village:demoVillage, items:demoItems});

// V9 demonstration data for the six About tabs. None of these are official facts.
// Production village pages read ONLY their own published Supabase records.
const demoAboutFacts=[
 ['established','स्थापना दिनांक','Established','१९६९ (नमुना)','1969 (sample)','basic'],
 ['wards','एकूण प्रभाग संख्या','Number of wards','३ (नमुना)','3 (sample)','basic'],
 ['area','एकूण क्षेत्रफळ','Total area','१५.४ (नमुना)','15.4 (sample)','basic'],
 ['households','एकूण कुटुंबे','Households','१२३० (नमुना)','1,230 (sample)','population'],
 ['men','पुरुष','Male population','१९०० (नमुना)','1,900 (sample)','population'],
 ['women','महिला','Female population','१७४० (नमुना)','1,740 (sample)','population'],
 ['literacy','साक्षरता दर','Literacy rate','८०% (नमुना)','80% (sample)','population']
];
for(const [slug,mr,en,valueMr,valueEn,group] of demoAboutFacts){
 const item=sample('about_facts',slug,mr,en); item.details={group,value:valueMr};
 item.body_en=valueEn; item.body_mr=valueMr; demoItems.push(item);
}
for(const obj of demoItems.filter(x=>x.kind==='officials')){
 obj.details={about_group:['secretary','demo-official-3'].includes(obj.slug)?'staff':'representatives',ward_mr:'नमुना वॉर्ड',ward_en:'Sample ward',phone:'',elected_date:''};
}
const thirdStaff=sample('officials','demo-staff-3','नमुना कर्मचारी','Sample Staff');
thirdStaff.subtitle_mr='ग्रामपंचायत कर्मचारी';thirdStaff.subtitle_en='Village Employee';thirdStaff.details={about_group:'staff'};demoItems.push(thirdStaff);
for(const [idx,committee,key,english] of [
 [0,'नमुना ग्राम समिती','gram-committee','Sample Village Committee'],
 [1,'नमुना ग्राम समिती','gram-committee','Sample Village Committee'],
 [2,'नमुना विकास समिती','development-committee','Sample Development Committee'],
 [3,'नमुना विकास समिती','development-committee','Sample Development Committee'],
 [4,'नमुना आरोग्य समिती','health-committee','Sample Health Committee']
]){
 const item=sample('committees',`demo-committee-${idx+1}`,`नमुना सदस्य ${idx+1}`,`Sample Member ${idx+1}`);
 item.subtitle_mr='सदस्य';item.subtitle_en='Member';item.sort_order=idx;
 item.details={committee_key:key,committee_title_mr:committee,committee_title_en:english,committee_role_mr:idx%2?'सदस्य':'अध्यक्ष',committee_role_en:idx%2?'Member':'Chairperson'};
 demoItems.push(item);
}
for(const [key,mr,en,value] of [
 ['school-primary','प्राथमिक शाळांची संख्या','Primary Schools','2'],
 ['school-secondary','माध्यमिक शाळांची संख्या','Secondary Schools','1'],
 ['school-high','उच्च माध्यमिक शाळा','Higher Secondary Schools','1'],
 ['anganwadi','अंगणवाडी संख्या','Anganwadi Centres','9'],
 ['public-water','सार्वजनिक पाणीपुरवठा','Public Water Supply','होय / Yes'],
 ['banks','गावात बँक आहे का?','Bank Available','होय / Yes']
]){const item=sample('facilities',`demo-${key}`,mr,en);item.details={value};demoItems.push(item);}
for(const [i,mr,en,mrBullets,enBullets,accent,icon] of [
 [0,'सरपंच','Sarpanch','ग्रामपंचायतीच्या सभेचे अध्यक्षस्थान भूषविणे.\nग्रामविकास कामांवर देखरेख करणे.','Chair Panchayat meetings.\nOversee local development work.','#bf392b','♟'],
 [1,'ग्रामपंचायत शिपाई','Panchayat Assistant','कार्यालयाची स्वच्छता राखणे.\nदैनंदिन कामात सहाय्य करणे.','Help maintain the office.\nAssist with daily operations.','#149f88','✦'],
 [2,'उपसरपंच','Deputy Sarpanch','सरपंच यांच्या अनुपस्थितीत कामकाज पाहणे.\nग्रामपंचायत सभेत सहभाग घेणे.','Support the Sarpanch.\nParticipate in council meetings.','#de6000','♙'],
 [3,'पाणीपुरवठा कर्मचारी','Water Supply Staff','नळाद्वारे पाणीपुरवठा सेवा पाहणे.\nदेखभाल कामात मदत करणे.','Help manage water distribution.\nSupport maintenance tasks.','#2983be','💧'],
 [4,'ग्रामपंचायत सदस्य','Council Member','नागरिकांचे प्रश्न मांडणे.\nग्रामसभेत सहभाग घेणे.','Represent residents.\nParticipate in meetings.','#974db6','✿'],
 [5,'संगणक परिचालक','Computer Operator','ऑनलाइन सेवांसाठी सहाय्य करणे.\nमाहिती व्यवस्थापनात मदत करणे.','Help provide online services.\nAssist with information management.','#20a85a','▣']
]){
 const item=sample('duties',`demo-duty-${i+1}`,mr,en,'',mrBullets,enBullets);item.sort_order=i;item.details={accent,icon};demoItems.push(item);
}
demoVillage.site_settings={...demoVillage.site_settings,
 about_intro_mr:'आम्ही आपल्या गावाच्या शाश्वत व समृद्ध विकासासाठी कटिबद्ध आहोत. (नमुना)',
 about_intro_en:'We are committed to sustainable village development. (Sample page)',
 about_mission_mr:'नागरिकांना सुलभ सेवा देणे.\nपारदर्शक ग्रामविकास साधणे.\nपर्यावरण संवर्धन करणे.',
 about_mission_en:'Provide accessible citizen services.\nBuild transparent administration.\nProtect the local environment.',
 about_vision_mr:'सर्व नागरिकांना समान हक्क व सेवा.\nसर्वसमावेशक ग्रामविकास.\nस्वच्छ व सुरक्षित गाव.',
 about_vision_en:'Equal rights and services for all.\nInclusive village development.\nA clean and safe village.'
};

// V10 demo-only page structure aligned to the screenshot sections. These are NOT
// official Shamvadi records and are never inserted into a real village database.
const screenshotCommittees=[
 ['development','मुख्यमंत्री समृद्ध पंचायत राज अभियान समिती','Village Development Committee'],
 ['aadishakti','आदिशक्ती अभियान समिती','Community Development Committee'],
 ['health','ग्राम आरोग्य पोषण पाणीपुरवठा व स्वच्छता समिती','Village Health and Sanitation Committee'],
 ['children','ग्राम बाल संरक्षण समिती','Child Protection Committee'],
 ['biodiversity','जैविक विविधता व्यवस्थापन समिती','Biodiversity Management Committee'],
 ['peace','महात्मा गांधी तंटामुक्त गाव समिती','Village Peace Committee']
];
for(const [i,[key,mr,en]] of screenshotCommittees.entries()){
 const item=sample('committee_groups',`demo-${key}-group`,mr,en);
 item.slug=key;item.sort_order=i;
 demoItems.push(item);
}
for(const [index,item] of demoItems.filter(x=>x.kind==='committees').entries()){
 const [key,mr,en]=screenshotCommittees[index%3];
 item.details={...item.details,committee_key:key,committee_title_mr:mr,committee_title_en:en};
}
for (const [slug,mr,en,val] of [
 ['distance','तालुका मुख्यालयापासून अंतर (कि.मी)','Distance from Taluka HQ (km)','23'],
 ['public-borewell','सार्वजनिक बोअरवेल','Public borewells','4'],
 ['public-well','सार्वजनिक विहिरी संख्या','Public wells','2'],
 ['health-centre','गावात प्राथमिक आरोग्य उपकेंद्र आहे का?','Health centre available?','होय'],
 ['electricity','वीजपुरवठा आहे का?','Electricity available?','होय'],
 ['local-roads','रस्त्यावरील दिव्यांची संख्या','Street lights','210']
]){
 const item=sample('about_facilities',`v10-${slug}`,mr,en);item.details={value:val};demoItems.push(item);
}
const demoOfficial=sample('officials','v10-third-representative','नमुना ग्रामपंचायत सदस्य','Sample Panchayat Member');
demoOfficial.subtitle_mr='सदस्य';demoOfficial.subtitle_en='Member';demoOfficial.details={about_group:'representatives'};demoItems.push(demoOfficial);
const demoStaff=sample('officials','v10-third-staff','नमुना कार्यालय कर्मचारी','Sample Office Employee');
demoStaff.subtitle_mr='कार्यालय कर्मचारी';demoStaff.subtitle_en='Office Employee';demoStaff.details={about_group:'staff'};demoItems.push(demoStaff);
for(const [slug,mr,en,bodyMr,bodyEn,accent] of [
 ['computer-operator','संगणक परिचालक','Computer Operator','ऑनलाईन सेवा व्यवस्थापन करणे.\nअर्जदारांना मदत करणे.','Maintain online services.\nSupport applicants.','#26ad61'],
 ['village-assistant','ग्रामरोजगार सहाय्यक','Employment Assistant','माहिती संकलित करणे.\nकार्यक्रमास सहाय्य करणे.','Collect information.\nSupport village programmes.','#e67617']
]){
 const item=sample('duties',`v10-${slug}`,mr,en,'',bodyMr,bodyEn);
 item.details={accent,icon:'●'};demoItems.push(item);
}

// v2.2: Lokseva demonstration ONLY. Never copied to a real village's content_items.
// These examples illustrate the admin-driven card structure without claiming to be live services.
for(const service of demoItems.filter(x=>x.kind==='services')){
  const refDetails={
    'birth-certificate':{
      required_documents_mr:'अर्ज\nपालकांचा ओळखपत्र पुरावा\nआवश्यकतेनुसार वैद्यकीय कागदपत्रे',
      required_documents_en:'Application form\nParent identity documents\nMedical documents if required',
      process_mr:'ग्रामपंचायत कार्यालयात अर्ज सादर करा\nकागदपत्रांची तपासणी केल्यानंतर प्रमाणपत्र देणे',
      process_en:'Submit the application\nThe office verifies documents and issues a certificate',
      fee_mr:'कार्यालयाकडून माहिती घ्या',fee_en:'Confirm with office',
      duration_mr:'अर्जानुसार',duration_en:'Depends on application',icon:'▤'
    },
    'death-certificate':{
      required_documents_mr:'अर्ज\nमयत व्यक्तीचा ओळखपत्र पुरावा',
      required_documents_en:'Application form\nIdentity documents of the deceased',
      process_mr:'अर्जाची तपासणी\nनोंदणी पडताळणी\nप्रमाणपत्र वितरण',
      process_en:'Application review\nRegistration verification\nCertificate issue',icon:'▤'
    },
    marriage:{icon:'▤'},'no-dues':{icon:'▤'}
  };
  service.details={...service.details,...(refDetails[service.slug]||{})};
}
for(const [i,[mr,en,bodyMr,bodyEn]] of [
  ['अर्ज सादर करा','Submit Application','ग्रामपंचायत कार्यालयात आवश्यक कागदपत्रांसह अर्ज सादर करा.','Submit the required application and documents to the village office.'],
  ['कागदपत्रे पडताळणी','Document Verification','अर्जातील कागदपत्रांची पडताळणी केली जाते.','The village office reviews submitted documents.'],
  ['प्रमाणपत्र वितरण','Certificate Collection','पात्र अर्जदाराला माहिती देऊन प्रमाणपत्र वितरित केले जाते.','The certificate is made available to eligible applicants.']
].entries()){
  const step=sample('service_steps',`demo-step-${i+1}`,mr,en,'',bodyMr,bodyEn);
  step.sort_order=i;demoItems.push(step);
}
for(const [slug,mr,en] of [
  ['birth-death-form','जन्म-मृत्यू अनुपलब्धता अर्ज','Birth/Death Non-availability Form'],
  ['citizen-services-form','लोकसेवा अर्ज','Citizen Services Application'],
  ['marriage-registration-form','विवाह नोंदणी अर्ज','Marriage Registration Form']
]){
 const form=sample('service_forms',`demo-${slug}`,mr,en,'',
   'नमुना पान — अधिकृत PDF ॲडमिनमधून अपलोड करा.',
   'Demo only — upload an official PDF in the admin dashboard.');
 form.external_url='';demoItems.push(form);
}
demoVillage.site_settings={...demoVillage.site_settings,
  services_page_title_mr:'उपलब्ध लोकसेवा',services_page_title_en:'Available Citizen Services',
  services_intro_mr:'सेवा हक्क अधिनियम अंतर्गत ग्रामपंचायतीकडून देण्यात येणाऱ्या सेवांची माहिती व अर्ज प्रक्रिया',
  services_intro_en:'Information and application procedures for Gram Panchayat citizen services'
};


// v2.6: reference-style CITIZEN LINKS are visible only in their own tab.
// These are demonstration entries, never automatically copied to a real village.
for(const [i,[slug,mr,en,url,color]] of [
 ['aaple-sarkar','आपले सरकार सेवा केंद्र — ऑनलाइन सेवा','Aaple Sarkar Online Services','https://aaplesarkar.mahaonline.gov.in','blue'],
 ['rojgar','रोजगार पोर्टल (महास्वयंम)','Maharashtra Employment Portal','https://rojgar.mahaswayam.gov.in','gray'],
 ['crs','जन्म मृत्यू नोंदणी','Birth and Death Registration','https://dc.crsorgi.gov.in','yellow'],
 ['vistar','कृषी सल्ला','Agricultural Advice','https://vistar.maharashtra.gov.in','green'],
 ['egramswaraj','ई-ग्रामस्वराज','eGramSwaraj','https://egramswaraj.gov.in','peach'],
 ['mahabhumi','डिजिटल सातबारा','Digital Satbara','https://digitalsatbara.mahabhumi.gov.in','lavender'],
 ['krishi','कृषी विभाग','Department of Agriculture','https://krishi.maharashtra.gov.in','green'],
 ['grievance','तक्रार निवारण प्रणाली','Grievance Redressal','https://grievances.maharashtra.gov.in/mr','blue']
].entries()){
 const item=sample('service_links',`demo-link-${slug}`,mr,en);
 item.external_url=url;item.details={color};item.sort_order=i;
 demoItems.push(item);
}

// v2.8: screenshot-based scheme card examples. These are NOT government eligibility
// determinations; villages must enter and publish verified, current scheme information.
// Remove the previous two generic cards so the demo has the reference's 3+2 layout.
for(let i=demoItems.length-1;i>=0;i--)if(demoItems[i].kind==='schemes')demoItems.splice(i,1);
for(const template of referenceSchemes){
 demoItems.push({...template,id:`demo-${template.slug}`,village_id:'demo'});
}
demoVillage.site_settings={...demoVillage.site_settings,
 schemes_page_title_mr:'शासकीय योजना',schemes_page_title_en:'Government Schemes',
 schemes_intro_mr:'ग्रामपंचायतीशी संबंधित महत्त्वाच्या शासकीय योजनांची माहिती',
 schemes_intro_en:'Important government schemes relevant to the Gram Panchayat.'
};

// Screenshot-based reference portraits, DEMO ONLY. Titles are reference labels, not current-office verification.
const referencePeople=[
 ['leaders','minister-1','श्रीमती सुनेत्रा अजित पवार','Sunetra Ajit Pawar','माननीय उपमुख्यमंत्री','Deputy Chief Minister'],
 ['leaders','minister-2','श्री. एकनाथ शिंदे','Eknath Shinde','माननीय उपमुख्यमंत्री','Deputy Chief Minister'],
 ['leaders','minister-3','श्री. जयकुमार गोरे','Jaykumar Gore','माननीय मंत्री ग्रामविकास विभाग','Rural Development Minister'],
 ['leaders','minister-4','श्री. योगेश कदम','Yogesh Kadam','माननीय राज्यमंत्री ग्रामविकास विभाग','Minister of State, Rural Development'],
 ['leaders','minister-5','डॉ. चंद्रकांत पुलकुंडवार','Dr. Chandrakant Pulkundwar','माननीय प्रधान सचिव ग्रामविकास विभाग','Principal Secretary, Rural Development'],
 ['officials','official-1','नमुना सरपंच','Sample Sarpanch','सरपंच','Sarpanch'],
 ['officials','official-2','नमुना उपसरपंच','Sample Deputy Sarpanch','उपसरपंच','Deputy Sarpanch'],
 ['officials','official-3','नमुना ग्रामपंचायत अधिकारी','Sample Panchayat Officer','ग्रामपंचायत अधिकारी','Gram Panchayat Officer']
];
for(let i=demoItems.length-1;i>=0;i--)if(['leaders','officials'].includes(demoItems[i].kind))demoItems.splice(i,1);
for(const [kind,slug,mr,en,roleMr,roleEn] of referencePeople){
 const item=sample(kind,slug,mr,en,reference+slug+'.webp');
 item.subtitle_mr=roleMr;item.subtitle_en=roleEn;item.sort_order=demoItems.filter(x=>x.kind===kind).length;
 if(kind==='officials')item.details={about_group:slug==='official-3'?'staff':'representatives'};
 demoItems.push(item);
}

export const referenceLeaderCards=Object.freeze(demoItems.filter(x=>x.kind==='leaders').map(({slug,title_mr,title_en,subtitle_mr,subtitle_en,image_url,sort_order})=>Object.freeze({slug,title_mr,title_en,subtitle_mr,subtitle_en,image_url,sort_order})));

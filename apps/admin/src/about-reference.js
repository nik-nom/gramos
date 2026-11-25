/**
 * GramOS About page — fixed public-template copy.
 * Marathi content transcribed from the client's Shamvadi reference screenshots,
 * 21 November 2026. These reference sentences are CODE, never rows in Supabase.
 * Admins may publish extra paragraphs/records, but cannot change or remove these.
 *
 * IMPORTANT: No Shamvadi-specific population, office dates, names or codes appear
 * here. Those must be supplied by the individual village from verified records.
 */
export const FIXED_ABOUT_VERSION = '2026-11-21-reference-1';

export const FIXED_MISSION_MR = Object.freeze([
  'गावातील सर्व नागरिकांना उच्च दर्जाच्या भौतिक व प्रशासकीय सेवा प्रदान करणे',
  'गावाचा शाश्वत विकास घडवून निसर्गसंपन्न, समृद्ध परिसर निर्माण करणे',
  'समाजाच्या प्रत्येक घटकांपर्यंत शासनाच्या योजना पोहचवून भेदभावमुक्त, सशक्त, सुरक्षित गाव निर्माण करणे'
]);
export const FIXED_VALUES_MR = Object.freeze([
  'सर्व नागरिकांना समान हक्क या न्यायाने सेवा प्रदान करणे',
  'समाजातील सर्व घटकांचे कल्याण साधणे',
  'पर्यावरण संवर्धन व संरक्षण',
  'सर्वधर्मसमभाव, महिलांसाठी, बालकांसाठी ग्राम निर्मिती'
]);
// English rendering preserves meaning; authoritative reference copy is Marathi.
export const FIXED_MISSION_EN = Object.freeze([
  'Provide high-quality physical and administrative services to all village residents',
  'Achieve sustainable development and create a prosperous, nature-rich environment',
  'Ensure government schemes reach all sections of society and build an empowered, safe, discrimination-free village'
]);
export const FIXED_VALUES_EN = Object.freeze([
  'Provide services fairly and with equal rights for all citizens',
  'Work for the welfare of every section of society',
  'Conserve and protect the environment',
  'Build a village that respects all religions and supports women and children'
]);

// Fixed reference cards are ordered left/right in the same way as the screenshots.
// Extra village-published duties are displayed separately or added after the fixed
// bullets on a matching role; the reference copy itself is never replaced.
export const FIXED_DUTIES = Object.freeze([
  {
    key:'sarpanch', title_mr:'सरपंच', title_en:'Sarpanch', accent:'#bf392b', icon:'♟',
    bullets_mr:[
      'महाराष्ट्र ग्रामपंचायत अधिनियमाचे उपबंध व ग्रामपंचायतीने संमत केलेले ठराव अमलात आणणे.',
      'सरपंच ग्रामपंचायतीच्या सभेचे अध्यक्ष म्हणून काम करणे, ग्रामपंचायतीच्या सभांचे नियमन करणे.',
      'ग्रामसभेच्या बैठकी बोलविणे व त्यात अध्यक्ष म्हणून काम पाहणे.',
      'पंचायतीचा प्रथम नागरिक या नात्याने ग्राम पंचायत निधीत जमा झालेल्या सर्व रकमेचे कोषाध्यक्ष म्हणून काम पाहणे.',
      'ग्रामपंचायतीच्या सर्व अधिकाऱ्यांनी व कर्मचाऱ्यांनी केलेली कृत्ये आणि केलेली कार्यवाही यावर देखरेख व नियंत्रण ठेवणे.',
      'महाराष्ट्र ग्रामपंचायत अधिनियमान्वये आवश्यक असलेली सर्व विवरणपत्रे व प्रतिवृत्ते तयार करण्याची व्यवस्था करणे.',
      'ग्रामपंचायत सभांच्या कार्यवृत्तीस अंतिम रूप देणे.',
      'ग्रामपंचायतीचे वार्षिक अंदाजपत्रक तयार करणे.',
      'ग्रामपंचायतीतही विचार विनिमय करून, योजना राबविण्यासाठी इतर सर्व अधिकाऱ्यांचा वापर करणे.',
      'महाराष्ट्र ग्रामपंचायत अधिनियमान्वये किंवा त्याअन्वये केलेल्या नियमांद्वारे सरपंचाला प्रदान करण्यात येतील अशा अन्य अधिकारांचा वापर करणे व कर्तव्ये पार पाडणे.'
    ]
  },
  {
    key:'peon',title_mr:'ग्रामपंचायत शिपाई',title_en:'Gram Panchayat Attendant',accent:'#149f88',icon:'✦',
    bullets_mr:[
      'ग्रामपंचायत कार्यालयीन स्वच्छता करणे.',
      'विविध सभेच्या व इतर नोटीसा तामील करणे, डकवणे.',
      'कर मागणी बिले वाटप करणे, करवसुलीसाठी मदत करणे.',
      'पंचायतीने नेमून दिलेली सर्व कार्ये पार पाडणे.'
    ]
  },
  {
    key:'deputy',title_mr:'उपसरपंच',title_en:'Deputy Sarpanch',accent:'#e86100',icon:'♙',
    bullets_mr:[
      'सरपंच यांच्या अनुपस्थितीत सरपंचाच्या अधिकाराचा वापर करणे व कर्तव्ये पार पाडणे.',
      'ग्रामपंचायत सभांना उपस्थित राहून आपल्या वार्डातील/प्रभागातील समस्या मांडणे.',
      'सभेत विविध चर्चेत भाग घेणे.'
    ]
  },
  {
    key:'water',title_mr:'पाणीपुरवठा कर्मचारी',title_en:'Water Supply Employee',accent:'#2983be',icon:'💧',
    bullets_mr:[
      'नळाद्वारे नियमित शुद्ध पाण्याचा पुरवठा करणे.',
      'पाण्यात ब्लिचिंग पावडर टाकून नियमित पाण्याचे शुद्धीकरण करणे व नोंदी ठेवणे.',
      'पाणीपुरवठा स्रोत, पाईपलाईन, इत्यादींवर दैनंदिन देखरेख ठेवणे.',
      'पाण्याची जैविक व रासायनिक तपासणीसाठी नमुने देणे.',
      'पाणीपट्टी वसुलीसाठी मदत करणे.',
      'अनधिकृत नळ कनेक्शन बाबत ग्रामपंचायतीला माहिती देणे.'
    ]
  },
  {
    key:'member',title_mr:'ग्रामपंचायत सदस्य',title_en:'Gram Panchayat Member',accent:'#974db6',icon:'✿',
    bullets_mr:[
      'ग्रामपंचायत सभांना उपस्थित राहून आपल्या वार्डातील/प्रभागातील समस्या मांडणे.',
      'सभेत विविध चर्चेत भाग घेणे.'
    ]
  },
  {
    key:'employment',title_mr:'ग्रामरोजगार सहाय्यक',title_en:'Village Employment Assistant',accent:'#eb7f1e',icon:'⚒',
    bullets_mr:[
      'मागणीनुसार जॉबकार्ड नोंदणीसाठी मजुरांकडून आवश्यक अर्ज भरून घेणे.',
      'रोजगार हमी मस्टर काढण्यासाठी मजुरांची मागणी नोंदविणे, हजेरी भरणे.',
      'मग्रारोहयोच्या संदर्भातील ग्रामपंचायत पातळीवर सर्व प्रकारचे अभिलेख, नोंदवह्या तयार करणे व ते जतन करण्यासाठी ग्रामपंचायत अधिकारी यांना मदत करणे.',
      'मोजमाप घेण्यासाठी कनिष्ठ अभियंत्यांना व तसेच तांत्रिक अधिकाऱ्यांना मदत करणे, व शासनाच्या आणि पंचायत समितीच्या कर्मचाऱ्यांना रोजगार कार्यक्रम संदर्भात सहाय्य करणे.'
    ]
  },
  {
    key:'officer',title_mr:'ग्रामपंचायत अधिकारी',title_en:'Gram Panchayat Officer',accent:'#34495e',icon:'▣',
    bullets_mr:[
      'ग्रामपंचायतीचा सचिव म्हणून कामकाज करणे.',
      'मासिकसभा, ग्रामसभा इत्यादी सभांचे सचिव म्हणून कामकाज पाहणे, सभेचा इतिवृत्तांत तयार करणे.',
      'ग्रामनिधी, पाणीनिधी व विविध योजना बँक खाते आर्थिक व्यवहार सरपंचासह संयुक्त सहीने करणे व अभिलेखे हिशेब ठेवणे.',
      'ग्रामपंचायतीने संमत केलेल्या ठरावांची अंमलबजावणीसाठी आवश्यक प्रस्ताव, पत्रव्यवहार करणे.',
      'जन्म, मृत्यू, उपजत मृत्यू, विवाह नोंदणी निबंधक म्हणून कामकाज करणे.',
      'लोकसेवा हक्क अधिनियम अंतर्गत प्राप्त अर्जानुसार पात्र लाभार्थ्यांना प्रमाणपत्रे देणे.',
      'जनमाहिती अधिकारी म्हणून कामकाज करणे.',
      'जमाखर्चाचे हिशेब, वार्षिक अंदाजपत्रक, वार्षिक प्रशासन अहवाल तयार करणे.'
    ]
  },
  {
    key:'computer',title_mr:'संगणक परिचालक',title_en:'Computer Operator',accent:'#20a85a',icon:'▣',
    bullets_mr:[
      'ग्रामपंचायतीमधील व आपले सरकार सेवा केंद्राद्वारे विविध ऑनलाइन दाखले काढणे.',
      'ग्रामपंचायतीमधील विविध अभियान, शासन पोर्टल डाटाएंट्री करणे, माहिती भरणे.',
      'विविध शासकीय ऑनलाइन सेवा नागरिकांना पुरविणे.'
    ]
  }
].map(x=>Object.freeze({...x,bullets_mr:Object.freeze(x.bullets_mr),
  // Marathi source is authoritative; use the same copy if English exact legal text
  // has not been supplied (avoid inaccurate official translations).
  bullets_en:Object.freeze(x.bullets_mr)})));

import assert from 'node:assert/strict';
globalThis.location={origin:'https://test.invalid'};
const {renderShamvadiHomepage}=await import('../src/homepage.js');
const village={id:'aaa',slug:'test-village',name_en:'Test Village',name_mr:'चाचणी गाव',taluka_mr:'भोर',district_mr:'पुणे',status:'published',
 site_settings:{quote_mr:'चाचणी संदेश',welcome_title_mr:'चाचणी ग्रामपंचायत',welcome_subtitle_mr:'आपले स्वागत',footer_contact_heading_mr:'संपर्क माहिती',copyright_mr:'चाचणी कॉपीराइट',nav_mr:'home|घर\nnews|माझ्या बातम्या',links_mr:'Government|https://example.com'},
 home_sections:['gallery_notice','projects','facilities']};
const items=[
 {kind:'banners',title_mr:'Banner One',image_url:'https://example.com/banner.jpg',status:'published',sort_order:0},
 {kind:'gallery',title_mr:'Gallery Image',image_url:'https://example.com/gallery.jpg',status:'published',sort_order:0},
 {kind:'notices',title_mr:'महत्वाची सूचना',created_at:'2026-11-18T00:00:00Z',details:{event_date:'2026-11-21'},status:'published',sort_order:0},
 {kind:'projects',title_mr:'सिमेंट रस्ता',image_url:'https://example.com/road.jpg',body_mr:'रस्त्याचे काम',details:{scheme_mr:'15 वा वित्त आयोग',project_year:2026,location_mr:'चाचणी गाव'},sort_order:0},
 {kind:'metrics',title_mr:'पथदिवे',details:{value:'210'},sort_order:0}
];
const page=renderShamvadiHomepage(village,items,'mr',false);
for(const label of ['चाचणी संदेश','चाचणी ग्रामपंचायत','Gallery Image','महत्वाची सूचना','सिमेंट रस्ता','15 वा वित्त आयोग','210','पथदिवे']){
 assert(page.includes(label),`Database-driven page content missing: ${label}`);
}
assert(page.includes('Copyright © 2026')&&page.includes('V Swaraj Gramsoft and Software Private Limited'),'Fixed company legal line must be visible');
assert(!page.includes('चाचणी कॉपीराइट'),'Old village copyright must not override fixed company text');
assert(page.includes('माझ्या बातम्या'),'Admin-defined navigation label missing');
assert(page.includes('https://example.com'),'Admin-defined footer link missing');
assert(!page.includes('sv-news-cards'),'Hidden news section was rendered');
assert(!page.includes('<script>'),'Unexpected inline scripts');
const none=renderShamvadiHomepage({...village,home_sections:[]},[], 'en', false);
assert(!none.includes('sv-project-grid'),'Removing all editable sections should hide all blocks');
console.log('PASS: Homepage renders editable database data, custom nav/footer, sections and statistics.');

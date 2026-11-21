import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getDemo} from '../src/demo.js';
import {renderShamvadiHomepage} from '../src/homepage.js';
globalThis.location={origin:'https://example.test',pathname:'/demo'};
const {village, items}=getDemo();
village.site_settings={...village.site_settings,
  brand_title_mr:'ग्रामपंचायत शिरपूर', brand_subtitle_mr:'ता. भोर जि. पुणे',
  footer_social_body_mr:'येथे अधिकृत सोशल मीडिया लिहा',
  footer_pages_mr:'home|मुखपृष्ठ\nabout|ग्रामपंचायतीबद्दल',
};
const html=renderShamvadiHomepage(village,items,'mr',false);
assert(html.includes('ग्रामपंचायत शिरपूर'), 'Editable exact header title missing');
assert(html.includes('ता. भोर जि. पुणे'), 'Editable exact header subtitle missing');
assert(html.includes('येथे अधिकृत सोशल मीडिया लिहा'), 'Editable footer text missing');
assert(html.includes('loading="lazy"'), 'Below-fold images need lazy-loading');
assert(html.includes('fetchpriority="high"'), 'Hero first image needs high priority');
assert(html.includes('sv-people-area') && html.includes('sv-weather-box') && html.includes('sv-news-cards') && html.includes('sv-metric-cards'), 'Reference sections must exist');
const admin=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
for(const f of ['brand_title_mr','brand_title_en','brand_subtitle_mr','brand_subtitle_en','quote_mr','nav_mr','footer_pages_mr','footer_social_body','welcome_title_mr','statistics']) assert(admin.includes(f), `Missing editable admin field: ${f}`);
assert(admin.includes("['logo_url','nav_logo_url','footer_logo_url'].includes(input.dataset.target)"),'Primary, navbar and footer logos must keep original format on upload');
const upload=readFileSync(new URL('../src/data.js',import.meta.url),'utf8');
assert(upload.includes('quality=.84') && upload.includes('maxDimension=1920'));
assert(upload.includes("'image/webp'") && upload.includes('cacheControl'));
console.log('PASS: exact header branding, editable footer/admin fields, lazy loading, image compression and crisp logos.');

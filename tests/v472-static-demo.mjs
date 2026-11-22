import {writeFileSync,readFileSync} from 'node:fs';
import {renderAboutPage} from '../src/about.js';
import {homeFooter} from '../src/homepage.js';
globalThis.location={origin:'https://gramos.example',pathname:'/v/example/about',search:'?aboutTab=facilities'};
const v={id:'example',slug:'example',name_mr:'ग्रामपंचायत उदाहरण',name_en:'Example Gram Panchayat',address_mr:'ता. भोर, जि. पुणे',phone:'0000000000',email:'demo@example.com',site_settings:{footer_social_body_mr:'ग्रामपंचायत कार्यालयाची अधिकृत समाज माध्यमे'}};
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8').replaceAll('</style>','');
const html=`<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><style>${css}</style></head><body><main class="sv-site">${renderAboutPage(v,[],'mr')}${homeFooter(v,'mr')}</main></body></html>`;
writeFileSync('/mnt/data/gramos472_static_browser.html',html);


import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderServicesPage} from '../src/services.js';
globalThis.location={pathname:'/demo/services',search:'',origin:'http://localhost:8000'};
const {village,items}=getDemo();
for(const l of ['mr','en']){
  const html=renderServicesPage(village,items,l);
  const panel=id=>html.split(`<section id="services-panel-${id}"`)[1]?.split('</section></div></div>')[0]||'';
  const all=html.slice(html.indexOf('<section id="services-panel-all"'),html.indexOf('<section id="services-panel-available"'));
  assert(all.includes('sv-l-available')&&all.includes('sv-l-steps')&&all.includes('sv-l-forms'));
  assert(!all.includes('sv-l-links'),'No citizen links in View All');
  assert(!all.includes('sv-l-payment'),'No payment or QR in View All');
  assert(!all.includes('sv-l-qr'),'No QR code image in View All');
  assert(!all.includes('sv-l-link-card'),'No link cards in View All');
  assert.equal((html.match(/role="tab"/g)||[]).length,6);
  assert(html.includes('id="services-panel-links"')&&html.includes('id="services-panel-qr"'));
  assert(html.includes('sv-l-link-card')&&html.includes('sv-l-payment-panel'));
  const empty=renderServicesPage(village,[],l);
  assert(empty.includes('services-panel-links')&&empty.includes('services-panel-qr'));
  assert(empty.includes('sv-l-link-card'),'Reference links visible in empty village');
}
const js=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert(js.includes("'forms','links','qr'"),'Tab click handler accepts QR tab');
const admin=await readFile(new URL('../src/admin.js',import.meta.url),'utf8');
assert(admin.includes("['service_links','Official citizen service links"),'Citizen links have admin editor');
assert(admin.includes('Link card color'));
const migration=await readFile(new URL('../database/08_services_links_v26.sql',import.meta.url),'utf8');
assert(migration.includes("'service_links'"),'SQL allows service links');
console.log('PASS v4.5: Screenshot QR tab restored separately; citizen links editable');

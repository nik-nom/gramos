import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDemo} from '../src/demo.js';
import {renderServicesPage} from '../src/services.js';
import {renderProjectsPage} from '../src/projects.js';

globalThis.location={origin:'http://localhost:8000',pathname:'/demo/projects',search:''};
const {village,items}=getDemo();
for(const lang of ['mr','en']){
  const services=renderServicesPage(village,items,lang);
  assert.equal((services.match(/role="tab"/g)||[]).length,6);
  assert(services.includes('services-panel-qr'));
  assert(services.includes('services-panel-qr'));
  assert(services.includes('services-panel-forms'));
  assert(services.includes('/assets/forms/V_Swaraj_Gramsoft_Form_1.pdf'),'Bundled PDF forms must have genuine local files');
  const projects=renderProjectsPage(village,items,lang);
  assert.equal((projects.match(/role="tab"/g)||[]).length,4);
  for(const type of ['all','ongoing','completed','upcoming'])assert(projects.includes(`id="projects-panel-${type}"`));
  assert(projects.includes('sv-p-card'));
  assert(projects.includes('loading="lazy"'));
  assert(projects.includes(lang==='mr'?'कामाचे नाव':'Work name'));
  assert(!projects.includes('onerror='));
  const live=renderProjectsPage({...village,slug:'shirpur'},[],lang);
  assert(live.includes('sv-p-empty'),'Empty real villages should have honest empty states');
}
const home=await readFile(new URL('../src/public.js',import.meta.url),'utf8');
assert(!home.includes('QR कोड पहा'),'Do not accidentally render the legacy homepage QR widget');
const admin=await readFile(new URL('../src/admin.js',import.meta.url),'utf8');
assert(admin.includes('name="project_status"'),'Project status dropdown is required');
assert(admin.includes('data-document-input'),'PDF uploader is wired to admin form');
assert(admin.includes("'project_year','location_mr','location_en','project_status'"));
assert(!admin.includes('services_tax_qr_url'),'No legacy QR configuration in the admin');
const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert(main.includes("'projectSettingsForm'"),'Projects page edits must submit');
assert(main.includes('documentUpload(e.target)'),'PDF upload must have a change handler');
console.log('PASS v4.5: QR is separate; original PDF form UI; editable project status and bilingual page tabs; lazy project images.');

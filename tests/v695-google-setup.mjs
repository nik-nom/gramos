import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseGoogleVerification} from '../apps/admin/src/google-setup.mjs';
assert.equal(parseGoogleVerification('Ab_C-23'),'Ab_C-23');
assert.equal(parseGoogleVerification('<meta name="google-site-verification" content="Ab_C-23" />'),'Ab_C-23');
for(const value of ['<script>alert(1)</script>','<meta name="google-site-verification" content="x" onclick="x">','a b','a'.repeat(257)])assert.equal(parseGoogleVerification(value),'');
const code=await readFile(new URL('../apps/admin/src/admin.js',import.meta.url),'utf8');
assert(code.includes("copy(publicURL+'sitemap.xml'"));assert(code.includes('googleVerifyForm'));assert(code.includes('domain-test'));assert(code.includes('await seoEditor(working,lang,village)'));assert(!code.includes('href="/sitemap.xml"'));
console.log('PASS: verification token parser, rejecting arbitrary HTML, public sitemap link and admin action wiring');

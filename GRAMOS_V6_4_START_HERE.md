# GramOS v6.4 — Admin header visibility fix

Apply over v6.3. This update changes shared/root and apps/admin CSS and cache-versioned entry files, plus two regression tests. No database or public template changes. The existing blue admin header CSS set both links to white; v6.2 changed the header to white without restoring the link colors, and old mobile rules hid the links. The updated header restores Account security, View demo, language and Sign out in a consistent, high-contrast layout with visible focus indicators. Mobile shows all four controls in a two-column grid.

## Deployment
Run in your existing repository (not a newly created folder):

```
git pull --no-rebase --no-edit origin main
```

If that succeeds, extract the ZIP over the repo root, then:

```
node tests/v64-header.mjs
node tests/v63-page-editing.mjs
node tests/v6-simple-admin.mjs
git add styles.css index.html package.json apps/admin/styles.css apps/admin/index.html apps/admin/package.json tests/v64-header.mjs tests/visual-v64.py GRAMOS_V6_4_START_HERE.md
git commit -m "GramOS v6.4 - Fix admin header visibility"
git push origin main
```

Confirm the admin Vercel deployment uses the new commit and reload. Do not force-push. No Supabase migration needed.

## Verification
Five existing targeted test scripts passed, plus the new header regression. Offline Chromium checked all four controls and the language menu across five rendered admin screens in two languages at 1440, 820, 390 and 320px, including contrast, minimum height and viewport bounds. The password form route is present. Live sign-out, password changes, demo navigation and Supabase/Vercel integration have not been exercised; test them with your authorized account after deployment. Browser checks use rendered mock HTML rather than an authenticated live application.

To repeat the optional offline browser test with Python Playwright and Chromium installed:
```
GRAMOS_TEST_HTML=/tmp/g64-html node tests/v64-header.mjs
python tests/visual-v64.py
```

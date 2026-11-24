# GramOS v6.3 — page-by-page admin editing

Install over v6.2 in the existing repository root. This is based on the supplied v5 complete archive plus the previously supplied updates through v6.2; it is not a fresh checkout of the current GitHub repository. Back up any custom local changes before overlaying these files. No SQL migration, account changes, or public template changes are included.

## How the new editor works
1. Sign in, select a village, and open Edit website.
2. Choose the website page (Homepage, About, Services, Schemes, Projects, News, Notices, Gallery or Contact).
3. Choose a specific subsection. Homepage banner, announcements, welcome text, headings, navigation, weather, and section order each open a dedicated screen. Only the active homepage section is submitted.
4. For content lists, select Edit or Add new. About officials/staff, notices, gallery categories, schemes/beneficiaries, and projects open category-filtered lists. New entries inherit the selected category; the user can change it in the form. Committee members select a previously created committee instead of typing an identifier.
5. Record editing fields are grouped into Name & information, Item details, Photos & documents, and More options. Breadcrumbs return to the page menu. Existing draft and publish actions are retained. Publishing an item draft changes its status as in earlier versions. Built-in locked reference text remains locked. Existing pending site drafts may be published from Overview; review them before publishing.
6. Contact contains a shortcut to preview the citizen form and open received forms. Read-only reviewers can still view only assigned village submissions. No CSV export in content editors.

## Install (Terminal, existing repo root)

    git pull --no-rebase --no-edit origin main
    unzip -o ~/Downloads/GramOS_v6_3_Page_By_Page_Admin_Update.zip
    node tests/v63-page-editing.mjs
    git add .
    git commit -m "GramOS v6.3 - Page by page admin editor"
    git push origin main

Stop if the pull reports a conflict. Verify that Vercel's admin project deploys the new commit. Hard-refresh the admin page after deployment.

## Validation and limitations
- Passed the new mocked navigation/category/role/save test, v6-simple-admin, v5-admin-experience, v6-websites-auth, v49-customer-workflow, admin-smoke, v40-admin-pages, v41-fixed-branding-workspace.
- Chromium DOM test with offline rendered HTML verified that one homepage section is visible, inactive fields are excluded from FormData, and record groups and selected category render correctly. This was not an end-to-end live deployment test.
- Three older test files were updated to open the new explicit homepage-edit route, while retaining their original field and save assertions. The broad legacy suite has pre-existing stale assertions (v29, v32, v42) and two tests requiring source PDFs not supplied in this environment. No claim that the full suite is green.
- Real Supabase writes and Vercel deployment have not been verified. Test a draft village, save a banner, add a categorized notice, and view a submitted form before client handover.

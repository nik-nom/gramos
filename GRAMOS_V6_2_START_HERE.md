# GramOS 6.2 — clean admin workspace

Apply over v6.1 in the repository root. No database migration, environment change, or reset is needed. This is an admin-focused update, with the existing public template unchanged. It is based on the provided v5 full archive with the v6.1 overlay, not the current GitHub checkout.

- Dashboard lists websites directly. Choose Edit website or Forms; New website is visible for super admins. No automatically loaded website iframe or default village selection.
- Creating a website now opens its editor as a draft; the customer record is still created with the same transactional RPC. Download Excel manually from Customers instead of an automatic download after creation.
- Simpler village navigation, with received forms and PDF forms distinct, and secondary settings collapsed. On narrow screens Menu is collapsed by default.
- Homepage sections expand separately. Page-level wording/heading forms are available in collapsed panels. Optional record fields sit under More options; all original controls and save handlers remain. Marathi/English counterpart fields sit side by side on larger screens.
- Edit stays visible on records; status changes, removal, restore and CSV import remain available under More. No content editor CSV export button. Manual customer register exports are preserved. Save draft and Save & publish are visually consistent; use Overview to publish the website itself.
- Received forms retain private details and role-scoped access. No RLS, authentication or database changes. Existing locked reference material remains locked.

Install from the repository root after saving any existing edits and syncing with GitHub:

    git pull --no-rebase --no-edit origin main
    unzip -o ~/Downloads/GramOS_v6_2_Clean_Admin_Update.zip
    node tests/v6-simple-admin.mjs
    git add .
    git commit -m "GramOS v6.2 - Clean admin workspace"
    git push origin main

If Git reports a conflict, stop and resolve it before unzipping. Check Vercel deploys the pushed commit, then refresh the admin site.

Validation: Node syntax checks and six targeted test scripts passed (v40, v41, v6-websites-auth, v5-admin-experience, v6-simple-admin, v49-customer-workflow). Four older test scripts had assertions updated for intentional navigation/creation changes; other behavior checks were retained. Chromium navigation was blocked by the environment, so browser layout and live Vercel/Supabase were not verified. Test creating a draft village, editing a homepage section, saving and publishing a news item, and viewing a test citizen form as both editor and reviewer after deployment.

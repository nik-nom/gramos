# GramOS v6.1 — Simple Admin & Forms

Based on the recovered `GramOS_v5_Complete_Two_Vercel_Projects.zip` package. This is a file overlay, not a database reset. No new migration is required if the v5 database migrations and earlier form/reviewer migrations are already installed. Keep your existing configuration, Supabase project, Vercel environment variables and village data. No live deployment or live database changes were performed.

## Install the changed files

1. Open Terminal in the existing GramOS git repository. Run `git status` and save/commit any local changes before applying the update. Check `git remote -v` and ensure you are on the intended branch.
2. Download `GramOS_v6_1_Admin_Changed_Files_Only.zip` and run `unzip -o ~/Downloads/GramOS_v6_1_Admin_Changed_Files_Only.zip` **from the repository root**. The archive contains relative paths, including both `apps/admin` and `apps/public`.
3. Run `node tests/v6-simple-admin.mjs`, then `git add .`, `git commit -m "GramOS v6.1 - Remove editor CSV download"`, and `git push origin main` (if main is your deployment branch).
4. In Vercel confirm both projects deploy the new commit; root directories are `apps/admin` and `apps/public`. A push is not proof of a successful deployment. Keep the currently configured Vercel env vars. If Git integration does not deploy, redeploy the latest commit in Vercel after checking commit author permissions.

## What's new
- v6.1: removed the CSV download/export button and action from all six supported content lists and editors, in both languages. CSV import remains available, as do customer register exports and public PDF downloads.
- Visible page-specific edit shortcuts for homepage content, village officials, statistics, banners, news, notices, services, projects, and galleries. Every editable record has a direct Edit button. Separate list and edit views; optional fields are in More options, with URL slugs generated automatically for new records. Built-in service cards, application steps, PDF forms, citizen links, schemes and RTI cards appear in the record list with edit buttons. Existing village overrides are reused rather than inserting duplicate slugs. Fixed statutory/template mission/values/duty text and legal credit remain protected as in v5; additional village-specific content can be added.
- Received forms: direct dashboard/sidebar entry; All/New/Reviewed/Rejected filters, 30 forms per page, explicit View form, complete sender/date/subject/message, and authorized private photo link. Admin/editor can mark reviewed/rejected; assigned reviewer sees details and photo only, and may refresh. Queries are restricted to assigned village and existing RLS remains in effect.
- Citizen forms: public Contact shortcut and footer link; separate PDF forms link in footer; PDF viewing plus downloading. The admin preview displays the contact form with submission disabled. Demo intentionally remains non-submitting. Published public village form submits through existing `/api/submit`, with inline success/error text. Existing form limits and private attachment API remain in place.
- Neutral black/white/grey admin styling, mobile scrollable navigation, larger buttons and uncluttered fields. Public website visual template is otherwise retained.

## Verify after deployment
- In an existing published village, log in as editor: open Home, choose a section, edit a record and publish; verify the real public page. Open PDF forms, edit an existing default, and verify the file. Test in a second village to confirm independent data.
- On the *public* village hostname (not admin preview), open Contact > Citizen form and submit a test message without private information. On admin > Received forms, open it and mark reviewed. Log in as a reviewer assigned to the village, confirm the detail is readable and editing/status buttons are absent. A reviewer assigned to a different village must not see it.
- If form submission returns an error, check public project environment, existing v4.9 form rate limiter SQL and Supabase submission policies; do not disable RLS or expose service-role keys. See the existing v5 deployment guide.

## Testing
New v6 structural/mock-data test passes. Existing suite passed up to v4.6; v4.6 stops on a missing original comparison PDF outside the repo, not a new code error. All seven remaining v4.7–v5 test scripts were run separately and passed. No live Vercel/Supabase or real browser end-to-end test was performed.

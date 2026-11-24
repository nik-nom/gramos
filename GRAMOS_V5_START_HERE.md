# GramOS v5 — Simplified Admin, Publishing, History, CSV

**Release:** 24 November 2026  
**Framework:** Existing Node.js + vanilla JavaScript + Supabase + Vercel (not Next.js)  
**Source:** v4.9.1 legacy project upgraded in place  
**Deployment model:** two Vercel projects, `apps/admin` and `apps/public`; `src/` is the shared source of truth.

## 1. What's new

- One clear dashboard showing seven large bilingual shortcuts: **Notices**, **Schemes**, **Gallery**, **Documents**, **Village Info**, **Settings**, **Publish**. Switch English/मराठी from the admin header.
- Grouped village editor. The advanced page groups remain inside collapsible sections to avoid clutter.
- Both **Save draft** and **Save and show on website** on individual content records; save-draft options for ten additional page settings forms. Website drafts are previewable before they are published from Overview.
- **Recent changes:** records who changed what and when. Database triggers write immutable activity records on villages, content, submissions, staff, customer records, drafts and domain changes.
- **Remove → Restore draft:** content isn't permanently deleted. A database trigger blocks publishing a removed record. Restored records start as drafts.
- **CSV Import/Export** for Notices, Schemes, Gallery, News, Projects and Services. Download a template, upload a CSV, preview every row with errors highlighted, then confirm. A single PostgreSQL function saves all rows or rolls back all rows; imported rows are drafts. Excel-compatible UTF-8 BOM and CSV formula protection are included.
- **Super Admin:** can manage all villages, domains, users, templates, customers and payment records. **Village Admin/editor:** sees assigned villages and edits their contents, not private customer/payment information. **Reviewer:** sees only assigned complaints. Supabase RLS remains the authority.
- Existing village branding, bilingual content, Google Maps contact fields, customer Excel/CSV, staff account creation, domains, ordinary public contact forms, public previews, uploads, and site SEO remain in place.

## 2. Existing data and production database

The connected `gramos-clean` Supabase project (`nttnrfyidokwnkqrukdb`) **has already received both non-destructive v5 migrations**:

- `gramos_v5_admin_history_import_restore_security`
- `gramos_v5_admin_activity_actor_labels`

**Do not run them again on that same database.** For a completely new Supabase project built from the older setup, first apply all earlier migrations and then the included files in this order:

1. `database/gramos_v5_admin_experience.sql`
2. `database/gramos_v5_actor_labels.sql`

At last verification the database had three village records, two customer records and seven audit triggers. Existing village and customer records were preserved; no live content was deleted. The new audit history starts recording edits after the migration, and cannot reconstruct earlier changes.

**Security:** customer policies now restrict commercial customer/payment information to Super Admins. The activity log has RLS; non-authenticated users cannot import. No service-role key is placed in the frontend.

## 3. Apply the update to your existing private GitHub repo

Download **GramOS_v5_Changed_Files_Only.zip** and save it to your Mac's Downloads folder. Use a *fresh* checkout to avoid the Git divergence seen in your older local folder:

```bash
cd ~/Downloads
git clone https://github.com/Sachin-022/gramos.git gramos-v5-upload
cd gramos-v5-upload
unzip -o ~/Downloads/GramOS_v5_Changed_Files_Only.zip -d .
node scripts/sync-vercel-projects.mjs
node scripts/check-vercel-projects.mjs
npm test
git status --short
git add -A
git diff --cached --name-only
git commit -m "GramOS v5 - Simple bilingual admin, history, CSV and drafts"
git pull --rebase origin main
git push origin main
```

Use the **Complete ZIP** only if starting over with a new checkout. Do not copy both ZIPs on top of each other. Examine staged files for secrets before pushing; `.env`, credentials and service-role keys must never be committed.

### Vercel projects

- `gramos-admin`: Root Directory `apps/admin`, login at `/admin/login`
- `gramos-public`: Root Directory `apps/public`, village URL `/v/<slug>`; root `/` intentionally 404.

If Vercel shows **Blocked**, the GitHub commit-author/project-owner permission issue remains separate. The code is not deployed until Vercel reports a successful **Ready** production deployment. The ZIP files cannot alter that permission.

### Environment variables and secrets

Keep existing Supabase URL and **publishable** key in `config.js` (public data). **Never** put a Supabase service-role key, Vercel API token, or SMTP password in frontend files. Server credentials belong in the corresponding Vercel project environment variables. Normal citizen forms run without Turnstile keys; existing server-side form validation and limits remain required. Custom village domains require Vercel/DNS verification and existing domain management settings.

## 4. How staff should use it

1. Super Admin signs in, creates staff accounts and assigns each village.
2. Select a village. Use one of the seven cards or open a grouped page editor.
3. To add a notice, open **Notices**, type a title and description, attach a real PDF if relevant, then choose **Save draft** or **Save and show on website**.
4. To change ordinary page headings or Google Maps contact information, use **Save draft** to stage the edits. Go to **Overview** to preview and publish the saved draft. Or use **Save and show on website** to update the live village record.
5. If a record is removed, use **Restore items** to restore it as a draft.
6. To import a CSV, choose **Import CSV → Download template → Choose CSV → Review rows → Save drafts**. Invalid rows block the entire upload; fix the CSV and retry.
7. The **Recent changes** panel shows the editor's account label, action and timestamp.
8. For website changes to be public, the village itself must have `published` status, its content record must be published, and its URL/domain must be correctly configured.

## 5. CSV format and safety

Required column order:

```text
slug,title_mr,title_en,body_mr,body_en,image_url,external_url,sort_order
```

Rules: max 200 rows per file; max 1 MB; lowercase URL slugs; Marathi or English title required; HTTPS external/image links only; duplicate slugs rejected; blank rows ignored; missing/wrong columns and malformed quotes rejected. Every row is validated before upload, with a second server-side validation in PostgreSQL. New records are drafts. CSV exports include Excel-friendly UTF-8 BOM and CRLF endings; dangerous formula-leading cell values are escaped.

**Private beneficiary XLSX files stay separate.** Do not bulk-import Aadhaar numbers, bank details, phone numbers or other citizen-sensitive information into public content via CSV.

## 6. Tests run and limitations

- `npm test`: **49 passing individual PASS reports** on the available local source.
- `node scripts/sync-vercel-projects.mjs`: succeeded.
- `node scripts/check-vercel-projects.mjs`: passed route isolation.
- `node tests/v5-admin-experience.mjs`: passed CSV Unicode round-trip, duplicate handling, malformed rows, formula protection, role and restore contracts, draft settings, public bundle separation.
- `node tests/render-v5-admin.mjs` plus `python tests/visual-v5.py`: Chromium rendered dashboard, content, import and overview HTML at 1366px desktop and 390px phone width, no document-wide overflow. Screenshots are under `tests/screenshots-v5/`.
- Local Node.js server responds successfully to `/admin` (`200` in local HTTP probe).

**Not independently verified:** an authenticated live desktop/phone click-through, actual Gmail invitation delivery, service-role env configuration, or production GitHub/Vercel deployment. Chromium in this tool environment blocks navigation to local URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`), so the visual check used actual server-generated HTML snapshots with a mock data client, not an authenticated live session. No real citizen submissions, staff accounts or live content were created to avoid modifying customer data.

## 7. Security follow-ups

Review the Supabase Security Advisor warnings about leaked-password protection (currently disabled) and existing callable security-definer functions. The migration did not alter unrelated legacy functions. Turn on leaked-password protection and verify production permissions before allowing many village staff to use the site. On first deployment verify: Super Admin login, assigned editor login, reviewer-only login, one notice save/publish/restore cycle, village isolation, customer register access, CSV import/export, map link and public form submission.

## 8. Version and migration safety

This upgrade does not replace the existing UI with a different framework, change village slugs or domains, delete villages, alter the existing customer Excel records, or introduce new browser secrets. **GitHub and Vercel deployment were not performed from this environment.**

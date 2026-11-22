# GramOS v4.9.1 — Admin audit & secure Super Admin invitation

Date: 22 November 2026
Database: `gramos-clean` (`nttnrfyidokwnkqrukdb`)

## What was checked

- Original GramOS v4.9 repository bundle extracted and inspected.
- `npm test` passes after adding the v4.9.1 onboarding checks.
- `node scripts/check-vercel-projects.mjs` passes (public/admin route configuration is consistent).
- `scripts/invite-superadmin.mjs` tested against mocked HTTP responses for new invitation, existing verified account, unverified existing account, invalid credentials, and dry-run. No actual Auth API request was made in this audit.
- Admin staff provisioning endpoint checks a Supabase user session and a server-side platform administrator record, and uses only server-side `SUPABASE_SERVICE_ROLE_KEY`.
- Visitor forms use server validation and rate limiting, with CAPTCHA optional, according to source code.
- Corrected an admin customer-register issue: draft villages no longer offer a public website link that would return 404.
- Added a first-class **Account security** page to set a permanent password after invitation and a **Forgot password** flow via Supabase Auth; both have local tests.
- Updated outdated initial-login guidance to point to secure invitations instead of manually inserting into Auth tables.

## Confirmed database state (live query)

| Item | Status |
|---|---|
| Auth user `sachinkalkumbe041@gmail.com` | **Not yet created** |
| Existing Super Admin accounts | 1 |
| Published villages | 0 |
| Draft villages | 2 (Shirpur, Lohegaon; Lohegaon's stored slug is `url`) |
| Existing customer register records | 2 |
| Active custom domains | 0 |
| Citizen submissions | 0 |

The two village records and customer entries were **preserved**, not permanently deleted.

## Creating the new Super Admin

The connected database management integration cannot directly call Supabase Auth Admin create/invite. Never insert into `auth.users` manually. Use the provided script against the official Supabase Auth Admin API, using a service-role key only on your **own Mac**.

1. Download `GramOS_Super_Admin_Invite_v4.9.1.mjs` to `~/Downloads`.
2. In Supabase → `gramos-clean` → Settings → API Keys, obtain the **legacy service_role secret key** (not the browser publishable or anon key). Do **not** paste it into chat or commit it to GitHub.
3. In macOS Terminal (zsh), run:

```zsh
cd ~/Downloads
read -s 'SUPABASE_SERVICE_ROLE_KEY?Paste Supabase service_role key (hidden): '
echo
export SUPABASE_SERVICE_ROLE_KEY
node GramOS_Super_Admin_Invite_v4.9.1.mjs
unset SUPABASE_SERVICE_ROLE_KEY
```

4. The script invites **only** `sachinkalkumbe041@gmail.com`, grants the returned Auth user ID a Super Admin row, verifies it, and sends a signup invitation to the mailbox. After clicking the email invitation, open **Admin → Account security** (`/admin/security`) to choose a NEW password. If necessary, use **Forgot password** at `/admin/recover`. The password shared earlier in chat should not be reused.
5. If your Supabase project cannot send invites, the script stops with an error. Check Supabase Authentication → SMTP settings and your Authentication → URL Configuration (Site URL and allowed redirects), and retry after fixing email delivery.
6. Login at `https://gramos-admin.vercel.app/admin/login` once the Vercel admin project has a working deployment.

This is an invitation, **not** an automatic login. It does not require entering a password into source code, console commands, or spreadsheets.

## Site deployment caveat

Recent screenshots showed blocked production deployments under the client's Vercel Hobby project. The local test suite cannot prove that the newest code is deployed or that the live Supabase/Auth integration succeeds. Verify the production Vercel build and the following workflows before declaring the whole admin correct: email invitation confirmation, login, add village/customer, save drafts, publish/unpublish, village-specific contact/map, Excel export, private uploads, staff-role restrictions and submission moderation.

## Database advisor observations

The Supabase Security Advisor still reports:

- `authenticated_security_definer_function_executable` (WARN): audit the specific callable function and its role checks before changing grants.
- `auth_leaked_password_protection` (WARN): enable leaked-password protection in Auth settings where available.
- `rls_enabled_no_policy` (INFO): inspect the particular table; a deliberately locked-down internal table can be intended.

No claim is made that these advisories are all resolved. No destructive migration, Vercel deployment, or Auth invitation was executed by this patch.

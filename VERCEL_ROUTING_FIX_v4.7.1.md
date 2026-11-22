# GramOS v4.7.1 — public root removal + admin Vercel login hotfix

This is a patch for the **GramOS v4.7 two-project split** (Node.js/Vercel `Other`), not the older Next.js GramOS codebase. It does not alter the existing Supabase database.

## What changed

- The public Vercel project has **no `apps/public/index.html`**. Vercel's filesystem can take precedence over rewrites; the previous physical `index.html` caused `/` to show a GramOS village directory. The village HTML template now lives at `apps/public/page-template.html`, and `apps/public/api/page.js` reads that template.
- The public project routes `/`, `/index`, `/admin`, and `/demo` to a no-index 404 function. Every valid published village route `/v/<slug>` is still handled by the SSR/metadata function.
- Public footer and legacy navigation no longer contain a dead `/admin/login` link. Admin has a **separate** address.
- The admin Vercel project routes `/admin` and `/admin/:path*` to `api/admin-page.js`, a server function that serves `index.html` with `noindex, nofollow`. `/` redirects to `/admin/login`.
- The original login form, bilingual editor, Supabase connection, village data, public pages, and private admin previews are preserved.
- The sync script regenerates both deployment folders from the root source. Do not edit generated folders manually.

## Install over an existing GitHub checkout

1. Confirm your local repository is the **client's** `Sachin-022/gramos` and contains `scripts/sync-vercel-projects.mjs`, `apps/public`, and `apps/admin`.
2. **Back up the current repository / make sure the latest changes were pushed.** Then use Terminal:

```bash
cd ~/Downloads/gramos

git checkout main
git pull --ff-only origin main

unzip -o ~/Downloads/GramOS_v4.7.1_Routing_Hotfix.zip -d .
node scripts/sync-vercel-projects.mjs
node scripts/check-vercel-projects.mjs
node tests/v471-root-and-admin-routing.mjs
node tests/quick-admin-render.mjs

git add -A src/public.js src/admin.js scripts apps/public apps/admin tests/smoke.mjs tests/v471-root-and-admin-routing.mjs tests/quick-admin-render.mjs VERCEL_ROUTING_FIX_v4.7.1.md
git status --short
git commit -m "Fix GramOS public root and admin deployment routing"
git push origin main
```

If `~/Downloads/gramos` does not exist, clone it first:

```bash
cd ~/Downloads
gh repo clone Sachin-022/gramos
```

**Important:** You MUST run the sync script. Unzipping into the old repo without syncing would leave `apps/public/index.html` in place, and the old landing page could remain.

## Vercel project settings

### `gramos-public`

- Git repository: `Sachin-022/gramos`
- Root Directory: `apps/public`
- Framework Preset: `Other`
- No custom build/output command
- Required public runtime keys: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`; contact-form server secrets only when the form is enabled. Never place server secrets in GitHub or browser configuration.
- Trigger a Production deployment of the latest `main` commit (usually automatic after push).
- Expected after deployment:
  - `/` → HTTP 404, no directory or demo homepage
  - `/admin/login` → HTTP 404
  - `/v/shirpur` → published village website (when village slug is published)
  - `/sitemap.xml` → dynamic sitemap of published villages
  - `/robots.txt` → public robots file

### `gramos-admin`

- If there is no second Vercel project yet, create **Add New → Project**, import the same repository again, name `gramos-admin`.
- Root Directory: `apps/admin` (**must not be** `apps/public` or `./`).
- Framework Preset: `Other`
- No custom build/output command
- Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the same `gramos-clean` project. The server-side secret is required only for existing authorized attachment endpoints; keep it server-side.
- Trigger a Production deployment from latest `main`.
- Use the **actual domain shown under Vercel → Project → Settings → Domains**. Do not assume the project will be reachable at a particular guessed hostname.
- Expected after deployment:
  - `/` → temporary redirect to `/admin/login`
  - `/admin/login` → admin login page with email/password fields
  - `/admin` → admin login/dashboard according to sign-in state
  - `/robots.txt` → `Disallow: /`; sitewide `noindex` headers
  - `/v/<slug>?preview=1` → existing preview inside the admin application (requires authorized session)

## If admin still says 404

1. Verify `gramos-admin` actually exists and has a **Ready** Production deployment. Look at `Vercel → Project → Deployments`.
2. Verify Root Directory is exactly `apps/admin`. In GitHub, confirm `apps/admin/api/admin-page.js`, `apps/admin/vercel.json`, and `apps/admin/index.html` exist in the deployed commit.
3. Verify the latest Git commit is deployed to the admin project, not just the public project. Open the deployment logs, fix any build errors, and redeploy.
4. Open the project URL shown in **Settings → Domains**, then append `/admin/login`.
5. If the login form appears but sign-in fails, confirm the browser public Supabase config in `apps/admin/config.js`, the required auth user, and the user's authorized role in Supabase. This is different from an HTTP 404.
6. Test in a private browser window to avoid stale Safari cache / routing state.

## Limits and safety

- No Supabase migration or database reset is needed.
- The hotfix does **not** deploy itself. It does not prove your `gramos-admin` Vercel project has been created or configured. Check your Vercel dashboard.
- It does **not** add verified custom-domain-to-village mapping. A per-village domain requires a separate **verified hostname → village ID** resolver and domain registration/ownership workflow. Until that is deployed, `/v/<slug>` is the production route; simply attaching several custom domains to this one Vercel project is not enough to serve the correct village at each domain's `/`.
- The admin and public Vercel projects remain isolated deployments that point to the same Supabase database. Do not put `SUPABASE_SERVICE_ROLE_KEY`, Turnstile secrets, or other private tokens in `config.js` or Git.
- Confirm Vercel plan permissions for the client's commercial use.
- For rollback, revert this Git commit and redeploy; do not delete or reinitialize Supabase.

## Validation

- `scripts/check-vercel-projects.mjs`, `tests/v471-root-and-admin-routing.mjs`, `tests/quick-admin-render.mjs`, and the revised `tests/smoke.mjs` passed locally.
- 45/46 `.mjs` tests pass; the remaining `tests/v42-roles-drafts-global-footer.mjs` fails **also in the original v4.7 source**, on a legacy Super Admin text assertion. It is not evidence this routing patch broke admin routes, but role-workflow checks still require a live signed-in staging test.
- The live Vercel deployments could not be authenticated/inspected from this environment. Test `/admin/login` and the public 404 after deployment before notifying the client.

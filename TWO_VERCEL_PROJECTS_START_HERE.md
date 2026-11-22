# GramOS v4.7 — two separate Vercel projects (same Supabase)

This package starts with the original, unchanged GramOS v4.7 project and adds **apps/public** and **apps/admin**, each with its own Vercel configuration. The two Vercel projects are different deployments while still using the same `gramos-clean` database. No database changes or Vercel deployments have been made.

## Set up the GitHub repository

1. Back up the current client repository first. Do not overwrite a newer project version with v4.7 files.
2. If the client repository already contains v4.7, add the `apps/` and `scripts/` folders from this ZIP to its root. If the repository is empty, upload the complete ZIP contents instead.
3. From the GitHub repository folder on your Mac:

   ```bash
   node scripts/sync-vercel-projects.mjs
   git add apps scripts TWO_VERCEL_PROJECTS_START_HERE.md
   git commit -m "Separate GramOS public and admin Vercel projects"
   git push origin main
   ```

4. If you edit shared root code in the future, ALWAYS run `node scripts/sync-vercel-projects.mjs`, then commit the regenerated `apps/` folders; otherwise the deployed projects keep the old code.

## Vercel: public project

1. Vercel → Add New → Project → select the client repository `Sachin-022/gramos`.
2. Project name: `gramos-public`.
3. **Root Directory:** `apps/public` (click Edit, choose this folder).
4. Framework preset: `Other`. No build command or output directory override needed.
5. Environment Variables (Production and Preview):
   - `SUPABASE_URL` = `https://nttnrfyidokwnkqrukdb.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = the existing Supabase publishable key (public/non-secret)
   - `SUPABASE_SERVICE_ROLE_KEY` = project secret; server-only, required for `/api/submit` form storage
   - `TURNSTILE_SECRET_KEY` = Cloudflare Turnstile secret, required for contact form submissions
   - `SITE_URL` = actual public Vercel/custom domain URL (set after Vercel assigns URL)
   - `TURNSTILE_ALLOWED_HOSTNAMES` = approved hostname(s) for the visitor form
6. Set the Turnstile **site key** in the canonical root `config.js` using the public `turnstileSiteKey` field (no secret), then rerun `node scripts/sync-vercel-projects.mjs` and commit. The script regenerates `apps/public/config.js` and `apps/admin/config.js` from root. Add the public domain to the Cloudflare Turnstile widget.
7. Click Deploy. Test `/v/<published-village-slug>`, `/sitemap.xml`, `/robots.txt`, `/api/submit` with a test message. `/admin` and `/admin/login` must be 404.

## Vercel: admin project

1. Vercel → Add New → Project → import **the same GitHub repository again**.
2. Name: `gramos-admin`.
3. **Root Directory:** `apps/admin` (different from the public project's root).
4. Framework preset: `Other`; defaults for build/output.
5. Environment Variables:
   - `SUPABASE_URL` = same Supabase URL
   - `SUPABASE_PUBLISHABLE_KEY` = same publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = same server secret, required for authorized private attachment access
6. Click Deploy. `/` redirects to `/admin/login`. Login and use existing admin functionality. The `/v/...?...preview=1` routes remain available ON THE ADMIN HOST ONLY as editor previews and send `noindex` headers; this enables the existing embedded preview without changing the code.
7. Update Supabase Authentication allowed redirect URLs and Site URL for the admin domain if your authentication flows use redirects.
8. Admin host `/robots.txt` disallows all paths and `/sitemap.xml` returns 404. Add deployment protection and MFA if possible.

## Important separation/security notes

- Public Vercel project does **not** contain `src/admin.js` or the private `api/attachment.js` endpoint. Requests to `/admin` are rewritten to a 404 response.
- The admin Vercel project contains browser-side public preview code so existing embedded previews keep working. It is `noindex` across all routes, and its sitemap is 404. A `/v` preview link on the admin domain is **not** the village's public production URL.
- Both projects use the SAME village rows, RLS policies, Auth users, and Storage. DO NOT create a new Supabase database or rerun schema migrations.
- Secrets go ONLY in Vercel's Environment Variables. No `SUPABASE_SERVICE_ROLE_KEY` or `TURNSTILE_SECRET_KEY` in `config.js`, source files or GitHub.
- Separate Vercel projects are NOT separate database permissions. Supabase RLS and Auth remain the enforcement boundary.
- Use Vercel-provided URLs until you test every workflow; connect public village domain(s) and admin subdomain via Vercel → Settings → Domains after verification. This split does NOT itself implement automatic hostname-to-village routing or Vercel domain registration. Those require a separate, verified multi-domain routing feature. Existing `/v/<slug>` URLs remain the supported public route.
- Vercel plan restrictions apply; commercial client websites may need a paid commercial-use plan.
- No real signed-in / Vercel deployment tests were performed. Run a full live staging test of admin save/publish, image uploads, contact forms, Auth and SEO.

## Rollback

Remove or unlink the two new Vercel projects, keep the old project pointing at the root of the original repository, and redeploy the prior commit. Do not remove the database or change its project ID.

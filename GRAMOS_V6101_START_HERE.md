# GramOS v6.10.1 — public domain 404 repair
Apply over v6.10.0 in the repository root. Only the public routing handler and regression test are replaced/added; no database or environment files are included.

The public handler now checks verified tenant bindings before interpreting a Vercel deployment alias as shared, and does not automatically treat VERCEL_PROJECT_PRODUCTION_URL as a shared host. If you have a separate shared platform hostname, configure PUBLIC_SHARED_HOST to that actual shared hostname (not the village domain). The default gramos-public.vercel.app is still reserved. Unknown hosts, unpublished villages and cross-village routes remain blocked.

Run from repository root:

    unzip -o ~/Downloads/GramOS_v6_10_1_Domain_Fix.zip
    node tests/v6101-domain-binding.mjs
    git add apps/public/api/village-site.js tests/v6101-domain-binding.mjs GRAMOS_V6101_START_HERE.md
    git commit -m "Fix GramOS public domain binding"
    git push origin main

Redeploy the public Vercel project if auto-deploy is disabled. Verify https://ramnagar-gp.vercel.app/ and /about. Eight local mock/static suites passed; no live deployment was made. If the live site still returns 404, inspect the public project's actual Supabase URL and Vercel runtime logs.

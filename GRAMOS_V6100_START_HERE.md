# GramOS v6.10.0 — Faster Loading

Changed-files update. Base: v6.9.7 + v6.9.8 + v6.9.9, in order. Recovered those archives from the Library; live GitHub/Vercel were not accessible. Do not use this patch on an earlier base. Keep your configuration and any custom changes; if you customized inline configuration in the admin HTML, preserve it when merging. No SQL migration, no change to stored content, no new dependencies, no persistent content cache, no public design changes.

Public: scoped published content queries by page, preserving page elements and current published-village checks; seed prefetch uses server-resolved route and matches village AND page; all subsequent navigation remains fresh. Admin: task hubs skip unused draft loads and unused editor rendering, unauthorized village routes rejected before fetching, and overview activity loads concurrently with records/draft. Updated module cache versions.

Install from the existing repo root (check git status and back up local changes first):

    git status --short
    git pull --ff-only origin main
    unzip -o ~/Downloads/GramOS_v6_10_0_Faster_Loading.zip
    for f in tests/v694-domains.mjs tests/v694-domain-admin.mjs tests/v696-domain-request.mjs tests/v697-deployment.mjs tests/v698-performance.mjs tests/v699-startup.mjs tests/v6100-loading.mjs; do node "$f" || break; done
    git add --pathspec-from-file=GRAMOS_V6_10_0_CHANGED_FILES.txt
    git diff --cached --stat
    git commit -m "GramOS v6.10.0 faster loading"
    git push origin main

Both Vercel projects need to deploy the new commit. Test login, village overview, editor hub and settings, save/publish, public home, gallery, contact, about, services PDF links and a custom page element. Compare network timings and transferred data on the same device/network before and after. Tests are mocked/static, not a live browser or production benchmark. Old startup tests had stale version assertions; updated to current version. No speedup measured; network latency and deployment configuration can still affect startup.

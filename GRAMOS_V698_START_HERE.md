# GramOS v6.9.8 — Performance update (changed files only)

Base: v6.9.7 Deployment Recovery. Apply over that release, not over an older or incomplete repository. Back up custom changes first. No environment variable, database, authentication, domain-registration, public design, image asset or PDF changes.

- Initial public render reuses the published village row already obtained by the server and starts fetching the village's published content while the remaining browser modules load. No persistent village-data cache is added; subsequent navigation still reads fresh data. Server HTML template file is reused within a warm function instance; HTML responses remain no-store.
- Admin settings skip irrelevant record and draft queries. A content editor reads its own record kind; overview still reads all kinds. Private preview fetches content and drafts in parallel. Role checks remain in place.
- Main modules preload; placeholder portraits are lazy-loaded; original photos and first hero priority are retained. No claim of measured live speed improvement.

Install in the existing repo only after v6.9.7 is present:

    git status --short
    git pull --ff-only origin main
    /usr/bin/unzip -o ~/Downloads/GramOS_v6_9_8_Performance_Update.zip
    node tests/v698-performance.mjs
    node tests/v697-deployment.mjs
    node tests/v694-domains.mjs
    node tests/v694-domain-admin.mjs
    node tests/v696-domain-request.mjs
    git add --pathspec-from-file=GRAMOS_V6_9_8_CHANGED_FILES.txt
    git diff --cached --stat
    git commit -m "GramOS v6.9.8 - Faster startup and scoped reads"
    git push origin main

Check both Vercel projects successfully deploy the new commit. Test admin login, editing/saving, domain manager, published village home, about, citizen services, PDF downloads and contact. Compare load times with Safari Web Inspector > Network on the same network, cold and warm reloads. Local tests use simulated network and static checks; production latency and UI are not measured. If there is still a config.js or routing error, diagnose the deployment first (this update is not a substitute for missing v6.9.7 files).

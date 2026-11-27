# GramOS v6.10.2 — Faster startup

Changed-files patch for v6.10.1 (also includes its domain handler fix and regression test, so v6.10.0 is sufficient). No database migration or changes to existing content, photos, branding or permissions. No persistent cache for published HTML or authenticated data. Retain customized configuration in admin HTML when merging; save a backup and check the Git diff before committing.

- Public: page-specific renderers are loaded only when needed and in parallel with the content query. The initial HTML preconnects to the configured Supabase origin and preloads only the relevant extra renderer. Home needs no extra renderer. Existing published-only filters and active domain binding remain unchanged.
- Admin: the public rendering module is loaded only for previews/demo/public routes, not ordinary admin navigation. The overview asks for an exact count of non-deleted draft content rows, rather than transferring all content rows. Supabase RLS and authentication remain active.
- Versioned changed entry points to prevent stale JS. All nine automated suites passed locally, including render tests for all fourteen public page types and the domain regression. Tests use mocked services; real Vercel timings and actual admin login have not been tested. Supabase SDK count syntax checked against official documentation.

Install inside the repository root, after backing up any local edits:

    git status --short
    git pull --ff-only origin main
    unzip -o ~/Downloads/GramOS_v6_10_2_Faster_Startup.zip
    for f in tests/*.mjs; do node "$f" || break; done
    git add --pathspec-from-file=GRAMOS_V6_10_2_CHANGED_FILES.txt
    git diff --cached --stat
    git commit -m "GramOS v6.10.2 faster startup"
    git push origin main

Deploy both Vercel projects. Verify ramnagar-gp.vercel.app, several public pages, admin login, overview draft count, editing, preview, publish and unpublish in a test village. Compare browser Network and Performance data before/after on the same network. Do not apply if local version is older than v6.10.0.

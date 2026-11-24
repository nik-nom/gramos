# GramOS v6.5 — reference template and admin recovery

Cumulative changed-files update based on v5 + v6.1–v6.4 packages. No SQL, environment secrets, or existing village data are changed.

## Apply from your existing Git repository

1. `git status` (make sure the working tree is clean).
2. `git pull --no-rebase --no-edit origin main` (stop if conflicts).
3. `git branch backup-before-v65`
4. `unzip -o ~/Downloads/GramOS_v6_5_Template_Admin_Fix.zip`
5. `node tests/v65-reference-and-routing.mjs`
6. `git add . && git commit -m "GramOS v6.5 - Admin routing and reference template" && git push origin main`

## Vercel project settings

Admin: project `gramos-admin`, root `apps/admin`, framework Other, no build command, output directory `.`. The updated configuration explicitly sets these build options, and routes admin and demo paths to the static admin shell. Public: `gramos-public`, root `apps/public`, framework Other, no build/output overrides. Public `/` and `/admin` intentionally return 404; published villages are at `/v/<slug>`. Check that both projects use the correct repository and production branch (`main`), then redeploy the new commit. If admin still returns a platform 404, check deployment domain assignment and root settings; the live Vercel project is not accessible from this environment.

## Template

Open `/demo` on the admin host. Reference portraits are cropped from the supplied screenshots; their labels are a historical reference, not verified current roles. The sample village official photos are demo-only. In real villages, Homepage > Ministers & state leaders > choose an editable reference card or Add new. The reference photograph may be copied to village media only after confirming permission and verifying the role. Save as draft first; publish after checking. Village officials and banner photos use the existing per-village image upload. Nothing is automatically published or copied across villages.

The homepage shows three minister cards at a time with automatic rotation, buttons and keyboard navigation; official cards use blue role labels. The two government scheme categories link to their respective tabs. Private preview links retain preview=1 within the same village. No migration needed.

## Verification

Passed Node regression scripts: v65-reference-and-routing, v471-root-and-admin-routing, v63-page-editing, v64-header, reference-layout-v7, v6-simple-admin, v6-websites-auth, home-data. Browser navigation was blocked by the environment; no live deployment or upload test was possible.

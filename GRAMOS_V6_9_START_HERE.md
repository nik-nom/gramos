# GramOS v6.9 — shared template and full document library

Cumulative media and PDF update for the existing GramOS repository. Does not modify any API, Vercel config, credentials, or database migrations.

- 18 default Citizen Services PDFs: 16 distinct supplied files and 2 older existing forms. Original PDF bytes unchanged.
- One Download PDF action per card; all PDFs appear first in View all and on the dedicated forms tab.
- Two supplied Right to Service forms occupy the two previously empty RTI-tab slots. They are accurately labelled as service applications, not RTI orders. Real RTI uploads remain editable. GR and FAQ are in Citizen Services, not a separate RTI reference group.
- Shared default reference logo, banner, minister portraits, and village-official photographs are visible on published pages. Sample photos are labelled and must be replaced or verified by local staff. Existing custom uploads take precedence.
- Tests run on reconstructed local source with simulated storage/database, not production.

## Apply
From the existing repository, first git pull --no-rebase --no-edit origin main. Extract this archive directly into the repo root. Run node tests/v69-template-pdfs.mjs and node tests/v69-media-edit.mjs. Then git add --pathspec-from-file=GRAMOS_V6_9_CHANGED_FILES.txt, inspect git diff --cached --stat, commit and push. Check the Vercel deployments for both projects.

# GramOS v6.7 — Template placeholders and PDF library

Apply to v6.5.1 or v6.6 only after preserving the working repository. This is a changed-files update including v6.6 dependencies; no API, auth, Vercel configuration, Supabase migrations or credentials are included.

Private previews use labelled reference photos and logo where real village content is missing. Live village pages use neutral placeholders until real photos are uploaded. Existing photos override defaults. Minister carousel has two groups of three placeholder cards when no records exist.

PDFs are bundled as original unchanged files in each deployment directory. See GRAMOS_V6_7_PDF_MANIFEST.json for original filenames and SHA-256 hashes. The latest supplied V Swaraj form replaces the existing Lokseva form URL (which retains its historical filename for compatibility). The alternative 3 अर्ज नमुना.pdf is intentionally not a second public Lokseva application.

Notice Board > RTI contains two supplied reference documents in a separate section labelled not RTI orders; actual RTI bench order and sections 1–13 slots still require the matching files. Monthly report is a blank template under financial reports. Citizen services includes seven declarations, MGNREGA legacy registration, checklist, and Andarsul sample building application with local verification notes. Confirm source permission and current applicability before production publication.

Install from repository root (check clean status first). Extract over existing files without deleting other folders. Run `node tests/v67-template-documents.mjs`. Review `git status --short` before staging and commit only intended files. Live browser/deployment and database connectivity have not been verified.

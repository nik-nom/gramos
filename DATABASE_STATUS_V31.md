# GramOS v3.1 — Supabase database status (2026-11-21)

The existing connected Supabase project was inspected. On November 21, 2026:

- `villages.site_settings` is JSONB and supports editable Contact page settings without a schema change.
- `content_items.details` is JSONB and supports article `related_links_mr/en` and `source_title_mr/en` without a schema change.
- `content_items_display_idx` already indexes village, type, status, order and creation date. No duplicate index was added.
- `submissions_inbox_idx` already exists. No duplicate index was added.
- `public.submissions.subject` was added using an additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statement and verified to exist as `text`.
- `public.submissions` Row Level Security remains enabled; no policy permitting anonymous public reads exists.
- The `submissions` table had zero entries at verification time; no messages were changed or deleted.
- The database change has been performed. **Deployment of the v3.1 website files is a separate step.**

The migration is saved at `database/09_contact_subject_v31.sql` for other installations, and is safe to rerun because the column is added conditionally. Do not paste `database/01_setup.sql` into an existing project.

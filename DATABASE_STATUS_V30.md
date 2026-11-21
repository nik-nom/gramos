# GramOS v3.0 — Supabase database status

Verified against the connected existing GramOS Supabase project on November 21, 2026 (read-only verification).

- `public.content_items` has the existing `kind` (`text`), `details` (`jsonb`), title/body bilingual fields (`text`), photo URL (`text`), external URL (`text`), status, village UUID and display order.
- `public.villages.site_settings` is `jsonb` and can save the new page text, tab captions, and section headings.
- Row Level Security remains enabled for `content_items`.
- The connected production database currently has **0** rows with `kind='news'`, **0** with `kind='gallery'`, and **0** with `kind='videos'`.
- Thus real village News and Gallery pages will show empty states until the authorized admin publishes real content.

**No migration or direct production data modification was needed for v3.0.** All new category metadata is stored in existing `content_items.details.gallery_type`. The code performs writes only through the existing admin CRUD paths, subject to existing RLS. The demo contains sample records separately from the database.

# v3.3 database status — no migration necessary

Automatic SEO URLs are derived at request time from:

- `public.villages`: `id`, `slug`, `name_mr`, `status`, `site_settings` JSONB and `updated_at`.
- `public.content_items`: `village_id`, `kind='news'`, `slug`, `status`, article title/body and `updated_at`.

Public reads rely on existing row-level security. Only published villages and published articles may be included. The admin SEO editor writes each village's existing `site_settings.seo.<page>` values through the existing authenticated browser client and RLS policies. No extra database table, manual sitemap upload, new Supabase project, trigger or paid service is needed.

Checked live `gramos-clean` project on 2026-11-21: `villages.site_settings` is JSONB; the relevant columns exist; `anon` can select the published `shirpur` village; there is one platform admin and no published news. No database writes were made as part of this update.

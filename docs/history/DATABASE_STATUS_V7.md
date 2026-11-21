# Supabase status, 21 November 2026

This existing GramOS Node.js project connects to the existing Supabase `gramos-clean` project (Mumbai).

Current database, verified through the connected Supabase tool:
- `auth.users`: 1 user; `platform_admins`: 1 administrator.
- `villages`: 1 published village (`shirpur`). The database has no content_items for it yet.
- The app uses the same `villages`, `content_items`, `village_members`, `platform_admins`, and `submissions` tables; Storage holds images.
- `villages.site_settings` (JSONB) stores editable bilingual header, welcome copy, section headings, weather placeholder/link, footer text, nav labels and external links.
- Each content item has a kind (banner, gallery, notices, leaders, officials, schemes, services, video, news, projects, metrics), bilingual title/subtitle/body, image, order and status; optional details JSONB for dates, schemes, location and metric values.
- An additional valid homepage layout key `officials_contact` was added to the DB. In this V7 renderer the officials/contact panel is rendered as part of the `leaders_schemes` block, so there is no need to add it separately in the admin. Saving a village's section order will normalize it to the six supported combined layout blocks.

**Do not run any SQL setup again.** No village data was overwritten or copied from the Shamvadi reference website. Add actual content via the admin.

Open `/admin`, select `shirpur`, manage Village Settings and each content collection, publish each item and refresh `/v/shirpur`.

Security note: Supabase Authentication reported a leaked-password-protection advisory; enable it at https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection before a production launch.

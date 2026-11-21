# GramOS V7 — Shamvadi layout, editable and compressed images

**Use the existing gramos-clean Supabase project. Do not run the old 01_setup SQL again.**

## Changes
- Matches screenshots: white single-line nav with village logo, royal-blue ticker, full-width photographic slideshow, centered welcome, gallery and navy notices, leadership and staff cards, side schemes/contact/weather, services/video, red-headlined news, development projects, infrastructure metrics, four-column navy footer.
- Editable in Admin → Village Settings: brand/logo, menu wording, banner strip, welcome, section headings, footer text and links, contact details, weather URL and placeholder.
- Editable in Admin → village collections: Banner slides, Photo Gallery, Leaders, Officials, Schemes, Services, Videos, News, Notices, Projects, Village Statistics.
- QR images remain PNG/JPG. Other photos are compressed to WebP in the browser before uploading (max dimension 1920 px, quality 84%) when smaller. The source is kept if WebP would increase file size. Uploads cache for one year with unique paths.
- Photos below the fold load lazily; first hero photo is eager/high-priority, async decoding for the rest.
- Fixed malformed Create Village button markup found in V6.
- No new Supabase tables required; all added settings live in villages.site_settings JSONB with existing RLS, and items in content_items.

## Run on your Mac
1. Download ZIP; extract directly into the current project folder (see README).
2. In the project root, run `npm run dev`.
3. Visit http://localhost:8000/demo and http://localhost:8000/admin/login.
4. Login with your existing Supabase Auth email/password. Admin permission is already assigned by the connected Supabase database.
5. Open Admin → Create Village; publish real content from that village's sections.
6. To deploy, upload these files into the same GitHub repo and allow existing Vercel project to redeploy.

## Limitations
- Sample data on `/demo` are demonstration content; real websites get no copied officials, photos, contact details or news.
- Do not copy copyrighted photos from the original website into a client village without permission.
- This design is matched to the supplied screenshots, but browser/font rendering and unavailable originals can differ; confirm in Safari before switching a real domain.

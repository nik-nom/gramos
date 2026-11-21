# GramOS — Shamvadi Blue Theme (v2)

Reference: https://shamvadi.gpweb.in/  (public blue theme)

**Design approach:** New original HTML/CSS/JS reconstruction of the reference site's section sequence and blue government-website visual language. No code, photos, logos or trademarks were copied from the referenced provider. A pixel-perfect replica cannot be certified without reference screenshots/layout specifications.

## Already completed in your connected Supabase account

- Project: `gramos-clean` — `nttnrfyidokwnkqrukdb` (Mumbai region)
- Original clean SQL schema: five RLS-protected tables and two storage buckets
- New `shamvadi_blue_content_fields` migration applied
- Added `villages.site_settings` JSONB and `content_items.details` JSONB
- Default homepage sections: gallery, services, news + side widgets, projects
- Security advisor check: no findings
- No rows, authentication users, or old projects were deleted

**Do not rerun `database/01_setup.sql` or `02_shamvadi_blue_fields.sql` against `gramos-clean`: those migrations have already been applied there.** The SQL files are for version control or *new empty projects*. Running them twice may fail.

## Pages / routes

- `/` — shows the blue themed demo until the first village is published; with one published village, shows that village's actual homepage; with multiple sites, a directory
- `/demo` — explicit blue-theme sample
- `/demo/about`, `/demo/services`, `/demo/news`, `/demo/notices`, `/demo/schemes`, `/demo/projects`, `/demo/gallery`, `/demo/staff`, `/demo/contact`
- `/v/YOUR-VILLAGE` — village site with all the above pages
- `/admin/login` and `/admin` — separate protected admin

## Home page matches the reference's content hierarchy

1. Blue government branding, village logo/header and page nav
2. Quote strip + wide village banner + introductory text
3. Photo gallery
4. Citizen services / certificates (with optional QR payment image)
5. News on left, notice board / schemes / contact information on right
6. Development works and project metadata
7. Footer: social links, government links, pages and contact + office hours

The admin sidebar uses these same section names. Page contents support Marathi and English.

## Admin data entry mapping

| Admin area | Database | Public output |
|---|---|---|
| Village settings | `villages` | name, taluka, district, about, phone, email, header banner/logo, status |
| Quote / hours / social links / extra links | `villages.site_settings` | quote strip, footer |
| Gallery | `content_items` kind=`gallery` | Gallery section + gallery page |
| Citizen services | kind=`services`; details `qr_image_url` | Citizen service cards/QR |
| News | kind=`news`; details `event_date`, `author_mr/en` | News cards and detail page |
| Notices | kind=`notices`; details `event_date` | Notice board + notice list |
| Schemes | kind=`schemes` | Government scheme sidebar + page |
| Development works | kind=`projects`; details `scheme_mr/en`, `project_year`, `location_mr/en` | Project cards + page |
| Officials | kind=`officials` | Office bearers page |
| Custom pages | kind=`pages` | Individual pages |
| Citizen messages | `submissions` | Admin-only moderation/inbox (Turnstile required) |

Content items can be `draft` or `published`. The village itself must also be `published` to be publicly visible.

## Run locally on macOS

Unzip **GramOS_Shamvadi_Blue_V2.zip** into a new folder, then:

```bash
cd ~/Downloads/gramos-shamvadi-blue-v2
python3 dev_server.py
```

Then visit http://localhost:8000/demo and http://localhost:8000/admin/login.

Your **public** Supabase project URL and publishable key are preconfigured in `config.js`. Do **not** add your service_role key or your admin password to the repository.

## Deploy/update GitHub + Vercel

1. In GitHub, create a private repo `gramos-shamvadi-blue` or update your existing connected `gramos-clean` repo.
2. Commit **all root files and folders of this package** (including `index.html`, `styles.css`, `src/`, `assets/`, `api/`, `database/`, `vercel.json`). Do not upload only `index.html`.
3. In Vercel, Import Project → choose repo → Framework preset **Other** → Project Root `./` → leave build command blank → Deploy.
4. Check `/demo`, `/admin/login`, and `/v/YOUR-VILLAGE` and the mobile navigation.
5. Set up an admin identity in Supabase Auth; grant a platform admin role using the snippet in `START_HERE.md`. Existing anonymous visitors cannot edit.
6. Optionally add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `TURNSTILE_SECRET_KEY` as **server-only Vercel environment variables** for citizen submissions. Follow the package `START_HERE.md` for exact names.
7. Keep your old custom domain untouched until the new deployment is verified.

## Limitations

- Demo imagery uses placeholder/stock landscapes. Upload actual village photos through admin for production.
- The public template follows the reference's order and aesthetic but is not an authenticated reproduction of the proprietary reference site's admin software. We cannot access its private admin interface.
- The admin login is backed by Supabase Auth and requires a user/role to be configured before you can edit.
- The public `/demo` does not write to your database.
- Offline browsers without a Supabase CDN connection still show demo content; admin features require the SDK and Supabase access.

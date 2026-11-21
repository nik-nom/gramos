# Shamvadi screenshot → editable GramOS data mapping

**All visible village-specific content on the live homepage is sourced from the Supabase database and edited through the GramOS admin.** Static UI chrome, generic labels and blank-state messages are defined in source code as defaults, with editable overrides for major headings.

| Screenshot location | Admin location | Supabase field(s) |
| --- | --- | --- |
| White header: logo and village name | Village settings | `villages.logo_url`, `name_mr/en`, `taluka_mr/en`, `district_mr/en` |
| Navbar labels, order and visibility | Village settings → Header / Navigation | `villages.site_settings.nav_mr/en` (`page-key|label` per line) |
| Thin blue ticker | Village settings | `site_settings.quote_mr/en` |
| Full-bleed photo slideshow | Sidebar → Homepage Sliders | `content_items.kind='banners'`, `image_url`, `sort_order`, `status` |
| Blue welcome title, subtitle, CTA | Village settings → Welcome / Hero | `site_settings.welcome_title_*`, `welcome_subtitle_*`, `welcome_button_*` |
| Large gallery slider | Sidebar → Photo Gallery | `content_items.kind='gallery'` |
| Navy notice panel | Sidebar → Notice Board | `content_items.kind='notices'`, title/date/status |
| Honourable leaders | Sidebar → State Leadership | `content_items.kind='leaders'` |
| Government schemes | Sidebar → Schemes | `content_items.kind='schemes'` |
| Citizen service cards | Sidebar → Services | `content_items.kind='services'`, `details.icon`, optional QR |
| Video gallery | Sidebar → Video Gallery | `content_items.kind='videos'`, `image_url` and `external_url` |
| News cards | Sidebar → News | `content_items.kind='news'`, `details.event_date`, `details.author_mr/en` |
| Four development-work cards | Sidebar → Development Works | `content_items.kind='projects'`, `details.scheme_mr/en`, `project_year`, `location_mr/en` |
| Village infrastructure numbers | Sidebar → Village Statistics | `content_items.kind='metrics'`, `details.value` |
| Four footer columns, socials | Village settings → Footer and Copyright | `site_settings.footer_*`, `links_mr/en`, `footer_pages_mr/en`, social URLs; village phone, email, address, office hours |
| Section show/hide/order | Village settings → Homepage Sections | `villages.home_sections` |

## Admin content workflow

1. Create your village as **draft**.
2. In **Village settings**, set logo, names, welcome copy, nav text, section headings, contact and footer.
3. For each sidebar collection, **Add new item** with Marathi and English translations, image/extra fields and optional order number.
4. Keep new content as **draft** while editing. Change its status to **published** when checked.
5. Return to Village settings, arrange homepage sections, and click **Publish website**.
6. Check public `/v/{slug}` and private `/v/{slug}?preview=1` (logged-in editor only).

**Navigation keys:** home, about, services, projects, schemes, notices, news, gallery, contact, staff, leaders, facilities, pages. Each line uses `home|मुखपृष्ठ`. Only listed keys display. Invalid/unknown keys are ignored.

**Footer external links:** each line uses `Title|https://official-website.example`, one per row; HTTPS-only validation. The same content is editable in Marathi and English.

**Add/edit pictures:** in the collection form choose a JPEG, PNG or WebP file. Uploaded files go into `village-media/<village-id>/<uuid>`, RLS limits upload to authorized editors. Save the form after upload.

## Node.js and Vercel

Node.js local server runs on `PORT=8000` by default and provides `/api/health`. Vercel handles Node.js `api` functions and static SPA rewrites for `/demo`, `/admin`, and `/v/{slug}`. Browser-side scripts handle routing and editor interactions.

**Do not paste your Supabase secret/service-role key into client config or GitHub.** Set secrets under Vercel project environment variables only when enabling visitor submissions.

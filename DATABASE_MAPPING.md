# Database ⇄ Admin ⇄ Shamvadi homepage (V8)

All website content is scoped to a village UUID in Supabase and managed with existing RLS policies. The connected `gramos-clean` project already has these tables and fields, so **this release does not require a new migration**.

| Screenshot / public area | Admin control | Supabase data |
|---|---|---|
| Logo, Marathi/English header title and subtitle | Village Settings → Village information / Header | `villages.logo_url`, `villages.name_mr/en`, `villages.site_settings.brand_title_mr/en`, `brand_subtitle_mr/en` |
| Navigation titles and item order | Village Settings → Header / Navigation | `villages.site_settings.nav_mr/en` (line-oriented page-key + label) |
| Royal blue announcement strip | Village Settings → Quote | `villages.site_settings.quote_mr/en` |
| Hero slide photos and dots | Sidebar → Homepage sliders | `content_items.kind='banners'`, `image_url`, `sort_order`, `status` |
| Blue welcome title, subtitle, button | Village Settings → Welcome | `villages.site_settings.welcome_*_mr/en` |
| Gallery carousel | Sidebar → Photo Gallery | `content_items.kind='gallery'` |
| Notice board | Sidebar → Notice board | `content_items.kind='notices'`, `details.event_date` |
| Three minister/leadership cards | Sidebar → State leadership | `content_items.kind='leaders'` |
| Three officeholder cards | Sidebar → Officials | `content_items.kind='officials'` |
| Government schemes | Sidebar → Schemes | `content_items.kind='schemes'` |
| Contact details and weather link | Village Settings → Phone/address/location / Weather | `villages` columns, `site_settings.weather_*` |
| Citizen services / video | Sidebar → Services, Video Gallery | `content_items.kind='services'` / `videos` |
| News articles / dates / author / image | Sidebar → News | `content_items.kind='news'`, `details.event_date`, `details.author_mr/en` |
| Four project cards | Sidebar → Development works | `content_items.kind='projects'`, `details.project_year`, `scheme_mr/en`, `location_mr/en` |
| Village metric cards | Sidebar → Village Statistics | `content_items.kind='metrics'`, `details.value` |
| Navy four-column footer, pages, useful links | Village Settings → Footer / Links / Contact | `villages.site_settings.footer_*`, `links_mr/en`, `footer_pages_mr/en` and village contact fields |
| About page | Village Settings → About + Sidebar → Additional sections | `villages.site_settings.about_*` and `content_items.kind='about_sections'` |

`villages.status`: draft/published/archived; each `content_items.status`: draft/published. Public pages show published data only, while authorized previews can display drafts. Images go in Supabase Storage `village-media/{village_uuid}/<unique filename>`.

## Current database inspection (2026-11-21)

- Connected project: `gramos-clean` (Mumbai region)
- Platform admins: 1
- Villages: 1 (`shirpur`, published)
- Content rows: 0
- `village-media` public image bucket: present

Use the admin to add the actual village data. This ZIP deliberately does not overwrite, import or invent real village names/officeholders/photographs.

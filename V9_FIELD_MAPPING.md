# V9 database-to-admin-to-website mapping

Everything is village-scoped using `village_id`. The existing `platform_admins` and `village_members` access controls are untouched.

| Supabase source | Admin control | Public About page |
|---|---|---|
| `villages.name_mr/en`, `taluka_*`, `district_*` | Village Settings | Basic information box |
| `villages.site_settings.about_page_title_*`, `about_intro_*` | About Page — 6 Tabs | Page title / introduction |
| `villages.site_settings.about_tab_*` | About Page — 6 Tabs | Editable six tab labels |
| `villages.site_settings.about_mission_*`, `about_vision_*` | About Page — 6 Tabs | Mission and core value bullet cards |
| `content_items.kind='about_facts'` with `details.group='basic'` or `'population'`, `details.value` | About — Village Facts | Left/right facts column |
| `content_items.kind='officials'`, `details.about_group='representatives'` | Officials | Office bearers card grid |
| `content_items.kind='officials'`, `details.about_group='staff'` | Officials | Staff card grid |
| `content_items.kind='committees'`, `details.committee_key`, `committee_title_*`, `committee_role_*` | About — Committees | Grouped data tables; one record per member row |
| `content_items.kind='facilities'`, `details.value` | Facilities | Village facilities/count cards |
| `content_items.kind='duties'`, `body_*`, `details.accent`, `details.icon` | About — Roles and Duties | Colored responsibilities grid |
| `content_items.kind='about_sections'` | About — Additional Sections | Optional extra blocks under All Information |

All editable records require Marathi or English title, accept independent display order, have draft/published status, and support village-specific data without duplicating the template code. Only published records are visible to public visitors.

**Migration:** `database/05_about_reference_tabs.sql` was applied to the linked `gramos-clean` project. RLS is still enabled on `content_items`. No new tables were required; the existing JSONB metadata field stores the tab-specific attributes.

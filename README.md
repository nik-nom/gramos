# GramOS v4.7 — navbar and footer update

See **V4.7_START_HERE.md** for installation and changes. This preserves all v4.6 public pages and PDFs.

---

**Current release: GramOS v4.5 — screenshot-matched Lokseva page with 3 original V Swaraj PDF forms, six tabs, village-specific overrides and per-village tax QR.** See [V4.5_START_HERE.md](V4.5_START_HERE.md). No database migration.

**GramOS v4.4 update:** The supplied Shamvadi About-page mission, values and eight responsibilities are now built into the public template and appear in every new village preview. They cannot be changed from Admin; admins can add optional points and extra cards. Existing village data is untouched. See `V4.4_START_HERE.md`.

> **Current upgrade: GramOS v4.3** — see [V4.3_START_HERE.md](./V4.3_START_HERE.md). The older v4.2 global branding page is retired; branding is per village and the global table is retained only for rollback

## **Current release: GramOS v4.1**

See [V4.1_START_HERE.md](V4.1_START_HERE.md). Updated logo strip, hard-coded 2026 Swaraj Gram Soft imprint, Marathi social headings, simpler admin overview, shared per-village ticker and Home/Footer save dispatch. No Supabase migration required. Earlier guides below are historical.

## **Historical release: GramOS v4.0**

Start with [V4.0_START_HERE.md](V4.0_START_HERE.md). The page-specific admin, 12 bottom logos, shared per-village announcement and responsive layout updates build on v3.9. The v3.8/v3.9 instructions below are historical and may describe older settings navigation.

# **Historical release: GramOS v3.8**

Start with [V3.8_START_HERE.md](V3.8_START_HERE.md). This complete archive includes all previous releases and can be installed in a fresh folder. Do not overlay old v2.9/v3.0 files over v3.8. The page-bottom logo now appears between content and footer; the footer copyright is removed. Earlier notes below are **historical** and may describe old behavior.

# **Historical release: GramOS v3.6**

Read [V3.6_START_HERE.md](V3.6_START_HERE.md) for installing the update, editing the Yojana beneficiary subpage, uploading the footer logo, and deploying to your existing Vercel project. Older version information below is historical.

> **Historical release: v3.1.** For this update, read [V3.1_START_HERE.md](V3.1_START_HERE.md) and [DATABASE_STATUS_V31.md](DATABASE_STATUS_V31.md).

> **Historical release: GramOS v3.0**. See [V3.0_START_HERE.md](V3.0_START_HERE.md) for the editable Shamvadi-style News page, full articles and seven-category Photo/Video Gallery. Existing Notice Board, Government Schemes, Lokseva, About, footer and scrolling strip remain available.

# GramOS v2.7 — Shamvadi Blue / Node.js

This is the **same GramOS project and Supabase database**, not a new repository.

## Public pages
- Homepage — blue Shamvadi style, Marathi/English and the moving blue announcement strip.
- About — six editable tabs; the real village and demo share the same layout.
- Lokseva — available services, application steps, downloadable PDF forms and official citizen links. The QR/payment tab is **removed**. Downloadable PDFs must be uploaded and published from Admin.
- Development Projects — four tabs (All, Ongoing, Completed, Upcoming), image cards, status, scheme, year, location and details edited per village in Admin.
- Other site pages and the existing footer remain on the shared template.

## Start locally on your Mac

```sh
npm test
npm run dev
```

Local URLs:
- `http://localhost:8000/demo/services`
- `http://localhost:8000/demo/projects`
- `http://localhost:8000/v/shirpur/services`
- `http://localhost:8000/v/shirpur/projects`
- `http://localhost:8000/admin/login`

## Admin data model
Each village's `villages.site_settings` stores bilingual page and tab labels. Each project is a `content_items` record (`kind='projects'`) with status in `details.project_status`; each public PDF form is a `content_items` record (`kind='service_forms'`) with the public PDF URL in `external_url`. The existing `service-documents` Supabase Storage bucket accepts public PDF forms uploaded by authenticated village editors. Draft items do not show to visitors.

No new migration is needed for v2.7 on the existing `gramos-clean` Supabase project. Existing records and QR data are **not deleted**; QR UI is hidden/removed.

See `V2.7_START_HERE.md` for installation and editing instructions. Older version notes are historical and may describe features removed in v2.7.

## v4.6 screenshot-based schemes and RTI reference

For five default Government Schemes, village-specific override/draft behaviour, and the two RTI reference titles with missing-PDF safeguards, see **V4.6_START_HERE.md**. This is an additive **Node.js** upgrade of v4.5; no database migration is needed.

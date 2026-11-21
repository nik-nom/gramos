# GramOS V9 — same Node.js project, Shamvadi About tabs + compact citizen services

**No new GitHub repository, Supabase project or Vercel project.** This is a full replacement of the source files in your current GramOS Node.js working folder.

## Step 1: Update files on Mac
1. Stop the previous local server with **Ctrl+C**.
2. Download `GramOS_Shamvadi_V9_About_Tabs_Compact_Services_Node.zip` to `~/Downloads`.
3. Run:

```bash
cd ~/Downloads
unzip -o GramOS_Shamvadi_V9_About_Tabs_Compact_Services_Node.zip -d gramos-shamvadi-v2
cd gramos-shamvadi-v2
npm run dev
```

4. Open:
   - Existing Shamvadi demo homepage: http://localhost:8000/demo
   - Six-tab About demo: http://localhost:8000/demo/about
   - Your own village: http://localhost:8000/v/shirpur
   - Real village About page: http://localhost:8000/v/shirpur/about
   - Admin login: http://localhost:8000/admin/login

If Safari caches the previous code, use **Cmd+Shift+R**.

## Step 2: Edit your actual village
1. Sign in to the existing GramOS admin with your **own previously created Supabase password**.
2. Open the `shirpur` village (or another site, from the same shared template).
3. Click **About Page — 6 Tabs** in the sidebar. Edit page title, intro, six tab labels, mission and core values; save those settings.
4. From that About editor, open the relevant content collection:

| About tab | Admin section | What to enter |
|---|---|---|
| All Information | About — Village Facts | One fact per entry, choose Basic/Population column, enter label and value. The existing village name/taluka/district come from Village Settings. |
| Office Bearers | Officials | One person per record; choose Office bearers, upload portrait, add designation, ward, phone and optional election date. |
| Staff | Officials | One person per record; choose Staff, upload portrait and details. |
| Committees | About — Committees | **One person per row**; use the same `committee_key` and committee heading for the people in a table. |
| Facilities | Facilities | One card per item: label and `value` (count, yes/no, etc.). |
| Roles & Duties | About — Roles and Duties | One colored card per record; title, one responsibility per line, icon and color. |

Mark each content item **Published** to make it appear on the public village website. Unpublished items appear only in private previews.

## Step 3: SQL
The `gramos-clean` Supabase project has **already received** the additive V9 migration. The file `database/05_about_reference_tabs.sql` is included for source control and future installations.

**Do not run `database/01_setup.sql` again.** That initial script was for a completely empty database.

The migration extends the existing `content_items.kind` check to allow `about_facts`, `committees`, and `duties`. It does not create another platform, delete content, or change your administrator account. Existing RLS policies remain in place.

## Step 4: Website design and image handling
- Homepage stays in the blue Shamvadi style; white navbar and navy footer are not replaced.
- Citizen-service cards are smaller; the video-gallery panel aligns to their two-row block on desktop and stacks below on mobile.
- About page follows the reference's centered title, six khaki/blue tabs, 2-column information area, mission/value boxes, 3-column profiles, committee tables, facility tiles, and colored responsibility cards.
- Images loaded below the viewport use `loading="lazy"`.
- Photo uploads keep the existing WebP optimization at **84% quality / max 1920px** when it saves bytes. Logos/QR codes retain lossless clarity when selected for preservation.
- The demo shows **sample information**; real village facts and people must be entered by authorized editors.

## Step 5: GitHub and Vercel
Replace the **contents** of your current repository's root with the files from this ZIP. Keep `index.html`, `package.json`, `server.mjs`, `config.js`, `vercel.json`, `src/`, `assets/`, `database/`, and `api/` at the repository root. Deploy through your existing Vercel project; do not change domain before verifying.

## Tests and limitation
Run `npm test` to check route rendering and Supabase save payloads. Static browser rendering was checked against the supplied reference screenshots. The final live Safari rendering and production editing must still be checked after installation.

### Security note
The current Supabase Security Advisor warns that leaked-password protection is off. Enable it in Supabase Auth security settings before production where supported.

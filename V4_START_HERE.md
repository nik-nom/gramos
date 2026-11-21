# GramOS Shamvadi Homepage V4 — replace your current files

This is an update to the SAME Node.js GramOS codebase. Do not create another Supabase project, repo or Vercel project.

## Mac commands

1. Stop the previous Node server in Terminal with `Control+C`.
2. Download `GramOS_Shamvadi_Homepage_V4_Editable_Node.zip` to `~/Downloads`.
3. In Terminal, run:

```bash
cd ~/Downloads
mkdir -p gramos-shamvadi-v2
unzip -o GramOS_Shamvadi_Homepage_V4_Editable_Node.zip -d gramos-shamvadi-v2
cd gramos-shamvadi-v2
npm run dev
```

4. In Safari, open `http://localhost:8000/demo` and perform a hard refresh (`Command+Shift+R`).
5. Admin login: `http://localhost:8000/admin/login`.
6. If the old green layout still appears, inspect which server runs on port 8000: `lsof -nP -iTCP:8000 -sTCP:LISTEN`. Stop the OLD terminal server and then rerun `npm run dev` from this folder.
7. The package version in `package.json` must be `4.0.0`. Verify with `cat package.json`.

## What changed

- White single-row header, village name and icon, royal blue ticker, image hero slider, bright blue welcome panel.
- Gallery beside navy notice board, leaders and schemes, services and videos, red-titled news, projects, two metrics, navy footer.
- Built-in screenshot-derived demo pictures for the `/demo` page only. They are reference/sample pictures and MUST NOT be treated as verified photos for a real village website.
- Admin controls every textual area from Village Settings, including header/menu, ticker, welcome, section titles and footer.
- Banner slides, gallery, notices, services, videos, news, projects, scheme listings, office holders, statistics and custom pages are in the corresponding editable sidebar collections.
- Save operations check whether the database actually returned an updated record; failed permission checks won't show a fake 'saved' success.
- Sliders can be changed with prev/next, dots and automatic rotation.

## Supabase / SQL

- The same connected `gramos-clean` project is used.
- `database/01_setup.sql`, `database/02_shamvadi_blue_fields.sql`, and `database/03_shamvadi_homepage_node.sql` were already applied in earlier setup. **DO NOT RUN THEM AGAIN** on that database.
- All real village text/photos on `/v/{slug}` are read from `villages`, `villages.site_settings`, and `content_items` through Supabase.
- A new project has no published village and no admin user yet. To use the admin, create your email/password user in Supabase Authentication and grant that user a role as explained in `START_HERE.md`. Do not share your password.
- Banner/gallery photos must be uploaded from the admin to the village-media Storage bucket. Keep items published for them to appear on the public website.

## Existing GitHub/Vercel project

Replace the files in the **same existing GitHub repository** with the contents of this ZIP at the repository root; Vercel can then redeploy the existing project. Do not create a new Vercel app, and do not point your production domain at the demo until the real village content and login are validated.

## Verification

- `npm test` runs offline render, multilingual routes, admin input mappings, and Supabase save-payload contract tests.
- `npm run dev` launches the Node.js server at port 8000 without npm packages.
- A full Safari visual comparison could not be performed automatically in the execution environment. Inspect locally before deploying.

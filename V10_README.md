# GramOS V10 — Shamvadi About page

Updates the **existing V9 Node.js project**. Do not create another repository or Supabase project.

## Source & fidelity
Based on the screenshots supplied in this chat. The public source About route `https://shamvadi.gpweb.in/about.php` returned HTTP 406 to automated browsing, so do not claim source-code equivalence or pixel-perfect identity. We reproduced the visible layout and preserved the blue Shamvadi navbar/ticker/footer.

## What changed
- **All Information now includes the complete sequential page**: village details, vision and values, office bearers, staff, committees, facilities, and duties, just like the supplied Shamvadi screenshots. Separate tabs show these sections individually. 
- Six familiar About tabs are preserved and remain editable in site settings.
- Village facts have separate Marathi and English values; two-column layout.
- Committee sections can be created separately from members, including empty tables.
- About-specific facilities can be edited without modifying homepage metrics.
- Duties use screenshot-like asymmetric two-column card arrangement.
- New About Elements editor: choose the tab and add paragraphs, bullets, a table, metric tiles, an image or heading. Bilingual, draft/publish, sortable, image upload.
- All added content is village-scoped in `public.content_items` under existing RLS.
- Public pages only show published records; editor preview can show drafts.

## Admin menu
Open `/admin`, select a village and click **About Page — 6 Tabs**. Choose one of the section editors, or **About — Add Page Elements**. Set status=Published to make the item appear on public page. For committee tables, create a heading in **About — Committee Sections** and add members in **About — Committees** with the same committee key as the heading slug.

## Backend changes
Database migration `database/06_about_custom_elements.sql` is compatible with the existing `gramos-clean` project. It adds allowed content kinds only and preserves all records. Once this migration has been applied remotely, **do not re-run it**.

## Run
`npm run dev` and open `http://localhost:8000/demo/about` or `http://localhost:8000/v/shirpur/about`. Admin: `http://localhost:8000/admin/login`.

## Notes
Data shown in `/demo` is sample-only. The real village must enter verified content through admin. The site is a reusable template, not an export of private source files from the reference provider. Do not reuse the reference's branding, real personal data, or photography without appropriate permission.

# GramOS v2.2 — What to check next

1. Install the updated ZIP over the same project folder on your Mac and run `npm run dev`.
2. Compare `http://localhost:8000/demo/about` with `http://localhost:8000/v/shirpur/about` at the same Safari window width. They use the same layout; the real village has empty placeholder grids until you publish verified content.
3. Confirm Gram Panchayat information appears in **All Information**, and that neither **History** nor **Roles & Responsibilities** appears there. The sixth tab alone contains Roles & Responsibilities.
4. Check homepage Lokseva cards against the narrower video panel and review the footer font size.
5. From Admin, publish village-specific facts, officials, committee members and facilities; preview them before publishing.
6. Next page for visual comparison: **Lokseva** (`/demo/services`, `/v/shirpur/services`). The editable page and V2.2 database migration are present, but its visual fidelity to the reference needs your review.
7. Commit the existing project files into your existing GitHub repo and redeploy using its existing Vercel project. Do not create a new project.

Note: Supabase Auth leaked-password protection had been disabled per its security advisor; enable this in the dashboard if your plan allows.

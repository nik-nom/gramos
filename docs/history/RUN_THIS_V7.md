# Update existing GramOS project on your Mac

1. Download `GramOS_Shamvadi_V7_Existing_Project_Updated.zip` into `~/Downloads`.
2. Stop your existing local server with Control+C.
3. In Terminal:

```bash
cd ~/Downloads
unzip -o GramOS_Shamvadi_V7_Existing_Project_Updated.zip -d gramos-shamvadi-v2
cd gramos-shamvadi-v2
npm run dev
```

4. Open `http://localhost:8000/demo` for a screenshot-based demo; use `http://localhost:8000/admin` to manage your actual villages.
5. From the admin, open `shirpur` (existing), set your logo and text, upload your own images, add the necessary content to its editor collections, save, publish each item and view `/v/shirpur`.
6. Use Cmd+Shift+R in Safari if the old CSS appears cached.
7. Commit the updated project files to the SAME GitHub repo and redeploy your SAME Vercel project. No new database, repository or domain needed.

All homepage sections have responsive styles and are fed by the admin/Supabase. The screenshot is a design reference; do not copy its village-specific official text/photos to a different client site.

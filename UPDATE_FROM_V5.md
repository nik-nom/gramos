# V5 → V6 (same folder, repo and database)

1. Stop old server with Control+C.
2. Extract the ZIP into your existing `~/Downloads/gramos-shamvadi-v2` folder, overwriting matching files.
3. Run `npm run dev` in that folder
4. **Do not run SQL migrations again.** V6 needed no schema changes.
5. Create your first Supabase authentication user and grant `platform_admins` (see ADMIN_SETUP.md).
6. Sign in at `http://localhost:8000/admin/login`.
7. Create websites from **Village management → Create a village**. Each website uses the same template but stores independent data.
8. To update the live site, commit these changes to your existing GitHub repo; Vercel deploys it. Never commit passwords or service-role secrets.

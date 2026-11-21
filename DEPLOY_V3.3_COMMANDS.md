# Deploy GramOS v3.3 in existing Vercel project

Unzip the **Changed Files Only** archive directly over your **existing v3.2 codebase**. Keep `.env`, `config.js` and your current Git repo intact.

From the project root (the folder containing `package.json`):

```bash
npm test
npm run dev
```

On Vercel, select your current project, then set these Production env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`. Keep existing server-only `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` for contact submissions.

```bash
npm install -g vercel
vercel login
vercel link
vercel env add SUPABASE_URL production
vercel env add SUPABASE_PUBLISHABLE_KEY production
vercel env add SITE_URL production
vercel deploy --prod
```

Check `https://YOUR-LIVE-DOMAIN/sitemap.xml`, `/robots.txt`, and a sample page `/v/shirpur/about`. Submit the full sitemap URL in Google Search Console. The sitemap is **generated at runtime from Supabase** and therefore does not need a manual upload.

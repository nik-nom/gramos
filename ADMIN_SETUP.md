# GramOS V6 — First admin login and reusable village websites

## Why the login says "Invalid login credentials"
This Supabase project is **new**. The previous project password does NOT carry over.
At the time we checked, `gramos-clean` had **zero Auth users** and **zero platform admins**.
There is no preset admin password. Do not put a shared password in the website source.

## Step 1 — Create a Supabase Auth user
1. Open: https://supabase.com/dashboard/project/nttnrfyidokwnkqrukdb/auth/users
2. Click **Add user → Create new user**. Enter YOUR email and a password of YOUR choice.
3. Confirm the email if necessary. Keep the password private.

## Step 2 — Grant website-creator / platform-admin permission
1. Open: https://supabase.com/dashboard/project/nttnrfyidokwnkqrukdb/sql/new
2. Replace `YOUR_EMAIL_HERE` below with your exact Auth user email.
3. Run the SQL in your trusted Supabase dashboard (NOT on the public website).

```sql
INSERT INTO public.platform_admins (user_id)
SELECT id
FROM auth.users
WHERE lower(email) = lower('YOUR_EMAIL_HERE')
ON CONFLICT (user_id) DO NOTHING;

SELECT (SELECT count(*) FROM auth.users WHERE lower(email)=lower('YOUR_EMAIL_HERE')) AS matching_user,
       (SELECT count(*) FROM public.platform_admins WHERE user_id IN
           (SELECT id FROM auth.users WHERE lower(email)=lower('YOUR_EMAIL_HERE'))) AS admin_role_granted;
```

Both `matching_user` and `admin_role_granted` must read **1**.
If the first is 0, the user does not exist in this exact Supabase project.

## Step 3 — Sign in on the Node.js website
Start local Node server: `npm run dev` (Node.js 18+).
Open http://localhost:8000/admin/login and sign in with the credentials from Step 1.
You should see **Village management**; don't reuse old project credentials.

## Step 4 — Create as many village websites as you need
- On **Admin → Village management**, fill in **Create a village website**.
- Slug: for example `shamvadi`. Page will be at `/v/shamvadi`.
- Choose the built-in **Shamvadi Blue** template (all websites share ONE codebase/design).
- Create a PRIVATE **Draft**. This saves a separate `public.villages` row.
- Add images, banners, notices, news, projects and other items under the village's admin sections.
- Each content item is stored in `public.content_items` with a unique village_id.
- Use **Private preview** (`/v/shamvadi?preview=1`, sign in first).
- Publish individual content items, then publish the village website.
- Repeat to create another village using the same template but separate data.

**Do not edit the demo as if it were a real website.** `/demo` is a static example. Real published sites live at `/v/{slug}`.

## Security
Keep `SUPABASE_SERVICE_ROLE_KEY` and user passwords OUT of config.js/GitHub. The browser must use only the publishable key.
Row Level Security already restricts website editing to authorized administrators and village editors.

## Deployment
Replace the files at the ROOT of your **existing GitHub repository** (no new repo), and deploy that repository via Vercel. Keep `config.js`, `src/`, `assets/`, `api/`, `styles.css`, `index.html`, `vercel.json` and package.json at the repo root.

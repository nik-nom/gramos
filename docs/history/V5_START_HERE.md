# GramOS Shamvadi V5 — Animation + About page

This is a FULL replacement for the V4 files in the SAME Node.js project. It does not create a new repository.

## Install locally
1. Stop the prior server (Control+C).
2. Extract the V5 ZIP into the project folder, replacing V4 files. Keep the folder structure.
3. Open Terminal inside the folder containing package.json; run `npm run dev`.
4. Visit `http://localhost:8000/demo` and `http://localhost:8000/demo/about`.
5. In the admin, open your village settings to edit About title, introduction, body, history, mission, vision, headings, and cover photo.
6. Open the sidebar item `About — Additional Sections` to add as many repeatable About sections as you want (publish each item); `Officials` manages the staff cards.
7. The site uses the same Supabase project and existing `/v/{slug}` routes.

## Animations
- Hero slideshow: crossfade, 6.5-second auto advance (when user is not focused/hovering).
- Gallery slideshow: smooth crossfade, 8.5-second auto advance, arrow/dot controls.
- Sections gently reveal on scroll; cards/buttons have tiny hover movements.
- Reduced-motion visitors get no motion/autoplay.

## Deployment
Update the existing GitHub repository root with the **contents** of this ZIP, then redeploy the existing Vercel project. Leave the Supabase project and public domain unchanged.

## Important
- About page `/demo/about` contains explicitly **sample** content.
- The real About page `/v/{slug}/about` shows real content ONLY after your admin publishes the village and each repeatable About section.
- The reference's `about.php` could not be accessed for a pixel-perfect comparison; this is a blue/white About page built in the reference's design language, not an asserted exact screenshot match.
- For the connected Supabase project, SQL migration 04 is to be applied through the connector; do not rerun migrations 01–03.

# GramOS v3.4 — Security review (scope and findings)

## Improvements performed

- **Authorization:** Added a complaint `reviewer` membership role distinct from `owner`/`editor`; the database's `can_edit_village()` no longer grants editing to every member. A new `can_review_submissions()` function controls read permissions for assigned villagers' submitted complaints. Private attachment signing checks signed-in identity and role membership.
- **Database isolation:** Existing public `content_items` RLS remains enabled; content and addable elements continue to be village-scoped and published-only for anonymous visitors. The new member RLS and function definitions were checked in Supabase after migration.
- **Input and link validation:** Instagram, WhatsApp, LinkedIn, Facebook, and YouTube destinations must be HTTPS on platform-owned hostnames. Public HTML never emits untrusted raw page-element HTML. Page add-on types are allowlisted. Untrusted strings are HTML-escaped. The server checks form fields, attachment format and size.
- **Cloudflare Turnstile:** Server verifies tokens at Cloudflare's Siteverify endpoint and rejects the wrong hostname when `SITE_URL` or allowed hostnames are configured. Missing server secrets keep the endpoint disabled. Site key is public; secret key is server-only.
- **Private submissions:** `submissions` remains RLS-enabled. Anonymous visitors cannot query it. Uploaded photos stay in a private bucket. Only an assigned editor/reviewer or platform admin can request a short-lived signed attachment URL.
- **Headers:** Existing anti-sniffing, HSTS, referrer and frame headers retained; added COOP and X-Permitted-Cross-Domain-Policies.

## Tested

30 automated project suites passed, including mock submit success, Cloudflare invalid-host rejection, invalid-link rejection, private attachment role membership path, output escaping, published-only elements and the existing site/admin contracts. Live Supabase table policies and function definitions were inspected. Local `/api/submit` without secrets correctly returned a configuration error. No actual production complaint was submitted.

## Remaining risks / action required

1. Supabase Security Advisor still reports **Leaked Password Protection Disabled** (see Supabase Auth configuration). Enable if available for your plan.
2. **Production Cloudflare Turnstile not configured:** set the site key and secret, authorize your hostnames and verify one real form submission and an authorized reviewer login.
3. No live browser visual or end-to-end role test was possible in this environment. Test with a newly invited reviewer account after deployment, confirm it cannot edit content, and validate a public complaint.
4. Use server/WAF-side IP or global rate limits in addition to the existing email-based hourly limit; distributed bots can bypass email throttling.
5. Consider a stricter CSP and pinned third-party CDN assets after a full browser compatibility test. Current Supabase browser SDK loads from a version-range CDN URL. Avoid rolling out an untested CSP that breaks Admin/Turnstile.
6. Establish a privacy notice, data retention/deletion policy, backups and secure review process for citizen messages and photos.

**This review does not certify the website as vulnerability-free.** It is a code/security controls review with targeted functional tests, not a penetration test or a guarantee of third-party security.

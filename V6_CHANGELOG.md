# V6 change log
- Fixed password trimming: leading/trailing spaces are now preserved when signing in.
- Added first-time setup instructions directly on the admin login page.
- Added clear, actionable login error messages (no default password exists).
- Added a reusable Shamvadi Blue website-template builder with independent village data.
- New village form now captures district and taluka alongside names, and clearly explains URL and template behavior.
- Each village can be previewed from the admin dashboard.
- Saving village settings now preserves future/unknown site_settings template metadata instead of dropping it.
- Added ADMIN_SETUP.md with exact steps and safe SQL for first admin account.
- No new tables were required and no Supabase schema changes were made in V6.

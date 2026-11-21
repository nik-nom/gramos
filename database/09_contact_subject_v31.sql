-- GramOS v3.1. Safe, additive migration for the existing Supabase project.
-- Run once before deploying api/submit.js from v3.1.
-- Does not modify RLS policies, delete data, or expose private submissions.

alter table public.submissions
  add column if not exists subject text not null default 'general';

comment on column public.submissions.subject is
  'Visitor-selected enquiry category: general, complaint, suggestion, or request.';

-- News articles store approved related URLs in the existing JSONB details field:
-- {"related_links_mr":"लेख | https://example.org", "source_title_mr":"अधिक माहिती"}
-- Editable contact headings and approved map links reside in villages.site_settings.
-- The existing content_items_display_idx and submissions_inbox_idx already cover
-- village-scoped reads; creating redundant indexes is unnecessary.
-- Existing RLS policies stay in force.

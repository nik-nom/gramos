
-- v2.6 migration (already applied to connected gramos-clean database).
-- Keeps village scoping and all current RLS policies unchanged.
BEGIN;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check CHECK (kind IN (
 'about_sections','about_facts','about_facilities','about_blocks',
 'committee_groups','committees','duties',
 'banners','gallery','notices','services','service_steps','service_forms','service_links','videos',
 'news','projects','metrics','schemes','leaders','officials','facilities','pages'
));
COMMENT ON COLUMN public.content_items.details IS 'Village content details; service_links may have color (blue, gray, yellow, green, peach, lavender) and external_url. Existing RLS policies apply.';
COMMIT;

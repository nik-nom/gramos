-- V10 – Run once on the existing GramOS clean project. Non-destructive.
BEGIN;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check CHECK (kind IN ('about_sections','about_facts','about_facilities','about_blocks','committee_groups','committees','duties','banners','gallery','notices','services','videos','news','projects','metrics','schemes','leaders','officials','facilities','pages'));
COMMENT ON COLUMN public.content_items.details IS 'About page: about_tab, element, columns_mr/en; about_facts: group, value_mr/en; committee_groups: slug identifies group. Other kinds retain existing details. All RLS and village scoping unchanged.';
COMMIT;

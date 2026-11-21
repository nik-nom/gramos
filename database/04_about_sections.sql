-- GramOS v5 — add structured About-page content to the existing project.
-- Already handled by the connected Supabase integration when this package is delivered.
-- Apply only once if provisioning a different Supabase project.
BEGIN;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check
  CHECK (kind IN ('about_sections','banners','gallery','notices','services','videos','news',
   'projects','metrics','schemes','leaders','officials','facilities','pages'));
COMMENT ON COLUMN public.content_items.details IS
  'Editable section metadata. About page: kind=about_sections. Other content types use published title/body/images/order.';
COMMIT;

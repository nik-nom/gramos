-- GramOS V3 / existing project only / NON-DESTRUCTIVE MIGRATION.
-- Supports fully editable screenshot-style homepage, carousels and statistics.
-- Do not rerun 01_setup.sql or 02_shamvadi_blue_fields.sql on an existing project.
BEGIN;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check
  CHECK (kind IN ('banners','gallery','notices','services','videos','news','projects','metrics','schemes','leaders','officials','facilities','pages'));
ALTER TABLE public.villages DROP CONSTRAINT IF EXISTS villages_home_sections_check;
ALTER TABLE public.villages ADD CONSTRAINT villages_home_sections_check
  CHECK (home_sections <@ ARRAY['gallery_notice','leaders_schemes','services_video','news','projects','facilities']::text[]);
ALTER TABLE public.villages ALTER COLUMN home_sections SET DEFAULT
 ARRAY['gallery_notice','leaders_schemes','services_video','news','projects','facilities']::text[];
-- Normalize old empty/default ordering if present. Do not change published content.
UPDATE public.villages SET home_sections =
 ARRAY['gallery_notice','leaders_schemes','services_video','news','projects','facilities']::text[]
 WHERE home_sections IS NULL OR home_sections && ARRAY['gallery','services','notices','leaders','officials']::text[];
COMMENT ON COLUMN public.villages.site_settings IS
 'Editable Shamvadi homepage config: ticker quote, welcome text/button, navbar, section headings, footer/social text, external links, office hours, credits. Bilingual keys xx_mr / xx_en.';
COMMENT ON COLUMN public.content_items.details IS
 'Bilingual content extras. banners: image_url/order; news: event_date/author_mr,en; projects: scheme_mr,en/project_year/location_mr,en; metrics: value; services: qr_image_url; videos: external_url.';
COMMIT;

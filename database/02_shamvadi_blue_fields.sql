-- GramOS V2: Shamvadi blue-template field mapping.
-- Non-destructive extension of the clean database: no table drops and no deletes.
-- Apply to the NEW gramos-clean project only.
-- Site-level quote, social links, office hours and useful links.
alter table public.villages
  add column if not exists site_settings jsonb not null default '{}'::jsonb;

-- Per-item extras used in the news, notice, services/QR and project layouts.
-- Supported keys are validated by the client and constrained to a JSON object.
alter table public.content_items
  add column if not exists details jsonb not null default '{}'::jsonb;

-- Restrict columns to objects (not arrays or scalars).
alter table public.villages
  add constraint villages_site_settings_object check (jsonb_typeof(site_settings) = 'object');
alter table public.content_items
  add constraint content_items_details_object check (jsonb_typeof(details) = 'object');

-- New villages use the reference homepage order:
-- Photo Gallery, Citizen Services, News + Notice sidebar, Development Projects.
alter table public.villages alter column home_sections
  set default array['gallery','services','news','projects']::text[];

comment on column public.villages.site_settings is
  'Blue template: quote_mr/en, office_hours_mr/en, facebook_url, instagram_url, youtube_url, links_mr/en';
comment on column public.content_items.details is
  'Template extras: event_date, author_mr/en, scheme_mr/en, project_year, location_mr/en, qr_image_url';

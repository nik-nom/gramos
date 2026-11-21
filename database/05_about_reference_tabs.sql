-- GramOS V9: extend existing content_items table for the six-tab About page.
-- Apply this migration to the existing gramos-clean Supabase project exactly once.
-- Does not delete villages, users, existing content, or storage.
begin;
alter table public.content_items drop constraint if exists content_items_kind_check;
alter table public.content_items add constraint content_items_kind_check
  check (kind in (
    'about_sections','about_facts','committees','duties',
    'banners','gallery','notices','services','videos','news','projects',
    'metrics','schemes','leaders','officials','facilities','pages'
  ));
comment on column public.content_items.details is
  'GramOS village-scoped metadata. About facts: group (basic/population), value. Officials: about_group (representatives/staff), ward_mr/en, phone, elected_date. Committees: committee_key, committee_title_mr/en, committee_role_mr/en. Facilities: value. Duties: icon, accent. All are controlled by admin and RLS.';
commit;

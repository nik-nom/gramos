-- GramOS Clean v1 — SINGLE DATABASE SETUP FILE
-- Run once in a BRAND-NEW Supabase project: SQL Editor > New query > paste > Run.
-- Do not run this against the old project's database.
-- After running, grant your Auth user the platform admin role using the README command.

create extension if not exists pgcrypto;
-- Keep privileged helper functions out of the exposed public API schema.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

-- Private policy helpers live outside Data API-exposed schemas.
-- Keep `app_private` OUT of the Supabase Data API exposed schemas list.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.villages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 64),
  name_en text not null default '',
  name_mr text not null default '',
  tagline_en text not null default '',
  tagline_mr text not null default '',
  about_en text not null default '',
  about_mr text not null default '',
  district_en text not null default '',
  district_mr text not null default '',
  taluka_en text not null default '',
  taluka_mr text not null default '',
  address_en text not null default '',
  address_mr text not null default '',
  phone text not null default '',
  email text not null default '',
  hero_image_url text not null default '',
  logo_url text not null default '',
  template_style text not null default 'classic' check (template_style in ('classic','modern')),
  home_sections text[] not null default array['services','notices','news','leaders','officials','projects','gallery']::text[],
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name_en)) > 0 or length(trim(name_mr)) > 0),
  check (home_sections <@ array['services','notices','news','leaders','officials','projects','gallery']::text[])
);

create table public.village_members (
  village_id uuid not null references public.villages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor')),
  primary key (village_id, user_id)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references public.villages(id) on delete cascade,
  kind text not null check (kind in ('news','notices','services','schemes','projects','leaders','officials','gallery','facilities','pages')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 90),
  title_en text not null default '',
  title_mr text not null default '',
  subtitle_en text not null default '',
  subtitle_mr text not null default '',
  body_en text not null default '',
  body_mr text not null default '',
  image_url text not null default '',
  external_url text not null default '',
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (village_id, kind, slug),
  check (length(trim(title_en)) > 0 or length(trim(title_mr)) > 0)
);

create index content_items_display_idx on public.content_items (village_id, kind, status, sort_order, created_at desc);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references public.villages(id) on delete cascade,
  sender_name text not null check (length(sender_name) between 2 and 100),
  sender_email text not null check (length(sender_email) between 5 and 254),
  message text not null check (length(message) between 10 and 2000),
  attachment_path text,
  status text not null default 'new' check (status in ('new','reviewed','rejected')),
  created_at timestamptz not null default now()
);
create index submissions_inbox_idx on public.submissions (village_id, created_at desc);

create or replace function app_private.is_platform_admin()
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create or replace function app_private.can_edit_village(p_village_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.village_members
    where village_id = p_village_id and user_id = (select auth.uid())
  );
$$;

create or replace function app_private.update_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger villages_updated before update on public.villages
for each row execute procedure app_private.update_updated_at();
create trigger content_updated before update on public.content_items
for each row execute procedure app_private.update_updated_at();

alter table public.platform_admins enable row level security;
alter table public.villages enable row level security;
alter table public.village_members enable row level security;
alter table public.content_items enable row level security;
alter table public.submissions enable row level security;

create policy "admins_can_see_own_role" on public.platform_admins
for select to authenticated using (user_id = (select auth.uid()));

create policy "public_or_manager_reads_village" on public.villages
for select to anon, authenticated using (
  status = 'published' or app_private.can_edit_village(id)
);
create policy "platform_admin_creates_village" on public.villages
for insert to authenticated with check (app_private.is_platform_admin());
create policy "manager_updates_village" on public.villages
for update to authenticated using (app_private.can_edit_village(id))
with check (app_private.can_edit_village(id));
-- No DELETE policy: archiving is safer than deleting villages.

create policy "member_reads_membership" on public.village_members
for select to authenticated using (user_id = (select auth.uid()) or app_private.is_platform_admin());
create policy "platform_admin_manages_memberships" on public.village_members
for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

create policy "published_or_manager_reads_content" on public.content_items
for select to anon, authenticated using (
  app_private.can_edit_village(village_id) or (
    status = 'published' and exists (
      select 1 from public.villages v where v.id = village_id and v.status = 'published'
    )
  )
);
create policy "manager_creates_content" on public.content_items
for insert to authenticated with check (app_private.can_edit_village(village_id));
create policy "manager_updates_content" on public.content_items
for update to authenticated using (app_private.can_edit_village(village_id))
with check (app_private.can_edit_village(village_id));
create policy "manager_deletes_content" on public.content_items
for delete to authenticated using (app_private.can_edit_village(village_id));

-- Visitors can never directly read/write submissions; the Vercel API verifies Turnstile first.
create policy "manager_reads_submissions" on public.submissions
for select to authenticated using (app_private.can_edit_village(village_id));
create policy "manager_updates_submissions" on public.submissions
for update to authenticated using (app_private.can_edit_village(village_id))
with check (app_private.can_edit_village(village_id));

-- Supabase Storage: public published image library, private visitor attachments.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('village-media', 'village-media', true, 4194304, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visitor-uploads', 'visitor-uploads', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public_reads_village_media" on storage.objects
for select to anon, authenticated using (bucket_id = 'village-media');
create policy "manager_uploads_village_media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'village-media' and exists (
    select 1 from public.villages v
    where v.id::text = (storage.foldername(name))[1] and app_private.can_edit_village(v.id)
  )
);
create policy "manager_deletes_village_media" on storage.objects
for delete to authenticated using (
  bucket_id = 'village-media' and exists (
    select 1 from public.villages v
    where v.id::text = (storage.foldername(name))[1] and app_private.can_edit_village(v.id)
  )
);

-- Explicit grants. RLS remains the access gate for browser requests.
grant usage on schema public to anon, authenticated;
grant select on public.villages, public.content_items to anon;
grant select, insert, update, delete on public.villages, public.content_items, public.village_members to authenticated;
grant select on public.platform_admins to authenticated;
grant select, update on public.submissions to authenticated;
-- Security-definer policy helpers are explicitly scoped to the roles that need them.
-- These helpers are NOT RPC endpoints because app_private is not exposed in Data API settings.
revoke all on function app_private.is_platform_admin() from public, anon, authenticated;
revoke all on function app_private.can_edit_village(uuid) from public, anon, authenticated;
revoke all on function app_private.update_updated_at() from public, anon, authenticated;
revoke all on function app_private.is_platform_admin() from public, anon, authenticated;
revoke all on function app_private.can_edit_village(uuid) from public, anon, authenticated;
revoke all on function app_private.update_updated_at() from public, anon, authenticated;
grant execute on function app_private.is_platform_admin() to authenticated;
grant execute on function app_private.can_edit_village(uuid) to anon, authenticated;

-- GramOS v4.2 (gramos-clean / public.villages) — additive, non-destructive.
-- Apply to staging first; never apply to the older gramos-platform/village_sites schema.
BEGIN;
DO $check$ BEGIN
 IF to_regclass('public.villages') IS NULL OR to_regclass('public.village_members') IS NULL
   OR to_regclass('public.platform_admins') IS NULL
   OR to_regprocedure('app_private.can_edit_village(uuid)') IS NULL
   OR to_regprocedure('app_private.is_platform_admin()') IS NULL
 THEN RAISE EXCEPTION 'GramOS clean schema preflight failed; no changes made'; END IF;
END $check$;

-- Allow Super Admin uploads to a shared platform folder in the existing public image bucket.
DROP POLICY IF EXISTS gramos_v42_platform_media_upload ON storage.objects;
CREATE POLICY gramos_v42_platform_media_upload ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id='village-media' AND (storage.foldername(name))[1]='platform'
   AND app_private.is_platform_admin());

-- All village editors are normal admins (no user creation or village removal).
-- Existing platform_admins are Super Admins. Existing reviewer assignments remain read-only.
CREATE TABLE IF NOT EXISTS public.gramos_platform_branding (
 id int PRIMARY KEY DEFAULT 1 CHECK (id=1),
 footer_logos jsonb NOT NULL DEFAULT '[]'::jsonb
   CHECK (jsonb_typeof(footer_logos)='array' AND jsonb_array_length(footer_logos)<=12),
 footer_settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(footer_settings)='object'),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.gramos_platform_branding (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.gramos_platform_branding ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gramos_platform_branding FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gramos_platform_branding TO anon,authenticated;
DROP POLICY IF EXISTS gramos_branding_read ON public.gramos_platform_branding;
CREATE POLICY gramos_branding_read ON public.gramos_platform_branding FOR SELECT TO anon,authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.village_site_drafts (
 village_id uuid PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
 changes jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(changes)='object'),
 revision bigint NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.village_site_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.village_site_drafts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.village_site_drafts TO authenticated;
DROP POLICY IF EXISTS gramos_v42_read_draft ON public.village_site_drafts;
CREATE POLICY gramos_v42_read_draft ON public.village_site_drafts FOR SELECT TO authenticated
 USING (app_private.can_edit_village(village_id));

-- Invoked from browser via authenticated Supabase RPC; private helper checks *every* write.
CREATE OR REPLACE FUNCTION public.gramos_save_site_draft(p_village_id uuid,p_patch jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE k text; r bigint; allowed text[]:=ARRAY[
 'site_settings','hero_image_url','home_sections','slug','name_mr','name_en',
 'tagline_mr','tagline_en','about_mr','about_en','district_mr','district_en',
 'taluka_mr','taluka_en','address_mr','address_en','phone','email','logo_url','template_style'];
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT app_private.can_edit_village(p_village_id) THEN
   RAISE EXCEPTION 'Not authorized to edit this village' USING ERRCODE='42501'; END IF;
 IF p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR p_patch='{}'::jsonb
   OR octet_length(p_patch::text)>150000 THEN
   RAISE EXCEPTION 'Invalid or oversized draft' USING ERRCODE='22023'; END IF;
 FOR k IN SELECT jsonb_object_keys(p_patch) LOOP
  IF NOT k=ANY(allowed) THEN RAISE EXCEPTION 'Unknown draft field: %',k USING ERRCODE='22023'; END IF;
 END LOOP;
 IF p_patch ? 'site_settings' AND jsonb_typeof(p_patch->'site_settings')<>'object' THEN
   RAISE EXCEPTION 'Invalid site settings' USING ERRCODE='22023'; END IF;
 IF p_patch ? 'home_sections' AND jsonb_typeof(p_patch->'home_sections')<>'array' THEN
   RAISE EXCEPTION 'Invalid section order' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.villages WHERE id=p_village_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Village missing' USING ERRCODE='22023'; END IF;
 INSERT INTO public.village_site_drafts(village_id,changes,updated_at,updated_by)
 VALUES (p_village_id,p_patch,now(),auth.uid())
 ON CONFLICT(village_id) DO UPDATE SET
 changes=public.village_site_drafts.changes || EXCLUDED.changes ||
   jsonb_build_object('site_settings',
     coalesce(public.village_site_drafts.changes->'site_settings','{}'::jsonb) ||
     coalesce(EXCLUDED.changes->'site_settings','{}'::jsonb)),
 revision=public.village_site_drafts.revision+1,
 updated_at=now(),updated_by=auth.uid()
 RETURNING revision INTO r;
 RETURN r;
END $fn$;
REVOKE ALL ON FUNCTION public.gramos_save_site_draft(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_save_site_draft(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.gramos_publish_site_draft(p_village_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE d jsonb;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT app_private.can_edit_village(p_village_id) THEN
  RAISE EXCEPTION 'Not authorized to publish this village' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.villages WHERE id=p_village_id FOR UPDATE;
 SELECT changes INTO d FROM public.village_site_drafts WHERE village_id=p_village_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.villages SET
  site_settings=coalesce(site_settings,'{}'::jsonb) || coalesce(d->'site_settings','{}'::jsonb),
  hero_image_url=coalesce(d->>'hero_image_url',hero_image_url),
  home_sections=CASE WHEN d?'home_sections' THEN ARRAY(SELECT jsonb_array_elements_text(d->'home_sections')) ELSE home_sections END,
  slug=coalesce(d->>'slug',slug),
  name_mr=coalesce(d->>'name_mr',name_mr),name_en=coalesce(d->>'name_en',name_en),
  tagline_mr=coalesce(d->>'tagline_mr',tagline_mr),tagline_en=coalesce(d->>'tagline_en',tagline_en),
  about_mr=coalesce(d->>'about_mr',about_mr),about_en=coalesce(d->>'about_en',about_en),
  district_mr=coalesce(d->>'district_mr',district_mr),district_en=coalesce(d->>'district_en',district_en),
  taluka_mr=coalesce(d->>'taluka_mr',taluka_mr),taluka_en=coalesce(d->>'taluka_en',taluka_en),
  address_mr=coalesce(d->>'address_mr',address_mr),address_en=coalesce(d->>'address_en',address_en),
  phone=coalesce(d->>'phone',phone),email=coalesce(d->>'email',email),
  logo_url=coalesce(d->>'logo_url',logo_url),template_style=coalesce(d->>'template_style',template_style)
 WHERE id=p_village_id;
 DELETE FROM public.village_site_drafts WHERE village_id=p_village_id;
 RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION public.gramos_publish_site_draft(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_publish_site_draft(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.gramos_discard_site_draft(p_village_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT app_private.can_edit_village(p_village_id) THEN
  RAISE EXCEPTION 'Not authorized to discard village draft' USING ERRCODE='42501'; END IF;
 DELETE FROM public.village_site_drafts WHERE village_id=p_village_id;
 RETURN FOUND;
END $fn$;
REVOKE ALL ON FUNCTION public.gramos_discard_site_draft(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_discard_site_draft(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.gramos_set_platform_branding(p_logos jsonb,p_settings jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE logo text; k text; allowed text[]:=ARRAY[
 'links_mr','links_en','office_hours_mr','office_hours_en',
 'facebook_url','instagram_url','youtube_url','whatsapp_url','linkedin_url'];
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT app_private.is_platform_admin() THEN
  RAISE EXCEPTION 'Only Super Admin may edit shared footer' USING ERRCODE='42501'; END IF;
 IF p_logos IS NULL OR jsonb_typeof(p_logos)<>'array' OR jsonb_array_length(p_logos)>12 THEN
  RAISE EXCEPTION 'Provide up to 12 logos' USING ERRCODE='22023'; END IF;
 FOR logo IN SELECT jsonb_array_elements_text(p_logos) LOOP
  IF logo IS NULL OR length(logo)>2048 OR logo !~* '^https://[^[:space:]]+$' THEN
   RAISE EXCEPTION 'Only HTTPS logo URLs are permitted' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF p_settings IS NULL OR jsonb_typeof(p_settings)<>'object'
    OR octet_length(p_settings::text)>16000 THEN
  RAISE EXCEPTION 'Invalid shared footer settings' USING ERRCODE='22023'; END IF;
 FOR k IN SELECT jsonb_object_keys(p_settings) LOOP
  IF NOT k=ANY(allowed) THEN
    RAISE EXCEPTION 'Shared footer field not allowed: %',k USING ERRCODE='22023'; END IF;
  IF k LIKE '%_url' AND nullif(p_settings->>k,'') IS NOT NULL
    AND (p_settings->>k) !~* '^https://[^[:space:]]+$' THEN
    RAISE EXCEPTION 'Social links must be HTTPS' USING ERRCODE='22023'; END IF;
 END LOOP;
 UPDATE public.gramos_platform_branding
 SET footer_logos=p_logos,footer_settings=p_settings,updated_at=now(),updated_by=auth.uid() WHERE id=1;
 RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION public.gramos_set_platform_branding(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_set_platform_branding(jsonb,jsonb) TO authenticated;

-- Grant additional Super Admin access only to an existing Auth user.
-- No one can self-promote from an editor/reviewer role.
DROP POLICY IF EXISTS gramos_superadmin_lists_superadmins ON public.platform_admins;
CREATE POLICY gramos_superadmin_lists_superadmins ON public.platform_admins FOR SELECT TO authenticated
 USING (app_private.is_platform_admin());

CREATE OR REPLACE FUNCTION public.gramos_grant_super_admin(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT app_private.is_platform_admin() THEN
  RAISE EXCEPTION 'Only an existing Super Admin can add another' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN
  RAISE EXCEPTION 'User is not registered in Supabase Authentication' USING ERRCODE='22023'; END IF;
 INSERT INTO public.platform_admins(user_id) VALUES(p_user_id) ON CONFLICT(user_id) DO NOTHING;
 RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION public.gramos_grant_super_admin(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_grant_super_admin(uuid) TO authenticated;

-- Super Admin only can archive/restore a village. Regular admins may publish/unpublish.
CREATE OR REPLACE FUNCTION app_private.gramos_guard_archive_v42()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN
 IF (OLD.status='archived' OR NEW.status='archived') AND OLD.status IS DISTINCT FROM NEW.status
    AND NOT app_private.is_platform_admin() THEN
   RAISE EXCEPTION 'Only Super Admin can remove/archive or restore a village' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS gramos_guard_archive_v42 ON public.villages;
CREATE TRIGGER gramos_guard_archive_v42 BEFORE UPDATE OF status ON public.villages
FOR EACH ROW EXECUTE FUNCTION app_private.gramos_guard_archive_v42();
NOTIFY pgrst,'reload schema';
COMMIT;

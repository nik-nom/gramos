-- GramOS v3.4 — retain all village content and platform admins; add reviewer-only access.
-- The reviewer role must never satisfy app_private.can_edit_village().
BEGIN;

ALTER TABLE public.village_members DROP CONSTRAINT IF EXISTS village_members_role_check;
ALTER TABLE public.village_members
  ADD CONSTRAINT village_members_role_check CHECK (role IN ('owner','editor','reviewer'));

CREATE OR REPLACE FUNCTION app_private.can_edit_village(p_village_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT app_private.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.village_members
    WHERE village_id=p_village_id AND user_id=(SELECT auth.uid())
      AND role IN ('owner','editor')
  );
$$;
REVOKE ALL ON FUNCTION app_private.can_edit_village(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_edit_village(uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION app_private.can_review_submissions(p_village_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT app_private.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.village_members
    WHERE village_id=p_village_id AND user_id=(SELECT auth.uid())
      AND role IN ('owner','editor','reviewer')
  );
$$;
REVOKE ALL ON FUNCTION app_private.can_review_submissions(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION app_private.can_review_submissions(uuid) TO authenticated;

DROP POLICY IF EXISTS manager_reads_submissions ON public.submissions;
CREATE POLICY reviewer_reads_assigned_submissions ON public.submissions
  FOR SELECT TO authenticated USING (app_private.can_review_submissions(village_id));
-- Only the original manager_updates_submissions policy authorizes status updates;
-- now it excludes reviewer-only members through can_edit_village().

CREATE POLICY reviewer_can_see_assigned_village ON public.villages
  FOR SELECT TO authenticated USING (app_private.can_review_submissions(id));

ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check
  CHECK (kind IN (
    'about_sections','about_facts','about_facilities','about_blocks','committee_groups',
    'committees','duties','banners','gallery','notices','services','service_steps',
    'service_forms','service_links','videos','news','projects','metrics','schemes',
    'leaders','officials','facilities','pages','page_elements'
  ));
COMMENT ON COLUMN public.content_items.details IS
 'Village-scoped optional page_elements: {page_target,element}. Approved types: text, heading, list, image, link, stat. Website content is escaped before rendering.';
COMMIT;

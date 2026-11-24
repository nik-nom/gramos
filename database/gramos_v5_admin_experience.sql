-- GramOS v5: additive, non-destructive admin experience migration.
-- Review against the connected gramos-clean project before applying. Never run in the legacy project.
BEGIN;
DO $guard$ BEGIN
  IF to_regclass('public.villages') IS NULL OR to_regclass('public.content_items') IS NULL OR
     to_regclass('public.platform_admins') IS NULL OR to_regprocedure('app_private.can_edit_village(uuid)') IS NULL
  THEN RAISE EXCEPTION 'GramOS clean schema not found — migration aborted'; END IF;
END $guard$;

ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS gramos_content_live_index ON public.content_items(village_id,kind,created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.gramos_activity_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
 actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 actor_label text NOT NULL DEFAULT 'System',
 entity text NOT NULL CHECK(entity IN ('villages','content_items','submissions','village_members','village_clients','village_site_drafts','village_domains')),
 entity_id text NOT NULL,
 operation text NOT NULL CHECK(operation IN ('INSERT','UPDATE','DELETE')),
 title text NOT NULL DEFAULT '',
 old_status text,
 new_status text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gramos_activity_village_time ON public.gramos_activity_log(village_id,created_at DESC);
CREATE INDEX IF NOT EXISTS gramos_activity_time ON public.gramos_activity_log(created_at DESC);
ALTER TABLE public.gramos_activity_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gramos_activity_log FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gramos_activity_log TO authenticated;
DROP POLICY IF EXISTS gramos_activity_read ON public.gramos_activity_log;
CREATE POLICY gramos_activity_read ON public.gramos_activity_log FOR SELECT TO authenticated
USING (app_private.is_platform_admin() OR (village_id IS NOT NULL AND app_private.can_edit_village(village_id)));

-- Trigger-owned audit records cannot be forged or modified from the browser.
CREATE OR REPLACE FUNCTION app_private.gramos_log_admin_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
DECLARE previous jsonb; current_row jsonb; row_data jsonb; village_uuid uuid; identifier text; safe_title text;
BEGIN
 previous := CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
 current_row := CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
 row_data := CASE WHEN TG_OP='DELETE' THEN previous ELSE current_row END;
 village_uuid := CASE WHEN TG_TABLE_NAME='villages' THEN (row_data->>'id')::uuid ELSE (row_data->>'village_id')::uuid END;
 identifier := coalesce(row_data->>'id', row_data->>'hostname',row_data->>'user_id',row_data->>'village_id','');
 safe_title := CASE TG_TABLE_NAME
   WHEN 'content_items' THEN left(coalesce(nullif(row_data->>'title_mr',''),nullif(row_data->>'title_en',''),row_data->>'kind','Content'),160)
   WHEN 'villages' THEN left(coalesce(nullif(row_data->>'name_mr',''),nullif(row_data->>'name_en',''),row_data->>'slug','Village'),160)
   WHEN 'village_clients' THEN 'Customer record'
   WHEN 'village_members' THEN 'Village staff permission'
   WHEN 'submissions' THEN 'Citizen submission'
   WHEN 'village_site_drafts' THEN 'Website draft'
   WHEN 'village_domains' THEN 'Village custom domain'
   ELSE 'Website change' END;
 IF TG_OP<>'UPDATE' OR previous IS DISTINCT FROM current_row THEN
   INSERT INTO public.gramos_activity_log(village_id,actor_id,actor_label,entity,entity_id,operation,title,old_status,new_status)
   VALUES(village_uuid,auth.uid(),coalesce((SELECT email FROM auth.users WHERE id=auth.uid()),'System'),TG_TABLE_NAME,identifier,TG_OP,safe_title,previous->>'status',current_row->>'status');
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $body$;
REVOKE ALL ON FUNCTION app_private.gramos_log_admin_change() FROM PUBLIC,anon,authenticated;

DO $triggers$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY['villages','content_items','submissions','village_members','village_clients','village_site_drafts','village_domains']) LOOP
   EXECUTE format('DROP TRIGGER IF EXISTS gramos_v5_audit ON public.%I',t);
   EXECUTE format('CREATE TRIGGER gramos_v5_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.gramos_log_admin_change()',t);
 END LOOP;
END $triggers$;

-- Transactional CSV import, with server-side RLS and strict validation.
-- All records start as draft; publishing is always a separate deliberate action.
CREATE OR REPLACE FUNCTION public.gramos_import_content_csv(p_village_id uuid,p_kind text,p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $body$
DECLARE item jsonb; item_slug text; i integer := 0; seen text[] := ARRAY[]::text[];
BEGIN
 IF auth.uid() IS NULL OR NOT app_private.can_edit_village(p_village_id) THEN
   RAISE EXCEPTION 'This village cannot be edited by your account' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.villages WHERE id=p_village_id) THEN
   RAISE EXCEPTION 'The village does not exist' USING ERRCODE='22023';
 END IF;
 IF p_kind NOT IN ('notices','schemes','gallery','news','projects','services') THEN
   RAISE EXCEPTION 'This kind does not support CSV import' USING ERRCODE='22023';
 END IF;
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)<1 OR jsonb_array_length(p_rows)>200 THEN
   RAISE EXCEPTION 'Upload between 1 and 200 records' USING ERRCODE='22023';
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
   i := i+1;
   IF jsonb_typeof(item)<>'object' THEN RAISE EXCEPTION 'Row %: invalid data',i; END IF;
   item_slug := trim(coalesce(item->>'slug',''));
   IF length(item_slug) NOT BETWEEN 2 AND 90 OR item_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
     RAISE EXCEPTION 'Row %: invalid short link',i; END IF;
   IF item_slug=ANY(seen) THEN RAISE EXCEPTION 'Row %: repeated short link',i; END IF;
   seen:=array_append(seen,item_slug);
   IF length(trim(coalesce(item->>'title_mr',''))) = 0 AND length(trim(coalesce(item->>'title_en',''))) = 0 THEN
     RAISE EXCEPTION 'Row %: title is missing',i; END IF;
   IF length(coalesce(item->>'title_mr',''))>250 OR length(coalesce(item->>'title_en',''))>250 OR
     length(coalesce(item->>'body_mr',''))>10000 OR length(coalesce(item->>'body_en',''))>10000 THEN
     RAISE EXCEPTION 'Row %: text is too long',i; END IF;
   IF coalesce(item->>'external_url','')<>'' AND (item->>'external_url') !~ '^https://[^[:space:]]+$' THEN
     RAISE EXCEPTION 'Row %: website link must use HTTPS',i; END IF;
   IF coalesce(item->>'image_url','')<>'' AND (item->>'image_url') !~ '^https://[^[:space:]]+$' THEN
     RAISE EXCEPTION 'Row %: photo link must use HTTPS',i; END IF;
   IF EXISTS (SELECT 1 FROM public.content_items WHERE village_id=p_village_id AND kind=p_kind AND slug=item_slug ) THEN
     RAISE EXCEPTION 'Row %: a record already uses this link',i; END IF;
   INSERT INTO public.content_items(village_id,kind,slug,title_mr,title_en,body_mr,body_en,image_url,external_url,sort_order,status,details)
   VALUES(p_village_id,p_kind,item_slug,coalesce(item->>'title_mr',''),coalesce(item->>'title_en',''),
     coalesce(item->>'body_mr',''),coalesce(item->>'body_en',''),coalesce(item->>'image_url',''),coalesce(item->>'external_url',''),
     CASE WHEN coalesce(item->>'sort_order','') ~ '^-?[0-9]{1,6}$' THEN (item->>'sort_order')::integer ELSE 0 END,
     'draft', '{}'::jsonb);
 END LOOP;
 RETURN i;
END $body$;
REVOKE ALL ON FUNCTION public.gramos_import_content_csv(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.gramos_import_content_csv(uuid,text,jsonb) TO authenticated;

-- Customer payment/contact information is commercial and belongs to Super Admin only.
DROP POLICY IF EXISTS gramos_clients_select_v49 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_insert_v49 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_update_v49 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_select_v5 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_insert_v5 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_update_v5 ON public.village_clients;
CREATE POLICY gramos_clients_select_v5 ON public.village_clients FOR SELECT TO authenticated USING(app_private.is_platform_admin());
CREATE POLICY gramos_clients_insert_v5 ON public.village_clients FOR INSERT TO authenticated WITH CHECK(app_private.is_platform_admin());
CREATE POLICY gramos_clients_update_v5 ON public.village_clients FOR UPDATE TO authenticated
USING(app_private.is_platform_admin()) WITH CHECK(app_private.is_platform_admin());

-- Removing a content item is a reversible update. Prevent accidental publication of trashed rows.
CREATE OR REPLACE FUNCTION app_private.gramos_guard_deleted_content()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF NEW.deleted_at IS NOT NULL AND NEW.status='published' THEN
   RAISE EXCEPTION 'Restore this item before publishing it';
 END IF;
 RETURN NEW;
END $body$;
DROP TRIGGER IF EXISTS gramos_v5_guard_deleted ON public.content_items;
CREATE TRIGGER gramos_v5_guard_deleted BEFORE INSERT OR UPDATE ON public.content_items
 FOR EACH ROW EXECUTE FUNCTION app_private.gramos_guard_deleted_content();
NOTIFY pgrst, 'reload schema';
COMMIT;

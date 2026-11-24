-- GramOS v5.0.1: add the staff identity to activity history (additive, no record deletion).
BEGIN;
DO $guard$ BEGIN
 IF to_regclass('public.gramos_activity_log') IS NULL OR to_regprocedure('app_private.gramos_log_admin_change()') IS NULL THEN
 RAISE EXCEPTION 'Apply the GramOS v5 admin migration first'; END IF;
END $guard$;
ALTER TABLE public.gramos_activity_log ADD COLUMN IF NOT EXISTS actor_label text NOT NULL DEFAULT 'System';
UPDATE public.gramos_activity_log l SET actor_label=coalesce((SELECT u.email FROM auth.users u WHERE u.id=l.actor_id),'System') WHERE actor_label='System' AND actor_id IS NOT NULL;
CREATE OR REPLACE FUNCTION app_private.gramos_log_admin_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
DECLARE previous jsonb;current_row jsonb;row_data jsonb;village_uuid uuid;identifier text;safe_title text;
BEGIN
 previous:=CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
 current_row:=CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
 row_data:=CASE WHEN TG_OP='DELETE' THEN previous ELSE current_row END;
 village_uuid:=CASE WHEN TG_TABLE_NAME='villages' THEN (row_data->>'id')::uuid ELSE (row_data->>'village_id')::uuid END;
 identifier:=coalesce(row_data->>'id',row_data->>'hostname',row_data->>'user_id',row_data->>'village_id','');
 safe_title:=CASE TG_TABLE_NAME
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
 VALUES(village_uuid,auth.uid(),coalesce((SELECT u.email FROM auth.users u WHERE u.id=auth.uid()),'System'),TG_TABLE_NAME,identifier,TG_OP,safe_title,previous->>'status',current_row->>'status');
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $body$;
REVOKE ALL ON FUNCTION app_private.gramos_log_admin_change() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;

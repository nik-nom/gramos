-- GramOS v4.9: additive, non-destructive migration for gramos-clean only.
-- Source of truth is Supabase; CSV/XLSX are fresh exports, NOT a mutable serverless file.
BEGIN;
DO $preflight$ BEGIN
 IF to_regclass('public.villages') IS NULL OR to_regclass('public.village_members') IS NULL
    OR to_regclass('public.platform_admins') IS NULL
    OR to_regprocedure('app_private.is_platform_admin()') IS NULL
    OR to_regprocedure('app_private.can_edit_village(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Wrong database schema for GramOS 4.9';
 END IF;
END $preflight$;

CREATE TABLE IF NOT EXISTS public.village_clients (
 village_id uuid PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
 customer_name text NOT NULL DEFAULT '' CHECK (length(customer_name)<=160),
 customer_email text NOT NULL DEFAULT '' CHECK (length(customer_email)<=254),
 customer_phone text NOT NULL DEFAULT '' CHECK (length(customer_phone)<=24),
 panchayat_name text NOT NULL DEFAULT '' CHECK (length(panchayat_name)<=160),
 gram_sevak_name text NOT NULL DEFAULT '' CHECK (length(gram_sevak_name)<=160),
 taluka text NOT NULL DEFAULT '' CHECK (length(taluka)<=120),
 district text NOT NULL DEFAULT '' CHECK (length(district)<=120),
 payment_received boolean,
 payment_notes text NOT NULL DEFAULT '' CHECK (length(payment_notes)<=2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS gramos_clients_updated_idx ON public.village_clients(updated_at DESC);
ALTER TABLE public.village_clients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.village_clients FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.village_clients TO authenticated;
DROP POLICY IF EXISTS gramos_clients_select_v49 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_insert_v49 ON public.village_clients;
DROP POLICY IF EXISTS gramos_clients_update_v49 ON public.village_clients;
CREATE POLICY gramos_clients_select_v49 ON public.village_clients FOR SELECT TO authenticated
 USING (app_private.can_edit_village(village_id));
CREATE POLICY gramos_clients_insert_v49 ON public.village_clients FOR INSERT TO authenticated
 WITH CHECK (app_private.can_edit_village(village_id));
CREATE POLICY gramos_clients_update_v49 ON public.village_clients FOR UPDATE TO authenticated
 USING (app_private.can_edit_village(village_id))
 WITH CHECK (app_private.can_edit_village(village_id));
-- Backfill existing villages without inventing customer, payment, or gram-sevak details.
INSERT INTO public.village_clients(village_id,panchayat_name,taluka,district)
 SELECT id,coalesce(nullif(name_mr,''),nullif(name_en,''),slug),
 coalesce(nullif(taluka_mr,''),nullif(taluka_en,''),''),
 coalesce(nullif(district_mr,''),nullif(district_en,''),'')
 FROM public.villages ON CONFLICT(village_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.gramos_create_village_customer(p_village jsonb,p_customer jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $function$
DECLARE v_id uuid; v_slug text; v_name text; v_email text;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT app_private.is_platform_admin() THEN
  RAISE EXCEPTION 'Super Admin access required' USING ERRCODE='42501';
 END IF;
 IF jsonb_typeof(p_village)<>'object' OR jsonb_typeof(p_customer)<>'object' THEN
  RAISE EXCEPTION 'Invalid village and customer records' USING ERRCODE='22023';
 END IF;
 v_slug=lower(trim(coalesce(p_village->>'slug','')));
 v_name=trim(coalesce(nullif(p_village->>'name_mr',''),p_village->>'name_en',''));
 v_email=lower(trim(coalesce(p_customer->>'customer_email','')));
 IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(v_slug) NOT BETWEEN 2 AND 64
   OR length(v_name) < 2 OR length(v_name)>160
   OR length(trim(coalesce(p_customer->>'customer_name','')))<2
   OR length(trim(coalesce(p_customer->>'gram_sevak_name','')))<2
   OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   OR length(v_email)>254
   OR length(trim(coalesce(p_customer->>'customer_phone','')))<7
   OR length(trim(coalesce(p_customer->>'taluka','')))<2
   OR length(trim(coalesce(p_customer->>'district','')))<2 THEN
  RAISE EXCEPTION 'Complete all required customer details first' USING ERRCODE='22023';
 END IF;
 INSERT INTO public.villages(slug,name_mr,name_en,taluka_mr,taluka_en,district_mr,district_en,
 phone,email,template_style,home_sections,site_settings,status)
 VALUES(v_slug,trim(coalesce(p_village->>'name_mr','')),trim(coalesce(p_village->>'name_en','')),
 trim(coalesce(p_village->>'taluka_mr','')),trim(coalesce(p_village->>'taluka_en','')),
 trim(coalesce(p_village->>'district_mr','')),trim(coalesce(p_village->>'district_en','')),
 trim(coalesce(p_customer->>'customer_phone','')),v_email,'classic',
 ARRAY['gallery_notice','leaders_schemes','services_video','news','projects','facilities']::text[],
 '{"template_key":"shamvadi-blue","template_version":22}'::jsonb,'draft')
 RETURNING id INTO v_id;
 INSERT INTO public.village_clients(village_id,customer_name,customer_email,customer_phone,
 panchayat_name,gram_sevak_name,taluka,district,payment_received,payment_notes,updated_by)
 VALUES(v_id,trim(p_customer->>'customer_name'),v_email,trim(p_customer->>'customer_phone'),
 coalesce(nullif(trim(p_customer->>'panchayat_name'),''),v_name),
 trim(p_customer->>'gram_sevak_name'),trim(p_customer->>'taluka'),trim(p_customer->>'district'),
 CASE WHEN p_customer->>'payment_received' IN ('true','false') THEN (p_customer->>'payment_received')::boolean ELSE NULL END,
 left(coalesce(p_customer->>'payment_notes',''),2000),auth.uid());
 RETURN v_id;
END $function$;
REVOKE ALL ON FUNCTION public.gramos_create_village_customer(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_create_village_customer(jsonb,jsonb) TO authenticated;

-- Alternative to CAPTCHA: an atomic, server-only IP limiter (6 submissions / hour / village).
CREATE TABLE IF NOT EXISTS public.gramos_form_rate_limits (
 village_id uuid NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
 ip_hash text NOT NULL,
 hour_bucket timestamptz NOT NULL,
 hits int NOT NULL DEFAULT 1 CHECK(hits BETWEEN 0 AND 10000),
 PRIMARY KEY (village_id,ip_hash,hour_bucket)
);
ALTER TABLE public.gramos_form_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gramos_form_rate_limits FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.gramos_form_rate_limits TO service_role;
CREATE OR REPLACE FUNCTION public.gramos_check_form_rate_v49(p_village_id uuid,p_ip_hash text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_hits int;
BEGIN
 IF length(p_ip_hash)<>64 OR p_ip_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
 INSERT INTO public.gramos_form_rate_limits(village_id,ip_hash,hour_bucket,hits)
 VALUES(p_village_id,p_ip_hash,date_trunc('hour',now()),1)
 ON CONFLICT(village_id,ip_hash,hour_bucket) DO UPDATE SET hits=public.gramos_form_rate_limits.hits+1
 RETURNING hits INTO v_hits;
 RETURN v_hits<=6;
END $function$;
REVOKE ALL ON FUNCTION public.gramos_check_form_rate_v49(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_check_form_rate_v49(uuid,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;

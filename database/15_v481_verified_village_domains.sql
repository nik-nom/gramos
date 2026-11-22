-- GramOS clean / Node.js PUBLIC DOMAIN ROUTING. Safe additive migration.
-- No existing village/content/credential changes; all new domains start PENDING.
BEGIN;
DO $preflight$ BEGIN
 IF to_regclass('public.villages') IS NULL OR to_regclass('public.platform_admins') IS NULL THEN
  RAISE EXCEPTION 'This migration is only for the GramOS clean project.';
 END IF;
END $preflight$;
CREATE TABLE IF NOT EXISTS public.village_domains(
 hostname text PRIMARY KEY,
 village_id uuid NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
 verified_at timestamptz,
 last_checked_at timestamptz,
 vercel_details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT gramos_domain_hostname_check CHECK (
  length(hostname) BETWEEN 4 AND 253 AND
  hostname ~ '^[a-z0-9]+([a-z0-9.-]*[a-z0-9])?$' AND
  hostname LIKE '%.%' AND hostname NOT LIKE '%.vercel.app' AND hostname NOT LIKE '%.supabase.co'
 )
);
CREATE UNIQUE INDEX IF NOT EXISTS gramos_one_active_domain_per_village ON public.village_domains(village_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS gramos_village_domain_index ON public.village_domains(village_id,status);
ALTER TABLE public.village_domains ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.village_domains FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.village_domains TO anon,authenticated;
DROP POLICY IF EXISTS gramos_domain_active_public ON public.village_domains;
CREATE POLICY gramos_domain_active_public ON public.village_domains FOR SELECT TO anon,authenticated
 USING(status='active' AND verified_at IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.villages v WHERE v.id=village_id AND v.status='published'));

-- Called only by the server after a fresh Vercel project-domain + DNS check.
CREATE OR REPLACE FUNCTION public.gramos_activate_verified_domain(p_village_id uuid,p_hostname text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE domain_status text;
BEGIN
 PERFORM 1 FROM public.villages WHERE id=p_village_id AND status='published' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'The village must be published'; END IF;
 SELECT status INTO domain_status FROM public.village_domains
 WHERE hostname=p_hostname AND village_id=p_village_id AND verified_at>=now()-interval '10 minutes' AND last_checked_at>=now()-interval '10 minutes' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Recent domain and DNS verification required'; END IF;
 UPDATE public.village_domains SET status='disabled',updated_at=now()
 WHERE village_id=p_village_id AND status='active' AND hostname<>p_hostname;
 UPDATE public.village_domains SET status='active',updated_at=now()
 WHERE hostname=p_hostname AND village_id=p_village_id;
 RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION public.gramos_activate_verified_domain(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_activate_verified_domain(uuid,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;

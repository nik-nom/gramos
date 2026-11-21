-- GramOS Next.js (legacy gramos-platform) domain activation migration.
-- Based on live read-only inspection, 21 Nov 2026: public.village_sites,
-- public.village_domains(hostname PK,site_id FK), public.site_pages(path,is_published).
-- Do NOT apply to gramos-clean: it uses public.villages and a DIFFERENT schema.
-- STAGING FIRST. No existing domain is automatically activated.
BEGIN;
DO $preflight$
BEGIN
 IF to_regclass('public.village_sites') IS NULL OR to_regclass('public.village_domains') IS NULL
    OR to_regclass('public.site_pages') IS NULL THEN
    RAISE EXCEPTION 'Not the legacy GramOS platform schema; no changes made.';
 END IF;
 IF to_regprocedure('public.is_platform_admin()') IS NULL
    OR to_regprocedure('public.gramos_has_mfa_v13()') IS NULL THEN
    RAISE EXCEPTION 'Expected MFA and platform authorization functions are missing.';
 END IF;
END $preflight$;

ALTER TABLE public.village_domains
 ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
 ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS redirect_to text,
 ADD COLUMN IF NOT EXISTS verified_at timestamptz,
 ADD COLUMN IF NOT EXISTS dns_verified_at timestamptz,
 ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
 ADD COLUMN IF NOT EXISTS activated_at timestamptz,
 ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS verification_details jsonb NOT NULL DEFAULT '{}'::jsonb,
 ADD COLUMN IF NOT EXISTS last_error text;
DO $constraints$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.village_domains'::regclass AND conname='gramos_domain_status_check') THEN
  ALTER TABLE public.village_domains ADD CONSTRAINT gramos_domain_status_check CHECK (status IN ('pending','active','redirect','removing','removed'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.village_domains'::regclass AND conname='gramos_domain_redirect_check') THEN
  ALTER TABLE public.village_domains ADD CONSTRAINT gramos_domain_redirect_check CHECK (
   (status='redirect' AND redirect_to IS NOT NULL AND redirect_to<>hostname) OR
   (status<>'redirect' AND redirect_to IS NULL)
  );
 END IF;
END $constraints$;
CREATE UNIQUE INDEX IF NOT EXISTS gramos_one_primary_domain_per_site
 ON public.village_domains(site_id) WHERE status='active' AND is_primary=true;
CREATE INDEX IF NOT EXISTS gramos_domain_lookup_active
 ON public.village_domains(hostname,site_id) WHERE status IN ('active','redirect');

-- Existing (unverified) records default to pending. Never bulk mark them active.
-- Remove the previous public policy that disclosed unverified host->village maps.
ALTER TABLE public.village_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Domains of published sites are visible" ON public.village_domains;
DROP POLICY IF EXISTS platform_admin_read_domains ON public.village_domains;
DROP POLICY IF EXISTS gramos_domain_public_verified ON public.village_domains;
DROP POLICY IF EXISTS gramos_domain_admin_read ON public.village_domains;
CREATE POLICY gramos_domain_public_verified ON public.village_domains FOR SELECT TO anon,authenticated
 USING (
  status IN ('active','redirect') AND verified_at IS NOT NULL AND dns_verified_at IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.village_sites vs WHERE vs.id=site_id AND vs.published=true AND vs.archived_at IS NULL)
 );
CREATE POLICY gramos_domain_admin_read ON public.village_domains FOR SELECT TO authenticated
 USING ((SELECT public.gramos_has_mfa_v13()) AND (SELECT public.is_platform_admin()));
GRANT SELECT ON public.village_domains TO anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.village_domains FROM PUBLIC,anon,authenticated;

-- Important: older SECURITY DEFINER RPC could reassign an existing hostname without
-- proving domain ownership. Do not drop history, but make old mutating RPCs inaccessible.
REVOKE ALL ON FUNCTION public.register_village_domain(uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.remove_village_domain(text) FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.village_domain_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 site_id uuid NOT NULL REFERENCES public.village_sites(id) ON DELETE CASCADE,
 hostname text NOT NULL,
 actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 action text NOT NULL CHECK (action IN ('register','check','activate','rollback','remove')),
 notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gramos_domain_events_site_at ON public.village_domain_events(site_id,created_at DESC);
ALTER TABLE public.village_domain_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gramos_domain_events_admin_read ON public.village_domain_events;
CREATE POLICY gramos_domain_events_admin_read ON public.village_domain_events FOR SELECT TO authenticated
 USING ((SELECT public.gramos_has_mfa_v13()) AND (SELECT public.is_platform_admin()));
REVOKE ALL ON public.village_domain_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.village_domain_events TO authenticated;
GRANT SELECT,INSERT ON public.village_domain_events TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.village_domain_events_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.gramos_activate_domain_v1(
 p_site_id uuid,p_hostname text,p_redirect_previous boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_target public.village_domains%ROWTYPE; v_time timestamptz:=now();
BEGIN
 -- The function is callable only using the server's service_role (see REVOKE below).
 -- Row lock on village serializes competing activations for the same site.
 PERFORM 1 FROM public.village_sites
  WHERE id=p_site_id AND published=true AND archived_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Village must be published and not archived'; END IF;
 SELECT * INTO v_target FROM public.village_domains
   WHERE hostname=p_hostname AND site_id=p_site_id FOR UPDATE;
 IF NOT FOUND OR v_target.status IN ('removed','removing') THEN
  RAISE EXCEPTION 'Domain not registered to this village';
 END IF;
 IF v_target.verified_at IS NULL OR v_target.dns_verified_at IS NULL
    OR v_target.verified_at < v_time-interval '10 minutes'
    OR v_target.dns_verified_at < v_time-interval '10 minutes' THEN
   RAISE EXCEPTION 'Recent Vercel ownership and DNS verification required';
 END IF;
 -- Preserve prior verified domains for reversible domain changes.
 UPDATE public.village_domains
    SET status=CASE WHEN p_redirect_previous THEN 'redirect' ELSE 'pending' END,
        redirect_to=CASE WHEN p_redirect_previous THEN p_hostname ELSE NULL END,
        is_primary=false,updated_at=v_time
  WHERE site_id=p_site_id AND status='active' AND hostname<>p_hostname;
 UPDATE public.village_domains
    SET status='active',is_primary=true,redirect_to=NULL,activated_at=v_time,updated_at=v_time
  WHERE hostname=p_hostname AND site_id=p_site_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public.gramos_activate_domain_v1(uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gramos_activate_domain_v1(uuid,text,boolean) TO service_role;

-- Existing ownership and content tables are untouched.
NOTIFY pgrst,'reload schema';
COMMIT;

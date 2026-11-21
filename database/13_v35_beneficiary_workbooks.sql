-- GramOS v3.5: editable beneficiary lists + private Excel downloads.
-- Already applied to gramos-clean on 2026-11-21. Do not re-run there.
BEGIN;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check CHECK (kind IN (
 'about_sections','about_facts','about_facilities','about_blocks','committee_groups','committees','duties',
 'banners','gallery','notices','services','service_steps','service_forms','service_links','videos',
 'news','projects','metrics','schemes','leaders','officials','facilities','pages','page_elements','beneficiary_lists'));
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('beneficiary-files','beneficiary-files',false,5242880,ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS gramos_beneficiary_files_editor_upload ON storage.objects;
CREATE POLICY gramos_beneficiary_files_editor_upload ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='beneficiary-files' AND name ~* '^[a-f0-9-]{36}/[a-f0-9-]{36}\.xlsx$'
AND app_private.can_edit_village(split_part(name,'/',1)::uuid));
COMMIT;

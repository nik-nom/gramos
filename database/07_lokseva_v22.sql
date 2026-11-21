-- GramOS v2.2 – apply ONCE to the existing gramos-clean database.
-- Adds editable Lokseva application steps / public downloadable forms.
-- No village or admin account is modified.
BEGIN;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_kind_check;
ALTER TABLE public.content_items ADD CONSTRAINT content_items_kind_check
  CHECK (kind IN (
    'about_sections','about_facts','about_facilities','about_blocks',
    'committee_groups','committees','duties',
    'banners','gallery','notices','services','service_steps','service_forms','videos',
    'news','projects','metrics','schemes','leaders','officials','facilities','pages'
  ));

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('service-documents','service-documents',true,5242880,ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Public form downloads. Citizen submissions do not use this bucket.
CREATE POLICY "gramos_service_docs_public_read_v22" ON storage.objects
FOR SELECT TO anon,authenticated USING (bucket_id='service-documents');

-- All uploaded documents MUST reside under <village UUID>/filename.pdf.
CREATE POLICY "gramos_service_docs_editor_upload_v22" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id='service-documents' AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id::text = (storage.foldername(name))[1]
    AND app_private.can_edit_village(v.id)
  )
);
CREATE POLICY "gramos_service_docs_editor_delete_v22" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id='service-documents' AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id::text = (storage.foldername(name))[1]
    AND app_private.can_edit_village(v.id)
  )
);
COMMIT;

# v3.2 metadata: no SQL migration required

`villages.site_settings` is already JSONB (from `02_shamvadi_blue_fields.sql`).
New fields are stored under `site_settings.seo.home`, `.about`, `.services`, `.projects`, `.schemes`, `.notices`, `.news`, `.gallery`, `.contact`, `.staff`, `.leaders`, `.facilities`, `.pages`, with `{title,description,keywords,image_url,noindex}`.
Admin saves update only the selected village row using its existing RLS policy. Do not recreate the database.

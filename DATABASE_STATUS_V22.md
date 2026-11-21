# GramOS v2.2 database status

Connected existing project: `gramos-clean` (`nttnrfyidokwnkqrukdb`). The user requested the existing project to be preserved.

Earlier in this work the migration `lokseva_editable_documents_v22` was successfully applied to the connected project and verified. Its source is `database/07_lokseva_v22.sql`:
- `content_items.kind` admits `service_steps` and `service_forms`, preserving all earlier kinds.
- New `service-documents` public PDF bucket with per-village editor INSERT and DELETE policies, plus public read.
- Existing `villages`, `content_items`, `platform_admins` and authentication information remain untouched.

For this final UI parity update, **no further SQL changes are required** and no existing data has been removed. Do not run `01_setup.sql` on a populated project.

Real village pages require real village content records marked `published`. The demo sample data is hardcoded only for `/demo`; it is not inserted into the database as if it were official information.

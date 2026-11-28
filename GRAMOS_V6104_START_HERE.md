# GramOS v6.10.4 — Photo editing and custom domains

Incremental update for v6.10.3. No database migration, public template changes, or new dependency. Apply in the existing repository root. Preserve your deployment environment variables and custom changes.

## Update

```sh
unzip -o ~/Downloads/GramOS_v6_10_4_Photos_and_Domains.zip
node tests/v6104-photos-domains.mjs
git add --pathspec-from-file=GRAMOS_V6_10_4_CHANGED_FILES.txt
git commit -m "GramOS v6.10.4 photo editing and custom domains"
git push origin main
```

## Photos

Open GramOS admin → select village → Change photos (फोटो बदला). Select a photo category, then choose an existing item or a template slot. Upload JPG, PNG or WebP, review the preview, and use Save & publish (or save as draft). Existing storage compression and per-village paths are retained. The form prevents saving while the upload is pending. Use Settings / Header logo / Footer logos for logo images. Only village editors/owners and Super Admins can edit; complaint-only reviewer accounts remain read-only. Super Admin can assign a trusted staff member the existing editor role if they need editing access. Uploaded image files are public; don't upload confidential documents.

## Custom domain (.com / .in / other full domains)

Super Admin → village → Change website URL → enter an owned domain, e.g. village.com (example only) → Connect domain. Admin project must have server environment variables VERCEL_API_TOKEN, VERCEL_PUBLIC_PROJECT_ID (public project ID), optional VERCEL_TEAM_ID and existing Supabase server config. The form displays provider-returned recommended A/CNAME and ownership TXT values where available. Configure those exact values with the domain's DNS provider; if unavailable, open the public project's Domains tab on Vercel. Use @ for root if the registrar requires it. Preserve email MX records. Click Verify & activate after DNS propagates. GramOS only activates a published village after project membership, ownership and DNS checks pass. Previous active village domain is retained while a replacement is pending; activation follows the existing single-active-domain database rule. www is a distinct hostname; this update does not automatically create a www alias or redirect. No domain purchase, DNS changes or live deployment have been performed.

## Verification

All 11 local Node test scripts passed after applying the archived updates through v6.10.3 plus this patch. Tests use mock providers and source checks; browser uploads, production Vercel DNS and live deployment were not tested. The new DNS panel falls back to Vercel when recommendations cannot be retrieved.

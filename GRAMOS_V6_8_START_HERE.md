# GramOS v6.8 — Published sample images and editable media

Cumulative content-only update over v6.5.1 admin recovery / v6.7. Do not replace your repo. Does not include API, Vercel configuration, config.js, login code, database migrations or credentials.

Published and preview pages show clearly marked reference photographs and a sample logo where no village media exists. These are not actual village records. An uploaded image takes precedence. Named real records without an uploaded photo use a neutral silhouette rather than a different person's portrait. Existing images stay intact. Verify permission to use the sample photographs and remove/replace them with approved village media as appropriate.

Admin: select village > Homepage > Banner slides, Ministers, Village officials or Gallery. Click Edit on the built-in slot or a saved record, upload image, enter correct name/role if applicable, and Save & publish. Header logo is under Settings > Header logo. About uses the same village officials records, so upload once. Drafts remain private; the village itself must be published.

PDF links use readable filenames; bundled downloads use Marathi titles. The 29-page GR is titled मुख्यमंत्री समृद्धी योजने GR under Notice Board > RTI > Reference documents; the filename identifies the actual campaign and GR date. The original PDF contents are unchanged. Both RTI-specific orders still require the matching documents. Single Lokseva form retained; alternative duplicate omitted. Older PDF filenames retained for compatibility.

Tests: node tests/v68-media-pdf.mjs covers mock upload/save/replacement, published and preview rendering, shared Home/About/Gallery, logo/banner and PDF hashes. v63 and v64 regression checks passed on reconstructed source. No live authentication, database or Vercel testing.

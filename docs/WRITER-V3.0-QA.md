# Writer V3.0 — QA checklist

## Automated checks
- [ ] JavaScript syntax checks pass for app.js, collaboration.js, supabase-auth.js.
- [ ] HTML IDs are unique.
- [ ] Literal DOM IDs referenced by app.js and collaboration.js exist in index.html.
- [ ] Backup controls exist and replacement restore requests a pre-restore safety download.
- [ ] Canceling the safety-copy confirmation leaves the current document set unchanged.
- [ ] V3.0 controls and script cache-busting versions are present.

## Manual browser checks (required before production)
- [ ] Open Writer on Android Chrome and desktop Chrome/Firefox.
- [ ] Create, rename, duplicate, save, close and reopen a document.
- [ ] Confirm old local documents remain present and readable.
- [ ] Export a full JSON backup, test merge restore, then test replace restore only with a separate disposable profile and verify the pre-restore backup file.
- [ ] Change zoom through all available values and reload the page.
- [ ] Enter focus mode, confirm side panel and Ribbon are hidden, then exit.
- [ ] Test undo/redo, find/replace, tables, images, page setup and TOC.
- [ ] Export DOCX, HTML and TXT; print to PDF and reopen exported files.
- [ ] Test offline launch after first successful load.
- [ ] Test account, cloud save, sharing, permission revocation and concurrent edit only after Supabase schema, RLS and credentials are configured.
- [ ] Confirm service-worker update replaces the previous V2 cache.

## Release gate
Do not label V3.0 production-ready until automated checks and manual browser checks pass. Keep V2.10 data intact and maintain a restorable backup before any schema migration.

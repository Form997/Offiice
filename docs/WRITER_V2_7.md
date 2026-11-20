# HAI ĐẤT OFFICE — Writer V2.7 / Supabase setup

## What V2.7 adds
- Supabase Auth bootstrap: sign up, sign in, sign out, password-reset email.
- SQL schema for owned documents, user/group permissions, access requests, comments and audit records.
- Row Level Security policies: document ID alone never grants access; owner-only permission grants/revokes; server-side checks for read/comment/edit/copy/download.
- Browser config contains placeholders only. Local Writer remains usable when Supabase is not configured.

## Required one-time setup
1. Create a Supabase project.
2. In Supabase Dashboard → SQL Editor, run `supabase/migrations/202611170001_writer_collaboration.sql`.
3. Copy the Project URL and publishable/anon key from Project Settings → API.
4. Edit `writer/supabase-config.js`: set `url` and `anonKey`. The anon/publishable key is designed for client use; never put a `service_role` or secret key in GitHub/browser code.
5. In Authentication → URL Configuration, add the deployed Writer URL to Site URL / Redirect URLs, e.g. `https://form997.github.io/Offiice/writer/`.
6. Verify email signup, login, logout and password-reset email.

## Important current boundary
V2.7 does NOT yet upload local documents or switch the editor to cloud storage. Login only establishes identity. The local document list remains in this browser. The schema/RLS is the secure foundation for the next cloud-sync and sharing UI milestone. The full owner-facing permission checkbox manager, request inbox, group administration screens and cloud document sync are not yet connected in this release. Do not tell users that cross-device sharing works until cloud sync and ACL integration are implemented and tested.

## Permission semantics
- `can_read`: read content.
- `can_comment`: add comments, requires read.
- `can_edit`: change document, requires read.
- `can_copy`: create a new independent document with a new HDW ID, requires read.
- `can_download`: download/export source content, requires read.
- Direct user grants and group grants are evaluated at request time. Removing a member removes inherited access on the next server request.
- Only the document owner can grant, modify or revoke permissions.
- `can_copy` and `can_download` gate the app's built-in copy/export operations. A person who can read content can still capture it manually (screenshots, retyping, browser tools); software cannot revoke information already seen.
- Offline copies already downloaded cannot be remotely revoked.

## QA checklist
- [ ] No project credentials configured: local Writer still starts and status says local-only.
- [ ] Valid URL + anon key: auth controls activate.
- [ ] Sign up requires 8+ character password; confirmation email follows project settings.
- [ ] Sign in/out updates account status.
- [ ] Password reset sends email flow.
- [ ] SQL migration runs without errors.
- [ ] Test with two accounts: no access by ID alone; owner-only ACL changes; read-only cannot update; revoked/group-removed access fails on next request.

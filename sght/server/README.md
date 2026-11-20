# SGHT Authentication API — server deployment contract (18.41)

This repository currently hosts a static GitHub Pages frontend. **No authentication backend is deployed by this commit.** The browser client fails closed until an HTTPS API base URL is configured in the `sght-auth-api` meta tag. Do not point it at an unreviewed service.

## Required API

All responses are JSON. Browser requests use `credentials: include`; authentication cookies are server-issued, HttpOnly, Secure, SameSite=Lax or Strict, scoped to the auth host/path, short-lived and rotated. Never return bearer tokens to JavaScript or persist credentials/session roles in localStorage.

- `GET /v1/auth/csrf` → `{ "csrfToken": "..." }`; set/refresh CSRF cookie/token.
- `POST /v1/auth/login` + CSRF → `{ "user": { "id", "email", "displayName", "role", "status" } }`; rate-limit by account and source; generic invalid-credential response.
- `GET /v1/auth/me` → authenticated user object; verify session server-side on every request.
- `POST /v1/auth/logout` + CSRF → revoke session server-side and clear cookie.
- `POST /v1/admin/users` + CSRF → create invitation, not arbitrary password assignment; require `users.manage`.
- `GET /v1/admin/users` → admin-only list.
- `PATCH /v1/admin/users/{id}` + CSRF → admin-only role/status update; prevent privilege escalation and last-admin lockout.
- `GET /v1/admin/audit` → admin-only export, with pagination and audit event filtering.

## Server-side authorization matrix

The API must derive actor identity and role exclusively from the validated server session, never from request JSON, headers supplied by the client, localStorage, or a client-side role value.

| Role | Allowed server permissions |
|---|---|
| admin | all permissions |
| signer | workbook read/edit/export, formula manage, macro run, signature create/verify, audit read |
| auditor | workbook read/export, signature verify, audit read/export |
| viewer | workbook read, signature verify |

Enforce permission checks in each server route and again in the workbook/document service layer. Deny by default. Return 401 for missing/expired session and 403 for authenticated but unauthorized actions. Re-check user status and role on every request; revoke sessions when password, role, or status changes. Use CSRF protection for cookie-authenticated state-changing requests, strict CORS allowlist, Origin/Referer validation, input validation, output minimization, TLS, security headers, request size limits, rate limits, and structured security logs. Do not expose password hashes, session IDs, CSRF secrets, private signing keys, or internal stack traces.

## Minimum persistence model

- `users(id, email_normalized UNIQUE, display_name, password_hash, password_salt, password_algorithm, role, status, created_at, updated_at)`
- `sessions(id_hash UNIQUE, user_id FK, csrf_secret_hash, expires_at, created_at, last_seen_at, revoked_at)`
- `invitations(id_hash UNIQUE, email_normalized, role, expires_at, consumed_at, created_by)`
- `audit_events(id, actor_user_id, target_user_id, action, metadata_json, created_at, request_id)`

Store only a hash of opaque session IDs in the database. Use Argon2id for production password hashing (or a reviewed platform identity provider); the browser-side PBKDF2 module from 18.40 is not the production password authority. Use database transactions for role/status changes and audit writes. Protect the first-admin bootstrap with a one-time deployment secret or out-of-band operator procedure, never "first visitor becomes admin".

## Deployment gate

Before enabling the meta tag, deploy and independently security-review the API, configure TLS, database backups, secrets management, CORS/CSRF origins, rate limiting, monitoring, recovery procedures, and a first-admin bootstrap. Add integration tests for 401/403, CSRF failure, session expiry/revocation, role changes, disabled accounts, IDOR, concurrent last-admin protection, audit persistence, and cross-origin rejection. GitHub Pages alone cannot host this API.

## Honest status

18.41 delivers the browser API client, fail-closed UI wiring, tests, and server contract. It does **not** deploy or claim a functioning authentication server, production sessions, or server-enforced workbook permissions.


## Client session hardening — 18.42

The browser API client now applies a 15-second default request deadline (configurable from 1–60 seconds), sends an AbortSignal, disables HTTP caching, rejects redirects, and maps network/timeout failures to bounded user-facing errors without exposing raw transport details. API paths and HTTP methods are allowlisted; the client accepts only the documented authentication/admin routes.

CSRF tokens are held in memory only. Concurrent token acquisition is coalesced. A mutation is retried exactly once only when the server returns HTTP 403 with `CSRF_INVALID` or `CSRF_EXPIRED`; the server MUST validate CSRF before executing any mutation and MUST use those codes only for rejected, unapplied requests. Generic 403 responses are never retried. HTTP 401 clears the cached CSRF token. Logout always clears the client-side token hint.

The client validates the returned role against the four known roles and rejects disabled accounts. This validation is a user-interface safeguard, **not authorization**. The server must still validate the session, user status, role, and permission on every request and in the workbook service layer.

New API-client tests cover route/method allowlisting, CSRF refresh, no retry on generic 403, 401 invalidation, disabled/unknown-role responses, malformed CSRF, and safe network errors.

### Remaining deployment blockers

18.42 does not create or deploy the authentication server. GitHub Pages remains static, the API URL meta tag remains blank, and login stays disabled until a separately deployed and reviewed HTTPS backend exists. No production database, hosted session service, Argon2id password hashing, email provider deployment, or live API integration test is included. MFA routes and TOTP logic are implemented in stage 18.48 but remain unavailable until the API is deployed with the required encryption key. Do not treat client-side checks as a security boundary.


## 18.43 — Backend API foundation (Node.js + PostgreSQL)

This stage adds a runnable backend reference implementation under this directory:

- `server.mjs`: HTTP API for CSRF, login, current session, logout, invitations, admin user listing/update, and audit listing.
- `schema.sql`: PostgreSQL tables and indexes for users, hashed sessions, invitations, and audit events.
- `bootstrap-admin.mjs`: one-time administrator bootstrap from private environment variables; it refuses to create another active administrator.
- `start.mjs`: runtime entry point; requires a database URL and the exact frontend origin.
- `package.json`: isolated server package using Node.js 22+ and the `pg` driver.

### Local setup

1. Provision PostgreSQL and apply `schema.sql` using a database migration/operator account.
2. In a private server environment set `DATABASE_URL`, `SGHT_ALLOWED_ORIGIN` (the exact HTTPS frontend origin, no path), `SGHT_ADMIN_EMAIL`, and `SGHT_ADMIN_PASSWORD` (at least 16 characters for the initial bootstrap).
3. From this directory run `npm install`, then `npm run bootstrap` exactly once, remove bootstrap credentials from the environment, and run `npm start`.
4. Put the service behind a TLS-terminating reverse proxy with request-size limits, connection limits, monitoring, backups, and network-level rate limiting. Configure the frontend API URL only after a security review and integration tests.

The bootstrap password is derived with Node scrypt and a random salt. Session IDs are random opaque values; only SHA-256 digests are stored. Session cookies are HttpOnly, Secure, SameSite=Lax; CSRF uses a separate SameSite=Strict cookie plus a required header and exact Origin check. Login has a basic per-process throttle. Admin role/status changes revoke the target's active sessions and are recorded in the audit table; a transaction prevents demoting/disabling the last active administrator.

### Important security and completeness limits

**This is a development foundation, not yet a production-certified identity service.** The current implementation still needs independent security review and integration testing. In particular:

- Login throttling is in-memory and per process; use a shared gateway/WAF or distributed limiter before production. Account-level lockout, MFA, email verification, password reset and invitation redemption are not implemented. Invitation creation is persisted, but no email delivery or consume endpoint exists yet.
- Password hashing currently uses Node scrypt, not Argon2id. Evaluate a maintained Argon2id implementation or a managed identity provider before production.
- CSRF uses a double-submit cookie plus exact Origin checking. The schema has a CSRF digest field reserved for stronger session-bound validation; that binding is not yet enforced.
- Session expiry is fixed at eight hours; there is no refresh/idle timeout, device/session management UI, or periodic cleanup job.
- The API currently implements admin endpoints and authentication only. SGHT workbook reads/writes, formula operations, macros, signatures and exports are **not** routed through a server-side authorization service. Client role checks remain presentation only.
- CORS requires an exact Origin when one is supplied; mutation routes require the exact Origin header. Deploy only same-site or carefully configured cross-origin cookie environments.
- No live PostgreSQL, reverse-proxy, browser, or mobile integration test has been run in this repository environment. GitHub Pages remains static and does not host this API.

Do not expose this service publicly or set the frontend API meta tag until the missing controls are completed, dependencies audited, migrations tested, and the full security gate signed off.


## 18.44 — Account lifecycle endpoints

The backend reference implementation now includes:

- Invitation acceptance: a one-time random token is stored only as SHA-256, expires after 24 hours, is consumed transactionally, and creates the account only once. Password length is checked (12–256 characters); the password is scrypt-hashed with a random salt. Duplicate accounts and invalid/expired/replayed tokens are rejected.
- Password reset: generic request response to avoid account enumeration; one-time token expires after 30 minutes. Successful reset updates the password and revokes all active sessions and outstanding reset tokens in one transaction.
- Session management: authenticated users can list only their own active sessions and revoke a selected session by its public UUID. Raw session cookie IDs and stored SHA-256 digests are never returned.
- Audit events are written for invitation acceptance and password reset.

### Token delivery gate — important

No email provider is configured in this repository. To prevent unusable invitations, POST /v1/admin/users returns 503 TOKEN_DELIVERY_NOT_CONFIGURED unless SGHT_TOKEN_DELIVERY_MODE=development is set. In development mode only, the response includes developmentToken; never enable this mode on a public/production service. Password-reset requests always return the same public response; a development token is included only for an existing active account when the same development mode is enabled. Production email/SMS delivery, verified callback handling, and secret management remain unimplemented. The server does not log raw tokens.

### Database migration

Reapply schema.sql to an existing 18.43 database. Additive ALTER TABLE ... ADD COLUMN IF NOT EXISTS statements create the session public ID and invitation token hash without dropping existing data. The script also creates sght_password_resets.

### API routes added

- POST /v1/auth/invitations/accept + CSRF: { token, password }.
- POST /v1/auth/password-reset/request + CSRF: { email }; generic response.
- POST /v1/auth/password-reset/complete + CSRF: { token, password }.
- GET /v1/auth/sessions: current user's active sessions only.
- DELETE /v1/auth/sessions/{publicSessionId} + CSRF: revokes only a session owned by the caller.

### Remaining security limitations

The existing scrypt password verifier is retained; Argon2id migration is still required before production. Rate limiting remains in-memory/per-process and is not distributed. No email provider, MFA, email verification, password-change notification, idle timeout, session device fingerprint, or live PostgreSQL integration tests are included. The development token mode is for local testing only. The backend remains undeployed; GitHub Pages remains static; workbook, formula, macro, signature, and export data routes are not yet protected by server authorization. Obtain an independent security review before exposing this API.


## 18.45 — SMTP email delivery and verified account lifecycle

The API now supports SMTP delivery through Nodemailer. Configure these environment variables in the backend deployment secret manager (never commit credentials):

- SMTP_HOST, SMTP_PORT
- SGHT_MAIL_FROM
- SGHT_PUBLIC_APP_URL: HTTPS base URL of the static application, e.g. https://form997.github.io/Offiice (without query or fragment)
- Optional SMTP authentication: both SMTP_USER and SMTP_PASSWORD
- Optional SMTP_SECURE=true; port 465 defaults to implicit TLS, while other ports require STARTTLS. TLS minimum is 1.2.

The server verifies the SMTP transport at startup. If SMTP variables are absent, the API starts without email delivery; invitation creation returns 503, while password-reset and email-verification request routes return generic responses and do not disclose whether an account exists. If SMTP is partially configured or transport verification fails, startup fails closed. Configure a trusted provider or private authenticated relay only.

### Email and token flow

- Admin invitation: generate a 256-bit random token, store only SHA-256, expiry 24 hours, send the link by email. API response contains invitation metadata and delivery status only—never the raw token. Failed delivery deletes the still-pending invitation.
- Email verification: invitation acceptance proves mailbox possession and sets email_verified_at. Existing unverified accounts can request a 30-minute verification link. Completion consumes the one-time token in a transaction and records an audit event. Login is denied until the email is verified. The bootstrap administrator is marked verified because creation is an operator-controlled out-of-band action.
- Password reset: only verified active accounts qualify. A 30-minute one-time token is stored hashed and sent by email. The public response is the same for unknown, disabled, unverified, or eligible accounts. Failed delivery deletes the pending reset token; successful reset revokes active sessions as specified in 18.44.
- Links place the token in the URL fragment (#invite=, #verify=, #reset=) so browsers do not send it in the initial HTTP request, Referer header, or ordinary web-server access logs. The frontend must read the fragment and POST the token to the corresponding API endpoint; never put it in query parameters or analytics.
- Added API client methods for invitation acceptance, email verification, password reset, session listing and session revocation.

### Routes added or now wired to email

- POST /v1/auth/email-verification/request + CSRF: { email }; generic response.
- POST /v1/auth/email-verification/complete + CSRF: { token }.
- POST /v1/auth/invitations/accept + CSRF: { token, password }.
- POST /v1/auth/password-reset/request + CSRF: { email }; generic response.
- POST /v1/auth/password-reset/complete + CSRF: { token, password }.
- Existing admin invitation and session routes now use the secure delivery/client path.

### Deployment and security limits

GitHub Pages remains static and does not run SMTP or the Node/PostgreSQL API. The email provider, domain SPF/DKIM/DMARC, secrets manager, DNS, HTTPS API hosting, database and frontend fragment-handling UI must be configured separately. The API client exposes the routes, but the current spreadsheet UI does not yet provide complete invitation/verification/reset screens; that UI integration is a subsequent stage. Automated CI on 20 Nov 2026: 331/331 SGHT tests and 3/3 mailer tests passed; GitHub Pages deployment succeeded. No real email delivery or PostgreSQL integration was performed in CI. Rate limiting is still per-process; add a shared distributed limiter before public deployment. Existing scrypt password hashing remains pending Argon2id/provider migration. Do not enable a public service until an independent security review is complete.

## 18.48 — MFA/TOTP deployment requirements

Before enabling MFA, provision a high-entropy secret manager value named `SGHT_MFA_ENCRYPTION_KEY` with at least 32 UTF-8 bytes. Keep it stable across restarts and all API instances; back it up under a separate access-controlled recovery process. Do not commit it, print it, return it to the browser, or rotate it without a planned decrypt/re-encrypt migration. If it is lost, existing encrypted TOTP seeds cannot be decrypted and affected users need an administrator-assisted MFA reset procedure.

Apply the additive `schema.sql` migration. MFA uses RFC 6238 TOTP (SHA-1, six digits, 30-second period, ±1 step tolerance), AES-256-GCM encrypted seeds, one-time recovery-code digests, five-minute login challenges, and per-process throttling. Configure system time synchronization (NTP). Recovery codes are displayed once at enrollment; users must store them offline. No QR renderer is bundled; an authenticator app can be configured by entering the displayed secret manually or by using the otpauth URI with a trusted QR generator.

MFA routes require the same exact Origin and CSRF controls as other authenticated mutations. The server issues no authenticated session until the second factor succeeds. TOTP steps are stored to prevent replay. Recovery codes are consumed transactionally. This implementation is not a substitute for independent security review, distributed rate limiting, operational monitoring, database backups, or a documented account recovery process. The API is still not deployed by GitHub Pages.


## 18.49 — WebAuthn / Passkeys

Install the backend dependencies from this directory with `npm install`. The server uses `@simplewebauthn/server` 14.1.x (Node.js 22+) for standards-based WebAuthn registration and assertion verification.

Set `SGHT_WEBAUTHN_RP_ID` to exactly the hostname in `SGHT_ALLOWED_ORIGIN` (for example, if the origin is `https://auth.example.com`, use `auth.example.com`). The API rejects missing or mismatched RP IDs. Keep the API behind HTTPS; browser WebAuthn requires a secure context, with localhost allowed for local development.

Before registering a passkey, the account must already have TOTP MFA enabled. Enrollment also requires password re-entry and a fresh, unused TOTP code; the code step is consumed transactionally. Disabling TOTP invalidates outstanding WebAuthn challenges. This stage deliberately treats passkeys as a second factor, not a replacement for password or TOTP recovery.

Routes:
- POST `/v1/auth/passkeys/register/options` and POST `/v1/auth/passkeys/register/verify`: authenticated, CSRF-protected enrollment.
- GET `/v1/auth/passkeys`: list the current user's registered public credentials and metadata.
- POST `/v1/auth/mfa/passkey/options` and POST `/v1/auth/mfa/passkey/verify`: passkey as the second factor for an outstanding password-login MFA challenge.

The database stores only credential public keys and metadata. Private keys remain with the authenticator. Challenge rows expire after five minutes and are consumed transactionally. TOTP/recovery-code login remains available. There is no unauthenticated passwordless login or credential deletion route in this stage.

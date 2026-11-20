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

18.42 does not create or deploy the authentication server. GitHub Pages remains static, the API URL meta tag remains blank, and login stays disabled until a separately deployed and reviewed HTTPS backend exists. No production database, session store, password hashing service, MFA, email invitation delivery, or live API integration test is included. Do not treat client-side checks as a security boundary.


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

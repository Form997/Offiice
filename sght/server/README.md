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

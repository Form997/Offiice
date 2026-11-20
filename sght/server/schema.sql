CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS sght_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email_normalized varchar(254) NOT NULL UNIQUE,
 display_name varchar(120) NOT NULL,
 password_hash char(128) NOT NULL,
 password_salt char(32) NOT NULL,
 role varchar(16) NOT NULL CHECK(role IN ('admin','signer','auditor','viewer')),
 status varchar(16) NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 email_verified_at timestamptz
);
CREATE TABLE IF NOT EXISTS sght_sessions (
 id_hash char(64) PRIMARY KEY,
 public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 csrf_hash char(64) NOT NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS sght_sessions_user_active ON sght_sessions(user_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS sght_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email_normalized varchar(254) NOT NULL,
 display_name varchar(120) NOT NULL,
 role varchar(16) NOT NULL CHECK(role IN ('admin','signer','auditor','viewer')),
 token_hash char(64) UNIQUE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_by uuid NOT NULL REFERENCES sght_users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sght_audit_events (
 id bigserial PRIMARY KEY,
 actor_user_id uuid REFERENCES sght_users(id),
 target_user_id uuid REFERENCES sght_users(id),
 action varchar(80) NOT NULL,
 metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 request_id uuid NOT NULL
);
CREATE INDEX IF NOT EXISTS sght_audit_created ON sght_audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS sght_password_resets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token_hash char(64) NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sght_password_resets_user_active ON sght_password_resets(user_id) WHERE consumed_at IS NULL;

-- Safe additive migration for databases created by the 18.43 schema.
ALTER TABLE sght_sessions ADD COLUMN IF NOT EXISTS public_id uuid DEFAULT gen_random_uuid();
UPDATE sght_sessions SET public_id=gen_random_uuid() WHERE public_id IS NULL;
ALTER TABLE sght_sessions ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sght_sessions_public_id ON sght_sessions(public_id);
ALTER TABLE sght_invitations ADD COLUMN IF NOT EXISTS token_hash char(64);
CREATE UNIQUE INDEX IF NOT EXISTS sght_invitations_token_hash ON sght_invitations(token_hash) WHERE token_hash IS NOT NULL;

-- 18.45 additive email-verification migration.
ALTER TABLE sght_users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS sght_email_verifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token_hash char(64) NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sght_email_verifications_user_active ON sght_email_verifications(user_id) WHERE consumed_at IS NULL;

-- 18.47 session device metadata; no raw IP address is retained.
ALTER TABLE sght_sessions ADD COLUMN IF NOT EXISTS user_agent varchar(500);

-- 18.48 TOTP MFA, short-lived login challenges, and one-time recovery codes.
CREATE TABLE IF NOT EXISTS sght_user_mfa (
 user_id uuid PRIMARY KEY REFERENCES sght_users(id) ON DELETE CASCADE,
 secret_ciphertext text,
 pending_secret_ciphertext text,
 pending_expires_at timestamptz,
 enabled_at timestamptz,
 last_used_step bigint
);
CREATE TABLE IF NOT EXISTS sght_mfa_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 token_hash char(64) NOT NULL UNIQUE,
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sght_mfa_challenges_user_active ON sght_mfa_challenges(user_id,expires_at) WHERE consumed_at IS NULL;
CREATE TABLE IF NOT EXISTS sght_mfa_recovery_codes (
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 code_hash char(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,code_hash)
);

 
-- 18.49 WebAuthn passkeys. Public keys are stored as bytes; no private key is held by SGHT.
CREATE TABLE IF NOT EXISTS sght_passkeys (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 credential_id text NOT NULL UNIQUE,
 public_key bytea NOT NULL,
 counter bigint NOT NULL DEFAULT 0,
 transports text[] NOT NULL DEFAULT ARRAY[]::text[],
 device_type varchar(32) NOT NULL,
 backed_up boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_used_at timestamptz
);
CREATE INDEX IF NOT EXISTS sght_passkeys_user ON sght_passkeys(user_id);
CREATE TABLE IF NOT EXISTS sght_webauthn_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 challenge text NOT NULL,
 user_id uuid NOT NULL REFERENCES sght_users(id) ON DELETE CASCADE,
 purpose varchar(32) NOT NULL CHECK(purpose IN ('registration','mfa_authentication')),
 context_hash char(64),
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sght_webauthn_challenges_active ON sght_webauthn_challenges(user_id,purpose,expires_at) WHERE consumed_at IS NULL;

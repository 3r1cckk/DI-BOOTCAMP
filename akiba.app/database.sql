-- Active: 1792053163779@@localhost@5500@public

CREATE TABLE IF NOT EXISTS akiba_users (
  id TEXT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_salt CHAR(32) NOT NULL,
  password_hash CHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE akiba_users
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS akiba_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES akiba_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  admin_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE akiba_sessions
  ADD COLUMN IF NOT EXISTS admin_authorized BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS akiba_sessions_user_id_idx
  ON akiba_sessions (user_id);

CREATE INDEX IF NOT EXISTS akiba_sessions_expires_at_idx
  ON akiba_sessions (expires_at);

CREATE TABLE IF NOT EXISTS akiba_chamas (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_by TEXT NOT NULL REFERENCES akiba_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS akiba_chama_memberships (
  chama_id TEXT NOT NULL REFERENCES akiba_chamas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES akiba_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('chairperson', 'treasurer', 'secretary', 'ordinary_member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chama_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS akiba_chama_one_chairperson_idx
  ON akiba_chama_memberships (chama_id)
  WHERE role = 'chairperson';

CREATE INDEX IF NOT EXISTS akiba_chama_memberships_user_id_idx
  ON akiba_chama_memberships (user_id, chama_id);

CREATE TABLE IF NOT EXISTS akiba_chama_data (
  chama_id TEXT PRIMARY KEY REFERENCES akiba_chamas(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS akiba_financial_approvals (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES akiba_chamas(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES akiba_users(id),
  reviewed_by TEXT REFERENCES akiba_users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'stale')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description VARCHAR(200) NOT NULL,
  base_data_hash CHAR(64) NOT NULL,
  proposed_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS akiba_financial_approvals_chama_status_idx
  ON akiba_financial_approvals (chama_id, status, created_at DESC);

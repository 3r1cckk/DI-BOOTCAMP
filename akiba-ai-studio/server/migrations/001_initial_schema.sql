PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  reset_token_hash TEXT,
  reset_expires_at INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chamas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('member', 'treasurer', 'secretary', 'chairperson', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
  phone TEXT NOT NULL DEFAULT '',
  id_number TEXT NOT NULL DEFAULT '',
  joined_date TEXT NOT NULL DEFAULT (date('now')),
  total_saved REAL NOT NULL DEFAULT 0 CHECK (total_saved >= 0),
  monthly_pledge REAL NOT NULL DEFAULT 0 CHECK (monthly_pledge >= 0),
  UNIQUE (chama_id, user_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_status_idx ON memberships(user_id, status);
CREATE INDEX IF NOT EXISTS memberships_chama_status_idx ON memberships(chama_id, status);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_chama_id TEXT REFERENCES chamas(id),
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  membership_id TEXT NOT NULL REFERENCES memberships(id),
  amount REAL NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL DEFAULT 'contribution'
    CHECK (type IN ('contribution', 'welfare', 'fine', 'loan_repayment', 'loan_disbursement')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')),
  payment_method TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('mpesa', 'bank_transfer', 'cash')),
  reference TEXT,
  notes TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS contributions_chama_date_idx ON contributions(chama_id, occurred_at);
CREATE INDEX IF NOT EXISTS contributions_membership_date_idx ON contributions(membership_id, occurred_at);

CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  membership_id TEXT NOT NULL REFERENCES memberships(id),
  amount REAL NOT NULL CHECK (amount > 0),
  interest_rate REAL NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  start_date TEXT,
  due_date TEXT,
  monthly_installment REAL NOT NULL DEFAULT 0,
  total_repayment REAL NOT NULL DEFAULT 0,
  amount_repaid REAL NOT NULL DEFAULT 0 CHECK (amount_repaid >= 0),
  guarantor_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS loans_chama_status_idx ON loans(chama_id, status);
CREATE INDEX IF NOT EXISTS loans_membership_idx ON loans(membership_id);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  membership_id TEXT REFERENCES memberships(id),
  amount REAL NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES users(id),
  chama_id TEXT NOT NULL REFERENCES chamas(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS audit_logs_chama_timestamp_idx ON audit_logs(chama_id, timestamp);

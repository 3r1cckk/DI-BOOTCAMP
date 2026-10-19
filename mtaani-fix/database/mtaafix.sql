PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- Location levels are configurable; local areas are captured as resident-provided
-- neighbourhood labels so the catalog does not have to enumerate every street.

CREATE TABLE IF NOT EXISTS administrative_levels (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    parent_key TEXT REFERENCES administrative_levels(key),
    sort_order INTEGER NOT NULL,
    resident_registration INTEGER NOT NULL DEFAULT 0 CHECK(resident_registration IN (0, 1))
);

CREATE TABLE IF NOT EXISTS administrative_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    level_key TEXT NOT NULL REFERENCES administrative_levels(key),
    parent_id INTEGER REFERENCES administrative_units(id),
    name TEXT NOT NULL,
    UNIQUE(parent_id, level_key, name)
);

CREATE INDEX IF NOT EXISTS administrative_units_parent_idx ON administrative_units(parent_id);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    location_unit_id INTEGER REFERENCES administrative_units(id),
    area_name TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 90),
    category TEXT NOT NULL CHECK(category IN ('garbage', 'roads', 'streetlights', 'water', 'sanitation', 'environment')),
    description TEXT NOT NULL CHECK(length(description) BETWEEN 1 AND 600),
    location TEXT NOT NULL CHECK(length(location) BETWEEN 1 AND 120),
    location_unit_id INTEGER REFERENCES administrative_units(id),
    area_name TEXT,
    location_path_snapshot TEXT,
    status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'progress', 'solved')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    latitude REAL CHECK(latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude REAL CHECK(longitude IS NULL OR longitude BETWEEN -180 AND 180),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_priority_idx ON reports(priority);

CREATE TABLE IF NOT EXISTS report_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK(status IN ('reported', 'progress', 'solved')),
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    note TEXT CHECK(note IS NULL OR length(note) <= 300),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS report_status_history_report_idx
    ON report_status_history(report_id, created_at, id);

CREATE TABLE IF NOT EXISTS report_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 600),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS report_messages_report_idx
    ON report_messages(report_id, created_at, id);

CREATE TABLE IF NOT EXISTS report_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    mime_type TEXT NOT NULL CHECK(mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    data_url TEXT NOT NULL,
    evidence_type TEXT NOT NULL DEFAULT 'before' CHECK(evidence_type IN ('before', 'after')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS report_evidence_report_idx ON report_evidence(report_id);

CREATE TABLE IF NOT EXISTS report_supports (
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS report_supports_report_idx ON report_supports(report_id);

CREATE TABLE IF NOT EXISTS report_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK(reason IN ('fake', 'spam', 'inappropriate', 'duplicate')),
    details TEXT CHECK(details IS NULL OR length(details) <= 300),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'reviewed', 'dismissed')),
    admin_note TEXT CHECK(admin_note IS NULL OR length(admin_note) <= 300),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS report_flags_report_idx ON report_flags(report_id, status);
CREATE INDEX IF NOT EXISTS report_flags_status_idx ON report_flags(status, created_at DESC);

CREATE TABLE IF NOT EXISTS report_confirmations (
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote INTEGER NOT NULL CHECK(vote IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS report_confirmations_report_idx ON report_confirmations(report_id, vote);

CREATE TABLE IF NOT EXISTS admin_assignments (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES administrative_units(id),
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 80),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_assignments_unit_idx ON admin_assignments(unit_id);

CREATE TABLE IF NOT EXISTS admin_approvals (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES administrative_units(id),
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 80),
    approved_by TEXT NOT NULL CHECK(length(approved_by) BETWEEN 1 AND 80),
    verification_note TEXT,
    approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_approval_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES administrative_units(id),
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 80),
    approved_by TEXT NOT NULL CHECK(length(approved_by) BETWEEN 1 AND 80),
    verification_note TEXT,
    approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_approval_audit_user_idx
    ON admin_approval_audit(user_id, approved_at DESC);

CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES administrative_units(id),
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 90),
    body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 600),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS announcements_unit_idx ON announcements(unit_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL CHECK(event_key IN ('report_received', 'report_status', 'area_announcement')),
    title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 90),
    message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 300),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TEXT
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
    ON notifications(recipient_user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS users_location_idx ON users(location_unit_id);
CREATE INDEX IF NOT EXISTS reports_location_idx ON reports(location_unit_id);

INSERT OR IGNORE INTO administrative_levels (key, label, parent_key, sort_order, resident_registration)
VALUES
    ('county', 'County', NULL, 1, 1),
    ('sub_county', 'Sub-County', 'county', 2, 1),
    ('ward', 'Ward', 'sub_county', 3, 1);

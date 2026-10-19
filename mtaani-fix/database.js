import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(projectDirectory, 'data');

fs.mkdirSync(dataDirectory, { recursive: true });

export const databasePath = path.join(dataDirectory, 'mtaafix.sqlite');
export const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
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
`);

function ensureColumn(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((item) => item.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}

ensureColumn('users', 'location_unit_id', 'INTEGER REFERENCES administrative_units(id)');
ensureColumn('users', 'area_name', 'TEXT');
ensureColumn('users', 'phone', 'TEXT');
ensureColumn('reports', 'location_unit_id', 'INTEGER REFERENCES administrative_units(id)');
ensureColumn('reports', 'area_name', 'TEXT');
ensureColumn('reports', 'location_path_snapshot', 'TEXT');
ensureColumn('reports', 'priority', "TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent'))");
ensureColumn('reports', 'latitude', 'REAL');
ensureColumn('reports', 'longitude', 'REAL');
ensureColumn('report_evidence', 'evidence_type', "TEXT NOT NULL DEFAULT 'before' CHECK(evidence_type IN ('before', 'after'))");
db.exec(`
    CREATE INDEX IF NOT EXISTS users_location_idx ON users(location_unit_id);
    CREATE INDEX IF NOT EXISTS reports_location_idx ON reports(location_unit_id);
    CREATE INDEX IF NOT EXISTS reports_priority_idx ON reports(priority);
`);
db.prepare(`
    INSERT INTO report_status_history (report_id, status, created_at, note)
    SELECT reports.id, reports.status, CURRENT_TIMESTAMP, 'Status recorded when report history was introduced'
    FROM reports
    WHERE NOT EXISTS (
        SELECT 1 FROM report_status_history
        WHERE report_status_history.report_id = reports.id
    )
`).run();

const locationCatalogPath = path.join(projectDirectory, 'seeds', 'kenya-administrative-units.json');
const defaultLevels = [
    { key: 'county', label: 'County', parentKey: null, sortOrder: 1, residentRegistration: true },
    { key: 'sub_county', label: 'Sub-County', parentKey: 'county', sortOrder: 2, residentRegistration: true },
    { key: 'ward', label: 'Ward', parentKey: 'sub_county', sortOrder: 3, residentRegistration: true }
];
const insertLevel = db.prepare(`
    INSERT OR IGNORE INTO administrative_levels (key, label, parent_key, sort_order, resident_registration)
    VALUES (?, ?, ?, ?, ?)
`);
for (const level of defaultLevels) {
    insertLevel.run(level.key, level.label, level.parentKey, level.sortOrder, level.residentRegistration ? 1 : 0);
}

export let locationCatalogReady = false;
if (fs.existsSync(locationCatalogPath)) {
    const locationCatalog = JSON.parse(fs.readFileSync(locationCatalogPath, 'utf8'));
    if (
        !Array.isArray(locationCatalog.levels) ||
        !Array.isArray(locationCatalog.units) ||
        typeof locationCatalog.source?.title !== 'string' ||
        typeof locationCatalog.source?.url !== 'string' ||
        typeof locationCatalog.source?.license !== 'string'
    ) {
        throw new Error('The Kenya location catalog must include levels, units, and source and license metadata.');
    }
    const findUnitId = db.prepare('SELECT id FROM administrative_units WHERE code = ?');
    const findLevel = db.prepare('SELECT parent_key FROM administrative_levels WHERE key = ?');
    db.transaction(() => {
        const updateLevel = db.prepare(`
            INSERT INTO administrative_levels (key, label, parent_key, sort_order, resident_registration)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                label = excluded.label,
                parent_key = excluded.parent_key,
                sort_order = excluded.sort_order,
                resident_registration = excluded.resident_registration
        `);
        for (const level of locationCatalog.levels) {
            updateLevel.run(
                level.key,
                level.label,
                level.parentKey || null,
                level.sortOrder,
                level.residentRegistration ? 1 : 0
            );
        }
        const configuredLevels = db.prepare(`
            SELECT key, parent_key, sort_order
            FROM administrative_levels
        `).all();
        const levelsByKey = new Map(configuredLevels.map((level) => [level.key, level]));
        for (const level of configuredLevels) {
            const parentLevel = level.parent_key ? levelsByKey.get(level.parent_key) : null;
            if (level.parent_key && (!parentLevel || parentLevel.sort_order >= level.sort_order)) {
                throw new Error('Administrative level ' + level.key + ' has an invalid or cyclic parent level.');
            }
        }

        const insertUnit = db.prepare(`
            INSERT INTO administrative_units (code, level_key, parent_id, name)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                level_key = excluded.level_key,
                parent_id = excluded.parent_id,
                name = excluded.name
        `);
        for (const unit of locationCatalog.units) {
            const parent = unit.parentCode ? findUnitId.get(unit.parentCode) : null;
            if (unit.parentCode && !parent) {
                throw new Error('Location catalog is missing parent ' + unit.parentCode + ' for ' + unit.code + '.');
            }
            const level = findLevel.get(unit.levelKey);
            const parentLevel = parent ? db.prepare('SELECT level_key FROM administrative_units WHERE id = ?').get(parent.id) : null;
            if (!level || (level.parent_key && (!parentLevel || parentLevel.level_key !== level.parent_key)) || (!level.parent_key && parent)) {
                throw new Error('Location catalog has an invalid parent-child relationship for ' + unit.code + '.');
            }
            insertUnit.run(unit.code, unit.levelKey, parent ? parent.id : null, unit.name);
        }
    })();

    const countyCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM administrative_units
        WHERE level_key = 'county'
    `).get().count;
    if (countyCount !== 47) {
        throw new Error('The Kenya location catalog must contain all 47 counties; found ' + countyCount + '.');
    }
    const missingRegistrationLevel = db.prepare(`
        SELECT levels.key
        FROM administrative_levels AS levels
        WHERE levels.resident_registration = 1
          AND NOT EXISTS (
              SELECT 1 FROM administrative_units AS units WHERE units.level_key = levels.key
          )
        LIMIT 1
    `).get();
    if (missingRegistrationLevel) {
        throw new Error('The Kenya location catalog has no units for registration level ' + missingRegistrationLevel.key + '.');
    }
    const parentWithoutChildren = db.prepare(`
        SELECT parent.id
        FROM administrative_units AS parent
        JOIN administrative_levels AS child_level ON child_level.parent_key = parent.level_key
        WHERE child_level.resident_registration = 1
          AND NOT EXISTS (
              SELECT 1
              FROM administrative_units AS child
              WHERE child.parent_id = parent.id AND child.level_key = child_level.key
          )
        LIMIT 1
    `).get();
    if (parentWithoutChildren) {
        throw new Error('The Kenya location catalog contains a registered area without its required child locations.');
    }
    locationCatalogReady = true;
} else {
    console.warn('Verified Kenya location catalog not installed. Location-based registration is disabled.');
}

export function closeDatabase() {
    if (db.open) {
        db.close();
    }
}

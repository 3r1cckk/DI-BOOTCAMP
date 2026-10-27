import 'dotenv/config';
import { promisify } from 'node:util';
import {
    createHash,
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual
} from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { db, closeDatabase, locationCatalogReady } from './database.js';

const scrypt = promisify(scryptCallback);
const app = express();
const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT || '3000', 10);
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const sessionCookieName = 'mtaafix_session';
const csrfCookieName = 'mtaafix_csrf';
const isProduction = process.env.NODE_ENV === 'production';
const appOrigin = (process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL)?.replace(/\/+$/, '');
const registrationEnabled = process.env.ALLOW_REGISTRATION !== 'false';
const allowedCategories = new Set(['garbage', 'roads', 'streetlights', 'water', 'sanitation', 'environment']);
const allowedStatuses = new Set(['reported', 'progress', 'solved']);
const allowedPriorities = new Set(['low', 'medium', 'high', 'urgent']);
const allowedFlagReasons = new Set(['fake', 'spam', 'inappropriate', 'duplicate']);
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a little while and try again.' }
});

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.');
}
if (isProduction && !appOrigin) {
    throw new Error('Set APP_ORIGIN to the public HTTPS origin before running in production.');
}
if (appOrigin) {
    let parsedOrigin;
    try {
        parsedOrigin = new URL(appOrigin);
    } catch (error) {
        throw new Error('APP_ORIGIN must be a valid absolute URL origin.');
    }
    if (parsedOrigin.origin !== appOrigin || (isProduction && parsedOrigin.protocol !== 'https:')) {
        throw new Error('APP_ORIGIN must contain only the site origin, and production must use HTTPS.');
    }
}

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: sessionDurationMs
};

if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY);
}

app.disable('x-powered-by');
app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).type('text').send('ok');
});
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            imgSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com']
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '8mb', type: 'application/json' }));
app.use(cookieParser());

function setCsrfCookie(res, token) {
    res.cookie(csrfCookieName, token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: sessionDurationMs
    });
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function getSafeUser(user) {
    const profile = db.prepare(`
        SELECT location_unit_id, area_name, phone
        FROM users
        WHERE id = ?
    `).get(user.id);
    const assignment = getAdminAssignment(user.id);
    const unreadNotifications = db.prepare(`
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE recipient_user_id = ? AND read_at IS NULL
    `).get(user.id).count;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: profile?.phone || '',
        role: user.role,
        unreadNotifications,
        location: profile?.location_unit_id ? {
            unitId: profile.location_unit_id,
            area: profile.area_name,
            path: getLocationPath(profile.location_unit_id)
        } : null,
        administrativeArea: assignment ? {
            title: assignment.title,
            unitId: assignment.unit_id,
            levelKey: assignment.level_key,
            name: assignment.unit_name,
            path: getLocationPath(assignment.unit_id),
            approvedBy: assignment.approved_by,
            approvedAt: assignment.approved_at
        } : null
    };
}

function getAdminAssignment(userId) {
    return db.prepare(`
        SELECT admin_assignments.title, administrative_units.id AS unit_id,
               administrative_units.name AS unit_name, administrative_units.level_key,
               admin_approvals.approved_by, admin_approvals.approved_at
        FROM admin_assignments
        JOIN administrative_units ON administrative_units.id = admin_assignments.unit_id
        JOIN admin_approvals
          ON admin_approvals.user_id = admin_assignments.user_id
         AND admin_approvals.unit_id = admin_assignments.unit_id
         AND admin_approvals.title = admin_assignments.title
        WHERE admin_assignments.user_id = ?
    `).get(userId);
}

function getLocationPath(unitId) {
    return db.prepare(`
        WITH RECURSIVE ancestors(id, parent_id, level_key, label, name, depth) AS (
            SELECT units.id, units.parent_id, levels.key, levels.label, units.name, 0
            FROM administrative_units AS units
            JOIN administrative_levels AS levels ON levels.key = units.level_key
            WHERE units.id = ?
            UNION ALL
            SELECT parent.id, parent.parent_id, parent_level.key, parent_level.label, parent.name, ancestors.depth + 1
            FROM administrative_units AS parent
            JOIN administrative_levels AS parent_level ON parent_level.key = parent.level_key
            JOIN ancestors ON ancestors.parent_id = parent.id
        )
        SELECT level_key AS key, label, name
        FROM ancestors
        ORDER BY depth DESC
    `).all(unitId);
}

async function hashPassword(password) {
    const salt = randomBytes(16);
    const derivedKey = await scrypt(password, salt, 64, {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024
    });
    return ['scrypt', '32768', '8', '1', salt.toString('hex'), Buffer.from(derivedKey).toString('hex')].join('$');
}

async function verifyPassword(password, storedHash) {
    const parts = storedHash.includes('$') ? storedHash.split('$') : storedHash.split(':');
    const legacyHash = parts.length === 2;
    const [algorithm, cost, blockSize, parallelization, saltHex, keyHex] = legacyHash
        ? ['scrypt', '16384', '8', '1', ...parts]
        : parts;
    if (
        algorithm !== 'scrypt' ||
        !['16384', '32768'].includes(cost) ||
        blockSize !== '8' ||
        parallelization !== '1' ||
        !/^[a-f0-9]{32}$/i.test(saltHex || '') ||
        !/^[a-f0-9]{128}$/i.test(keyHex || '')
    ) {
        return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(keyHex, 'hex');
    const actualKey = Buffer.from(await scrypt(password, salt, expectedKey.length, {
        N: Number(cost),
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024
    }));
    return timingSafeEqual(expectedKey, actualKey);
}

function getRequestOrigin(req) {
    if (appOrigin) {
        return appOrigin;
    }
    return req.protocol + '://' + req.get('host');
}

function ensureCsrfCookie(req, res, next) {
    let token = req.cookies[csrfCookieName];
    if (!/^[A-Za-z0-9_-]{43}$/.test(token || '')) {
        token = randomBytes(32).toString('base64url');
        setCsrfCookie(res, token);
    }
    res.locals.csrfToken = token;
    next();
}

function requireCsrf(req, res, next) {
    const origin = req.get('origin');
    if (!origin || origin !== getRequestOrigin(req)) {
        return res.status(403).json({ error: 'This request could not be verified. Refresh the page and try again.' });
    }

    const cookieToken = req.cookies[csrfCookieName];
    const headerToken = req.get('x-csrf-token');
    if (!cookieToken || !headerToken) {
        return res.status(403).json({ error: 'This request could not be verified. Refresh the page and try again.' });
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    if (cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) {
        return res.status(403).json({ error: 'This request could not be verified. Refresh the page and try again.' });
    }

    next();
}

function findSession(req, res, next) {
    const rawToken = req.cookies[sessionCookieName];
    if (typeof rawToken === 'string' && /^[A-Za-z0-9_-]{43}$/.test(rawToken)) {
        const session = db.prepare(`
            SELECT users.id, users.name, users.email, users.role, sessions.expires_at
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
        `).get(hashToken(rawToken));

        if (session && session.expires_at > Date.now()) {
            req.user = session;
        } else if (session) {
            db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(rawToken));
            res.clearCookie(sessionCookieName, { ...cookieOptions, maxAge: undefined });
        }
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Please sign in to continue.' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(req.user ? 403 : 401).json({
            error: req.user ? 'This area is for MtaaFix administrators.' : 'Please sign in with an administrator account.'
        });
    }
    req.adminAssignment = getAdminAssignment(req.user.id);
    if (!req.adminAssignment) {
        return res.status(403).json({ error: 'This administrator account must be approved and assigned an administrative area by a trusted operator.' });
    }
    next();
}

function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function validateEvidencePhotos(photos, maximumCount) {
    if (!Array.isArray(photos) || photos.length > maximumCount) {
        return { photos: [], error: 'Attach no more than ' + maximumCount + ' photos.' };
    }
    const validatedPhotos = [];
    let evidenceBytes = 0;
    for (const photo of photos) {
        const match = typeof photo?.dataUrl === 'string'
            ? /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo.dataUrl)
            : null;
        if (!match) {
            return { photos: [], error: 'Photos must be JPEG, PNG, or WebP images.' };
        }
        const bytes = Buffer.from(match[2], 'base64');
        const validSignature = match[1] === 'image/jpeg'
            ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
            : match[1] === 'image/png'
                ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
                : bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' &&
                  bytes.toString('ascii', 8, 12) === 'WEBP';
        if (!validSignature || bytes.length > 1_500_000) {
            return { photos: [], error: 'Each photo must be a valid image no larger than 1.5 MB.' };
        }
        evidenceBytes += bytes.length;
        if (evidenceBytes > 4_500_000) {
            return { photos: [], error: 'The combined photo size must be no more than 4.5 MB.' };
        }
        validatedPhotos.push({ mimeType: match[1], dataUrl: photo.dataUrl });
    }
    return { photos: validatedPhotos, error: null };
}

function getDescendantLocationIds(unitId) {
    return db.prepare(`
        WITH RECURSIVE descendants(id) AS (
            SELECT id FROM administrative_units WHERE id = ?
            UNION ALL
            SELECT child.id
            FROM administrative_units AS child
            JOIN descendants ON child.parent_id = descendants.id
        )
        SELECT id FROM descendants
    `).all(unitId).map((row) => row.id);
}

function getAncestorLocationIds(unitId) {
    return db.prepare(`
        WITH RECURSIVE ancestors(id, parent_id) AS (
            SELECT id, parent_id FROM administrative_units WHERE id = ?
            UNION ALL
            SELECT parent.id, parent.parent_id
            FROM administrative_units AS parent
            JOIN ancestors ON ancestors.parent_id = parent.id
        )
        SELECT id FROM ancestors
    `).all(unitId).map((row) => row.id);
}

function addNotification(notification) {
    db.prepare(`
        INSERT INTO notifications (
            recipient_user_id, actor_user_id, report_id, announcement_id,
            event_key, title, message
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        notification.recipientUserId,
        notification.actorUserId || null,
        notification.reportId || null,
        notification.announcementId || null,
        notification.eventKey,
        notification.title,
        notification.message
    );
}

function notifyAssignedAdmins(locationUnitId, reportId, title, notificationTitle = 'A new neighbourhood report') {
    const ancestorIds = getAncestorLocationIds(locationUnitId);
    const placeholders = ancestorIds.map(() => '?').join(', ');
    const admins = db.prepare(`
        SELECT assignments.user_id
        FROM admin_assignments AS assignments
        JOIN admin_approvals AS approvals
          ON approvals.user_id = assignments.user_id
         AND approvals.unit_id = assignments.unit_id
         AND approvals.title = assignments.title
        JOIN users ON users.id = assignments.user_id
        WHERE users.role = 'admin' AND assignments.unit_id IN (${placeholders})
    `).all(...ancestorIds);
    const insert = db.transaction(() => {
        admins.forEach((admin) => addNotification({
            recipientUserId: admin.user_id,
            eventKey: 'report_received',
            reportId,
            title: notificationTitle,
            message: title
        }));
    });
    insert();
}

function isResidentRegistrationUnit(unitId) {
    const registrationLevel = db.prepare(`
        SELECT key
        FROM administrative_levels
        WHERE resident_registration = 1
        ORDER BY sort_order DESC
        LIMIT 1
    `).get();
    const selectedUnit = db.prepare('SELECT level_key FROM administrative_units WHERE id = ?').get(unitId);
    return Boolean(registrationLevel && selectedUnit && selectedUnit.level_key === registrationLevel.key);
}

function getReportRowsForLocationIds(unitIds, userId = null) {
    if (unitIds.length === 0) {
        return [];
    }
    const placeholders = unitIds.map(() => '?').join(', ');
    return db.prepare(`
        SELECT reports.id, reports.title, reports.category, reports.description,
               reports.location, reports.area_name, reports.location_unit_id,
               reports.location_path_snapshot,
               reports.status, reports.priority, reports.created_at,
               (SELECT COUNT(*) FROM report_supports WHERE report_supports.report_id = reports.id) AS support_count,
               CASE WHEN ? > 0 AND reports.location_unit_id = (
                   SELECT location_unit_id FROM users WHERE users.id = ?
               ) THEN 1 ELSE 0 END AS can_support,
               EXISTS (
                   SELECT 1 FROM report_supports
                   WHERE report_supports.report_id = reports.id AND report_supports.user_id = ?
               ) AS supported_by_user,
               CASE WHEN reports.status != 'solved'
                    THEN MAX(0, CAST(julianday('now') - julianday(reports.created_at) AS INTEGER))
                    ELSE 0 END AS unresolved_days
        FROM reports
        WHERE reports.location_unit_id IN (${placeholders})
        ORDER BY reports.created_at DESC
    `).all(userId || 0, userId || 0, userId || 0, ...unitIds);
}

function publicReport(row) {
    let locationPath = row.location_path_snapshot
        ? JSON.parse(row.location_path_snapshot)
        : [];
    if (!Array.isArray(locationPath)) {
        throw new Error('A report contains an invalid saved location path.');
    }
    if (locationPath.length === 0 && row.location_unit_id) {
        locationPath = getLocationPath(row.location_unit_id);
    }
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        location: row.area_name || row.location,
        locationPath,
        status: row.status,
        priority: row.priority || 'medium',
        createdAt: row.created_at,
        supportCount: row.support_count || 0,
        canSupport: Boolean(row.can_support),
        supportedByMe: Boolean(row.supported_by_user),
        overdueDays: row.status !== 'solved' && row.unresolved_days >= 14 ? row.unresolved_days : 0
    };
}

function getAccessibleReport(req, reportId) {
    const report = db.prepare(`
        SELECT id, user_id, title, status, priority, location_unit_id,
               latitude, longitude, created_at
        FROM reports
        WHERE id = ?
    `).get(reportId);
    if (!report) {
        return null;
    }
    if (report.user_id === req.user.id) {
        return report;
    }
    if (req.user.role === 'user') {
        const resident = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
        return resident?.location_unit_id === report.location_unit_id ? report : null;
    }
    if (req.user.role !== 'admin') {
        return null;
    }
    const assignment = getAdminAssignment(req.user.id);
    if (!assignment || !report.location_unit_id ||
        !getDescendantLocationIds(assignment.unit_id).includes(report.location_unit_id)) {
        return null;
    }
    return report;
}

function getConfirmationCounts(reportId, userId) {
    const counts = db.prepare(`
        SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS yes,
               SUM(CASE WHEN vote = 0 THEN 1 ELSE 0 END) AS no
        FROM report_confirmations
        WHERE report_id = ?
    `).get(reportId);
    const own = db.prepare(`
        SELECT vote FROM report_confirmations WHERE report_id = ? AND user_id = ?
    `).get(reportId, userId);
    return { yes: counts.yes || 0, no: counts.no || 0, vote: own ? own.vote === 1 : null };
}

const dummyPasswordCheck = hashPassword(randomBytes(32).toString('hex'));

app.use('/api', ensureCsrfCookie, findSession, (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

app.get('/api/locations/levels', (req, res) => {
    const levels = db.prepare(`
        SELECT key, label, parent_key AS parentKey, sort_order AS sortOrder
        FROM administrative_levels
        WHERE resident_registration = 1
        ORDER BY sort_order
    `).all();
    res.json({ available: locationCatalogReady, levels });
});

app.get('/api/locations/units', (req, res) => {
    if (!locationCatalogReady) {
        return res.status(503).json({ error: 'The verified Kenya location catalog has not been installed yet.' });
    }
    const levelKey = cleanString(req.query.levelKey);
    const level = db.prepare(`
        SELECT key, parent_key
        FROM administrative_levels
        WHERE key = ?
    `).get(levelKey);
    if (!level) {
        return res.status(400).json({ error: 'Choose a valid administrative level.' });
    }

    const rawParentId = req.query.parentId;
    let parentId = null;
    if (level.parent_key) {
        parentId = Number(rawParentId);
        if (!Number.isSafeInteger(parentId) || parentId < 1) {
            return res.status(400).json({ error: 'Choose a parent area before loading these locations.' });
        }
        const parent = db.prepare('SELECT level_key FROM administrative_units WHERE id = ?').get(parentId);
        if (!parent || parent.level_key !== level.parent_key) {
            return res.status(400).json({ error: 'Choose a valid parent area.' });
        }
    } else if (rawParentId !== undefined) {
        return res.status(400).json({ error: 'This level does not use a parent area.' });
    }

    const units = parentId === null
        ? db.prepare(`
            SELECT id, code, name
            FROM administrative_units
            WHERE level_key = ? AND parent_id IS NULL
            ORDER BY name
        `).all(levelKey)
        : db.prepare(`
            SELECT id, code, name
            FROM administrative_units
            WHERE level_key = ? AND parent_id = ?
            ORDER BY name
        `).all(levelKey, parentId);
    res.json({ units });
});

app.patch('/api/auth/location', requireCsrf, requireAuth, (req, res) => {
    if (!locationCatalogReady) {
        return res.status(503).json({ error: 'The verified Kenya location catalog has not been installed yet.' });
    }
    const locationUnitId = Number(req.body?.locationUnitId);
    const area = cleanString(req.body?.area);
    if (!Number.isSafeInteger(locationUnitId) || locationUnitId < 1 || !isResidentRegistrationUnit(locationUnitId)) {
        return res.status(400).json({ error: 'Choose a valid location from the registration hierarchy.' });
    }
    if (area.length < 1 || area.length > 120) {
        return res.status(400).json({ error: 'Enter a local area between 1 and 120 characters.' });
    }
    db.prepare('UPDATE users SET location_unit_id = ?, area_name = ? WHERE id = ?')
        .run(locationUnitId, area, req.user.id);
    res.json({ user: getSafeUser(req.user) });
});

app.patch('/api/profile', requireCsrf, requireAuth, (req, res) => {
    const name = cleanString(req.body?.name);
    const phone = cleanString(req.body?.phone);
    if (name.length < 1 || name.length > 80) {
        return res.status(400).json({ error: 'Please enter a name between 1 and 80 characters.' });
    }
    if (phone.length > 0 && !/^\+?[0-9().\-\s]{7,24}$/.test(phone)) {
        return res.status(400).json({ error: 'Enter a valid phone number or leave the field blank.' });
    }
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?')
        .run(name, phone || null, req.user.id);
    res.json({ user: getSafeUser({ ...req.user, name }) });
});

app.get('/api/profile', requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT id, title, category, description, location, area_name,
               location_unit_id, location_path_snapshot, status, priority, created_at
        FROM reports
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 100
    `).all(req.user.id);
    res.json({
        user: getSafeUser(req.user),
        totalReports: db.prepare('SELECT COUNT(*) AS count FROM reports WHERE user_id = ?').get(req.user.id).count,
        reports: rows.map(publicReport)
    });
});

app.get('/api/auth/session', (req, res) => {
    res.json({
        csrfToken: res.locals.csrfToken,
        user: req.user ? getSafeUser(req.user) : null,
        registrationEnabled
    });
});

app.post('/api/auth/register', authRateLimit, requireCsrf, async (req, res, next) => {
    try {
        if (!registrationEnabled) {
            return res.status(503).json({ error: 'New account registration is temporarily paused while verified location data is prepared.' });
        }
        if (!locationCatalogReady) {
            return res.status(503).json({ error: 'Location-based registration is temporarily unavailable while the verified Kenya location catalog is prepared.' });
        }
        const name = cleanString(req.body?.name);
        const email = cleanString(req.body?.email).toLowerCase();
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        const phone = cleanString(req.body?.phone);
        const locationUnitId = Number(req.body?.locationUnitId);
        const area = cleanString(req.body?.area);

        if (name.length < 1 || name.length > 80) {
            return res.status(400).json({ error: 'Please enter a name between 1 and 80 characters.' });
        }
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
        if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 1024) {
            return res.status(400).json({ error: 'Your password must be at least 12 characters long.' });
        }
        if (!Number.isSafeInteger(locationUnitId) || locationUnitId < 1) {
            return res.status(400).json({ error: 'Choose your county, sub-county, and ward.' });
        }
        if (area.length < 1 || area.length > 120) {
            return res.status(400).json({ error: 'Enter a local area between 1 and 120 characters.' });
        }
        if (phone.length > 0 && !/^\+?[0-9().\-\s]{7,24}$/.test(phone)) {
            return res.status(400).json({ error: 'Enter a valid phone number or leave the field blank.' });
        }
        if (!isResidentRegistrationUnit(locationUnitId)) {
            return res.status(400).json({ error: 'Choose a valid location from the registration hierarchy.' });
        }

        const passwordHash = await hashPassword(password);
        const sessionToken = randomBytes(32).toString('base64url');
        const csrfToken = randomBytes(32).toString('base64url');
        const now = Date.now();
        let user;
        try {
            user = db.transaction(() => {
                const result = db.prepare(`
                    INSERT INTO users (name, email, phone, password_hash, location_unit_id, area_name)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(name, email, phone || null, passwordHash, locationUnitId, area);
                const createdUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
                db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
                    .run(hashToken(sessionToken), createdUser.id, now + sessionDurationMs, now);
                return createdUser;
            })();
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ error: 'An account with that email already exists. Try signing in instead.' });
            }
            throw error;
        }

        res.cookie(sessionCookieName, sessionToken, cookieOptions);
        setCsrfCookie(res, csrfToken);
        res.status(201).json({ user: getSafeUser(user), csrfToken });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/login', authRateLimit, requireCsrf, async (req, res, next) => {
    try {
        const email = cleanString(req.body?.email).toLowerCase();
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 1024) {
            return res.status(400).json({ error: 'Please check your email and password and try again.' });
        }

        const user = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?').get(email);
        const hashToVerify = user ? user.password_hash : await dummyPasswordCheck;
        const passwordIsValid = password.length > 0 && await verifyPassword(password, hashToVerify);
        if (!user || !passwordIsValid) {
            return res.status(401).json({ error: 'We couldn’t sign you in with those details. Check them and try again.' });
        }

        if (user.password_hash.includes(':')) {
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                .run(await hashPassword(password), user.id);
        }

        const sessionToken = randomBytes(32).toString('base64url');
        const csrfToken = randomBytes(32).toString('base64url');
        const now = Date.now();
        db.transaction(() => {
            db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
            db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
                .run(hashToken(sessionToken), user.id, now + sessionDurationMs, now);
        })();

        res.cookie(sessionCookieName, sessionToken, cookieOptions);
        setCsrfCookie(res, csrfToken);
        res.json({ user: getSafeUser(user), csrfToken });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/logout', requireCsrf, requireAuth, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(req.cookies[sessionCookieName]));
    res.clearCookie(sessionCookieName, { ...cookieOptions, maxAge: undefined });
    const csrfToken = randomBytes(32).toString('base64url');
    setCsrfCookie(res, csrfToken);
    res.json({ csrfToken });
});

app.get('/api/reports', (req, res) => {
    if (!req.user) {
        return res.json({ reports: [] });
    }
    const profile = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
    const unitIds = req.user.role === 'admin'
        ? (getAdminAssignment(req.user.id)
            ? getDescendantLocationIds(getAdminAssignment(req.user.id).unit_id)
            : [])
        : (profile?.location_unit_id ? [profile.location_unit_id] : []);
    const rows = getReportRowsForLocationIds(
        unitIds,
        req.user.role === 'user' ? req.user.id : null
    );
    res.json({ reports: rows.map(publicReport) });
});

app.get('/api/reports/:id/details', requireAuth, (req, res) => {
    const report = getAccessibleReport(req, req.params.id);
    if (!report) {
        return res.status(404).json({ error: 'That report could not be found in your neighbourhood.' });
    }
    const isOwner = report.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const history = db.prepare(`
        SELECT report_status_history.status, report_status_history.note,
               report_status_history.created_at, users.name AS actor_name,
               users.role AS actor_role, admin_approvals.title AS admin_title
        FROM report_status_history
        LEFT JOIN users ON users.id = report_status_history.actor_user_id
        LEFT JOIN admin_assignments ON admin_assignments.user_id = users.id
        LEFT JOIN admin_approvals
          ON admin_approvals.user_id = admin_assignments.user_id
         AND admin_approvals.unit_id = admin_assignments.unit_id
         AND admin_approvals.title = admin_assignments.title
        WHERE report_status_history.report_id = ?
        ORDER BY report_status_history.created_at, report_status_history.id
    `).all(report.id).map((entry) => ({
        status: entry.status,
        note: entry.note,
        created_at: entry.created_at,
        actor: entry.actor_role === 'admin'
            ? (entry.actor_name || 'Administrator') + (entry.admin_title ? ' · ' + entry.admin_title : '')
            : (entry.actor_name || 'System')
    }));
    const messages = isOwner || isAdmin ? db.prepare(`
        SELECT report_messages.body, report_messages.created_at, users.name AS sender_name,
               users.role AS sender_role, admin_approvals.title AS admin_title
        FROM report_messages
        LEFT JOIN users ON users.id = report_messages.sender_user_id
        LEFT JOIN admin_assignments
          ON admin_assignments.user_id = users.id
        LEFT JOIN admin_approvals
          ON admin_approvals.user_id = admin_assignments.user_id
         AND admin_approvals.unit_id = admin_assignments.unit_id
         AND admin_approvals.title = admin_assignments.title
        WHERE report_messages.report_id = ?
        ORDER BY report_messages.created_at, report_messages.id
    `).all(report.id).map((message) => ({
        body: message.body,
        createdAt: message.created_at,
        sender: message.sender_role === 'admin'
            ? (message.admin_title || 'Administrator')
            : (message.sender_name || 'Neighbour'),
        verifiedAdministrator: message.sender_role === 'admin' && Boolean(message.admin_title)
    })) : [];
    const evidence = db.prepare(`
        SELECT id, mime_type, data_url, evidence_type, created_at
        FROM report_evidence
        WHERE report_id = ?
        ORDER BY id
    `).all(report.id).map((photo) => ({
        id: photo.id,
        mimeType: photo.mime_type,
        dataUrl: photo.data_url,
        evidenceType: photo.evidence_type || 'before',
        createdAt: photo.created_at
    }));
    const counts = getConfirmationCounts(report.id, req.user.id);
    const milestones = db.prepare(`
        SELECT MIN(CASE WHEN status != 'reported' THEN created_at END) AS reviewed_at,
               MIN(CASE WHEN status = 'solved' THEN created_at END) AS solved_at
        FROM report_status_history
        WHERE report_id = ?
    `).get(report.id);
    const resident = req.user.role === 'user'
        ? db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id)
        : null;
    const myFlag = req.user.role === 'user' ? db.prepare(`
        SELECT reason, status
        FROM report_flags
        WHERE report_id = ? AND reporter_user_id = ?
    `).get(report.id, req.user.id) : null;
    const support = db.prepare(`
        SELECT COUNT(*) AS total
        FROM report_supports
        WHERE report_id = ?
    `).get(report.id).total;
    const ownSupport = req.user.role === 'user' ? db.prepare(`
        SELECT 1 FROM report_supports WHERE report_id = ? AND user_id = ?
    `).get(report.id, req.user.id) : null;
    res.json({
        id: report.id,
        status: report.status,
        priority: report.priority || 'medium',
        history,
        milestones: {
            submittedAt: report.created_at,
            reviewedAt: milestones.reviewed_at,
            solvedAt: milestones.solved_at,
            residentConfirmed: counts.yes > 0
        },
        messages,
        evidence,
        location: isOwner || isAdmin ? {
            latitude: report.latitude,
            longitude: report.longitude
        } : null,
        canMessage: isOwner || isAdmin,
        canConfirm: req.user.role === 'user',
        canFlag: Boolean(resident && resident.location_unit_id === report.location_unit_id),
        canSupport: Boolean(resident && resident.location_unit_id === report.location_unit_id),
        supportedByMe: Boolean(ownSupport),
        canManageEvidence: isAdmin,
        myFlag: myFlag || null,
        supportCount: support,
        confirmations: counts
    });
});

app.get('/api/community/statistics', requireAuth, (req, res) => {
    const profile = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
    if (!profile?.location_unit_id) {
        return res.status(409).json({ error: 'Connect your account to a neighbourhood to see local statistics.' });
    }
    const totals = db.prepare(`
        SELECT COUNT(*) AS reports,
               SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) AS solved,
               SUM(CASE WHEN status = 'progress' THEN 1 ELSE 0 END) AS inProgress,
               SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) AS reported
        FROM reports
        WHERE location_unit_id = ?
    `).get(profile.location_unit_id);
    res.json({
        area: getLocationPath(profile.location_unit_id).map((level) => level.name).join(' › '),
        totals: {
            reports: totals.reports,
            solved: totals.solved || 0,
            inProgress: totals.inProgress || 0,
            reported: totals.reported || 0
        }
    });
});

app.post('/api/reports/:id/messages', requireCsrf, requireAuth, (req, res) => {
    const report = getAccessibleReport(req, req.params.id);
    if (!report) {
        return res.status(404).json({ error: 'That report could not be found in your neighbourhood.' });
    }
    if (report.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the person who reported this issue and its assigned administrator can message each other.' });
    }
    const body = cleanString(req.body?.body);
    if (body.length < 1 || body.length > 600) {
        return res.status(400).json({ error: 'Enter a message between 1 and 600 characters.' });
    }
    db.transaction(() => {
        db.prepare(`
            INSERT INTO report_messages (report_id, sender_user_id, body)
            VALUES (?, ?, ?)
        `).run(report.id, req.user.id, body);
        if (req.user.role === 'admin') {
            addNotification({
                recipientUserId: report.user_id,
                actorUserId: req.user.id,
                reportId: report.id,
                eventKey: 'report_status',
                title: 'A verified administrator replied',
                message: report.title
            });
        } else {
            notifyAssignedAdmins(
                report.location_unit_id,
                report.id,
                'A resident replied: ' + report.title,
                'A resident replied about a report'
            );
        }
    })();
    res.status(201).json({ sent: true });
});

app.post('/api/reports/:id/confirmation', requireCsrf, requireAuth, (req, res) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only residents can confirm a neighbourhood issue.' });
    }
    const report = getAccessibleReport(req, req.params.id);
    if (!report) {
        return res.status(404).json({ error: 'That report could not be found in your neighbourhood.' });
    }
    if (report.status !== 'solved') {
        return res.status(409).json({ error: 'You can confirm the result after an administrator marks it resolved.' });
    }
    if (typeof req.body?.solved !== 'boolean') {
        return res.status(400).json({ error: 'Choose whether the issue has been resolved.' });
    }
    db.prepare(`
        INSERT INTO report_confirmations (report_id, user_id, vote)
        VALUES (?, ?, ?)
        ON CONFLICT(report_id, user_id) DO UPDATE SET
            vote = excluded.vote,
            updated_at = CURRENT_TIMESTAMP
    `).run(report.id, req.user.id, req.body.solved ? 1 : 0);
    res.json({ confirmations: getConfirmationCounts(report.id, req.user.id) });
});

app.post('/api/reports/:id/support', requireCsrf, requireAuth, (req, res) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only residents can support a neighbourhood report.' });
    }
    const report = getAccessibleReport(req, req.params.id);
    const resident = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
    if (!report || resident?.location_unit_id !== report.location_unit_id) {
        return res.status(404).json({ error: 'That report could not be found in your neighbourhood.' });
    }
    if (typeof req.body?.supported !== 'boolean') {
        return res.status(400).json({ error: 'Choose whether to support this report.' });
    }
    if (req.body.supported) {
        db.prepare(`
            INSERT OR IGNORE INTO report_supports (report_id, user_id)
            VALUES (?, ?)
        `).run(report.id, req.user.id);
    } else {
        db.prepare('DELETE FROM report_supports WHERE report_id = ? AND user_id = ?')
            .run(report.id, req.user.id);
    }
    const supportCount = db.prepare(`
        SELECT COUNT(*) AS total FROM report_supports WHERE report_id = ?
    `).get(report.id).total;
    res.json({ supported: req.body.supported, supportCount });
});

app.post('/api/reports/:id/flags', requireCsrf, requireAuth, (req, res) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Only residents can flag a community report.' });
    }
    const report = getAccessibleReport(req, req.params.id);
    const resident = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
    if (!report || resident?.location_unit_id !== report.location_unit_id) {
        return res.status(404).json({ error: 'That report could not be found in your neighbourhood.' });
    }
    const reason = cleanString(req.body?.reason);
    const details = cleanString(req.body?.details);
    if (!allowedFlagReasons.has(reason)) {
        return res.status(400).json({ error: 'Choose a valid reason for flagging this report.' });
    }
    if (details.length > 300) {
        return res.status(400).json({ error: 'Flag details must be no more than 300 characters.' });
    }
    db.prepare(`
        INSERT INTO report_flags (report_id, reporter_user_id, reason, details)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(report_id, reporter_user_id) DO UPDATE SET
            reason = excluded.reason,
            details = excluded.details,
            status = 'open',
            admin_note = NULL,
            reviewed_by = NULL,
            reviewed_at = NULL,
            created_at = CURRENT_TIMESTAMP
    `).run(report.id, req.user.id, reason, details || null);
    res.status(201).json({ submitted: true });
});

app.post('/api/reports', requireCsrf, requireAuth, (req, res) => {
    const title = cleanString(req.body?.title);
    const category = cleanString(req.body?.category);
    const description = cleanString(req.body?.description);
    const location = cleanString(req.body?.location);
    const priority = cleanString(req.body?.priority || 'medium');
    const latitude = req.body?.latitude === null || req.body?.latitude === undefined
        ? null : req.body.latitude;
    const longitude = req.body?.longitude === null || req.body?.longitude === undefined
        ? null : req.body.longitude;
    const evidenceResult = validateEvidencePhotos(req.body?.evidence === undefined ? [] : req.body.evidence, 3);

    if (title.length < 1 || title.length > 90) {
        return res.status(400).json({ error: 'Please enter a title between 1 and 90 characters.' });
    }
    if (!allowedCategories.has(category)) {
        return res.status(400).json({ error: 'Please choose one of the listed categories.' });
    }
    if (description.length < 1 || description.length > 600) {
        return res.status(400).json({ error: 'Please enter a description between 1 and 600 characters.' });
    }
    if (location.length < 1 || location.length > 120) {
        return res.status(400).json({ error: 'Please enter a location between 1 and 120 characters.' });
    }
    if (!allowedPriorities.has(priority)) {
        return res.status(400).json({ error: 'Choose a valid issue priority.' });
    }
    if ((latitude === null) !== (longitude === null) ||
        (latitude !== null && (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude !== null && (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
        return res.status(400).json({ error: 'The location coordinates are invalid. Please try again or leave the exact location blank.' });
    }
    if (evidenceResult.error) {
        return res.status(400).json({ error: evidenceResult.error });
    }
    const profile = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
    if (!profile?.location_unit_id) {
        return res.status(409).json({ error: 'Choose your neighbourhood before sharing a report.' });
    }

    const locationPath = JSON.stringify(getLocationPath(profile.location_unit_id));
    const id = db.transaction(() => {
        const year = new Date().getFullYear();
        const prefix = 'MTF-' + year + '-';
        const lastNumber = db.prepare(`
            SELECT MAX(CAST(substr(id, ?) AS INTEGER)) AS number
            FROM reports
            WHERE id LIKE ?
        `).get(prefix.length + 1, prefix + '%').number || 0;
        const newId = prefix + String(lastNumber + 1).padStart(5, '0');
        db.prepare(`
            INSERT INTO reports (
                id, user_id, title, category, description, location,
                location_unit_id, area_name, location_path_snapshot,
                priority, latitude, longitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newId, req.user.id, title, category, description, location,
            profile.location_unit_id, location, locationPath,
            priority, latitude, longitude
        );
        db.prepare(`
            INSERT INTO report_status_history (report_id, status, actor_user_id, note)
            VALUES (?, 'reported', ?, 'Report submitted')
        `).run(newId, req.user.id);
        const addEvidence = db.prepare(`
            INSERT INTO report_evidence (report_id, mime_type, data_url, evidence_type)
            VALUES (?, ?, ?, 'before')
        `);
        evidenceResult.photos.forEach((photo) => addEvidence.run(newId, photo.mimeType, photo.dataUrl));
        notifyAssignedAdmins(profile.location_unit_id, newId, title);
        return newId;
    })();

    const created = db.prepare(`
        SELECT reports.id, reports.title, reports.category, reports.description,
               reports.location, reports.area_name, reports.location_unit_id,
               reports.location_path_snapshot, reports.status, reports.priority, reports.created_at
        FROM reports
        WHERE reports.id = ?
    `).get(id);
    res.status(201).json({ report: publicReport(created) });
});

app.get('/api/admin/reports', requireAuth, requireAdmin, (req, res) => {
    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    const rows = getReportRowsForLocationIds(unitIds);
    const reports = rows.map(publicReport);
    const placeholders = unitIds.map(() => '?').join(', ');
    const residents = db.prepare(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'user' AND location_unit_id IN (${placeholders})
    `).get(...unitIds).count;
    const counts = reports.reduce((result, report) => {
        result.total += 1;
        result[report.status] += 1;
        return result;
    }, { total: 0, reported: 0, progress: 0, solved: 0, residents });
    counts.overdue = db.prepare(`
        SELECT COUNT(*) AS total
        FROM reports
        WHERE location_unit_id IN (${unitIds.map(() => '?').join(', ')})
          AND status != 'solved'
          AND created_at <= datetime('now', '-14 days')
    `).get(...unitIds).total;

    res.json({ reports, counts, administrativeArea: getSafeUser(req.user).administrativeArea });
});

app.get('/api/admin/statistics', requireAuth, requireAdmin, (req, res) => {
    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    if (unitIds.length === 0) {
        return res.status(500).json({ error: 'The assigned administrative area could not be loaded.' });
    }
    const placeholders = unitIds.map(() => '?').join(', ');
    const byCategory = db.prepare(`
        SELECT category, COUNT(*) AS total
        FROM reports
        WHERE location_unit_id IN (${placeholders})
        GROUP BY category
        ORDER BY total DESC, category
    `).all(...unitIds);
    const byMonth = db.prepare(`
        SELECT substr(created_at, 1, 7) AS month, status, COUNT(*) AS total
        FROM reports
        WHERE location_unit_id IN (${placeholders})
          AND created_at >= date('now', '-11 months', 'start of month')
        GROUP BY month, status
        ORDER BY month, status
    `).all(...unitIds);
    const byPriority = db.prepare(`
        SELECT priority, COUNT(*) AS total
        FROM reports
        WHERE location_unit_id IN (${placeholders})
        GROUP BY priority
        ORDER BY total DESC, priority
    `).all(...unitIds);
    const byLocation = db.prepare(`
        SELECT administrative_units.id AS unit_id,
               COALESCE(NULLIF(reports.area_name, ''), reports.location) AS area,
               COUNT(*) AS total
        FROM reports
        JOIN administrative_units ON administrative_units.id = reports.location_unit_id
        WHERE reports.location_unit_id IN (${placeholders})
        GROUP BY administrative_units.id, area
        ORDER BY total DESC, unit_id, area
        LIMIT 20
    `).all(...unitIds).map((entry) => ({
        area: entry.area,
        locationPath: getLocationPath(entry.unit_id).map((level) => level.name).join(' › '),
        total: entry.total
    }));
    const hotspots = db.prepare(`
        SELECT location_unit_id, category,
               COALESCE(NULLIF(area_name, ''), location) AS area, COUNT(*) AS total
        FROM reports
        WHERE location_unit_id IN (${placeholders})
          AND created_at >= date('now', '-30 days')
        GROUP BY location_unit_id, category, area
        HAVING COUNT(*) >= 3
        ORDER BY total DESC, area, category
        LIMIT 10
    `).all(...unitIds).map((entry) => ({
        category: entry.category,
        area: entry.area,
        locationPath: getLocationPath(entry.location_unit_id).map((level) => level.name).join(' › '),
        total: entry.total
    }));
    const totals = db.prepare(`
        SELECT COUNT(*) AS reports,
               SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) AS reported,
               SUM(CASE WHEN status = 'progress' THEN 1 ELSE 0 END) AS inProgress,
               SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) AS solved
        FROM reports
        WHERE location_unit_id IN (${placeholders})
    `).get(...unitIds);
    const overdue = db.prepare(`
        SELECT COUNT(*) AS total
        FROM reports
        WHERE location_unit_id IN (${placeholders})
          AND status != 'solved'
          AND created_at <= datetime('now', '-14 days')
    `).get(...unitIds).total;
    const averageResolutionDays = db.prepare(`
        SELECT AVG(julianday(resolved.solved_at) - julianday(reports.created_at)) AS average_days
        FROM reports
        JOIN (
            SELECT report_id, MIN(created_at) AS solved_at
            FROM report_status_history
            WHERE status = 'solved'
            GROUP BY report_id
        ) AS resolved ON resolved.report_id = reports.id
        WHERE reports.location_unit_id IN (${placeholders})
    `).get(...unitIds).average_days;
    res.json({
        totals,
        byCategory,
        byMonth,
        byPriority,
        byLocation,
        hotspots,
        overdue,
        averageResolutionDays: Math.round((averageResolutionDays || 0) * 10) / 10
    });
});

app.get('/api/admin/flags', requireAuth, requireAdmin, (req, res) => {
    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    if (unitIds.length === 0) {
        return res.status(500).json({ error: 'The assigned administrative area could not be loaded.' });
    }
    const rows = db.prepare(`
        SELECT report_flags.id, report_flags.report_id, report_flags.reason,
               report_flags.details, report_flags.status, report_flags.admin_note,
               report_flags.created_at, reports.title AS report_title,
               reports.category, reports.location
        FROM report_flags
        JOIN reports ON reports.id = report_flags.report_id
        WHERE reports.location_unit_id IN (${unitIds.map(() => '?').join(', ')})
        ORDER BY CASE report_flags.status WHEN 'open' THEN 0 ELSE 1 END,
                 report_flags.created_at DESC, report_flags.id DESC
        LIMIT 100
    `).all(...unitIds);
    res.json({ flags: rows.map((row) => ({
        id: row.id,
        reportId: row.report_id,
        reportTitle: row.report_title,
        category: row.category,
        location: row.location,
        reason: row.reason,
        details: row.details,
        status: row.status,
        adminNote: row.admin_note,
        createdAt: row.created_at
    })) });
});

app.patch('/api/admin/flags/:id', requireCsrf, requireAuth, requireAdmin, (req, res) => {
    const status = cleanString(req.body?.status);
    const note = cleanString(req.body?.note);
    if (!['reviewed', 'dismissed'].includes(status)) {
        return res.status(400).json({ error: 'Choose whether to confirm or dismiss this flag.' });
    }
    if (note.length > 300) {
        return res.status(400).json({ error: 'A moderation note must be no more than 300 characters.' });
    }
    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    if (unitIds.length === 0) {
        return res.status(500).json({ error: 'The assigned administrative area could not be loaded.' });
    }
    const result = db.prepare(`
        UPDATE report_flags
        SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND report_id IN (
              SELECT id FROM reports WHERE location_unit_id IN (${unitIds.map(() => '?').join(', ')})
          )
    `).run(status, note || null, req.user.id, req.params.id, ...unitIds);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'That flag could not be found in your administrative area.' });
    }
    res.json({ id: Number(req.params.id), status });
});

app.patch('/api/admin/reports/:id/status', requireCsrf, requireAuth, requireAdmin, (req, res) => {
    const status = cleanString(req.body?.status);
    const note = cleanString(req.body?.note);
    if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Please choose a valid report status.' });
    }
    if (note.length > 300) {
        return res.status(400).json({ error: 'An update note must be no more than 300 characters.' });
    }

    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    const placeholders = unitIds.map(() => '?').join(', ');
    const report = db.prepare(`
        SELECT id, user_id, title, status
        FROM reports
        WHERE id = ? AND location_unit_id IN (${placeholders})
    `).get(req.params.id, ...unitIds);
    if (!report) {
        return res.status(404).json({ error: 'That report could not be found in your administrative area.' });
    }

    db.transaction(() => {
        db.prepare(`
        UPDATE reports
        SET status = ?
        WHERE id = ? AND location_unit_id IN (${placeholders})
        `).run(status, req.params.id, ...unitIds);
        if (report.status !== status) {
            db.prepare(`
                INSERT INTO report_status_history (report_id, status, actor_user_id, note)
                VALUES (?, ?, ?, ?)
            `).run(report.id, status, req.user.id, note || null);
            addNotification({
                recipientUserId: report.user_id,
                actorUserId: req.user.id,
                reportId: report.id,
                eventKey: 'report_status',
                title: 'Your report was updated',
                message: report.title + ' — ' + ({
                    reported: 'Just reported',
                    progress: 'Being worked on',
                    solved: 'Resolved'
                })[status]
            });
        }
    })();

    res.json({ id: req.params.id, status });
});

app.post('/api/admin/reports/:id/evidence', requireCsrf, requireAuth, requireAdmin, (req, res) => {
    const evidenceResult = validateEvidencePhotos(req.body?.evidence, 3);
    if (evidenceResult.error) {
        return res.status(400).json({ error: evidenceResult.error });
    }
    if (evidenceResult.photos.length === 0) {
        return res.status(400).json({ error: 'Choose at least one after photo to upload.' });
    }
    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    if (unitIds.length === 0) {
        return res.status(500).json({ error: 'The assigned administrative area could not be loaded.' });
    }
    const report = db.prepare(`
        SELECT id, user_id, title
        FROM reports
        WHERE id = ? AND location_unit_id IN (${unitIds.map(() => '?').join(', ')})
    `).get(req.params.id, ...unitIds);
    if (!report) {
        return res.status(404).json({ error: 'That report could not be found in your administrative area.' });
    }
    const existingAfterPhotos = db.prepare(`
        SELECT COUNT(*) AS total
        FROM report_evidence
        WHERE report_id = ? AND evidence_type = 'after'
    `).get(report.id).total;
    if (existingAfterPhotos + evidenceResult.photos.length > 3) {
        return res.status(409).json({ error: 'A report can have no more than three completion photos.' });
    }
    db.transaction(() => {
        const addEvidence = db.prepare(`
            INSERT INTO report_evidence (report_id, mime_type, data_url, evidence_type)
            VALUES (?, ?, ?, 'after')
        `);
        evidenceResult.photos.forEach((photo) => addEvidence.run(report.id, photo.mimeType, photo.dataUrl));
        addNotification({
            recipientUserId: report.user_id,
            actorUserId: req.user.id,
            reportId: report.id,
            eventKey: 'report_status',
            title: 'Completion photos added',
            message: report.title
        });
    })();
    res.status(201).json({ added: evidenceResult.photos.length });
});

app.patch('/api/admin/reports/:id/priority', requireCsrf, requireAuth, requireAdmin, (req, res) => {
    const priority = cleanString(req.body?.priority);
    if (!allowedPriorities.has(priority)) {
        return res.status(400).json({ error: 'Choose a valid issue priority.' });
    }
    const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
    if (unitIds.length === 0) {
        return res.status(500).json({ error: 'The assigned administrative area could not be loaded.' });
    }
    const placeholders = unitIds.map(() => '?').join(', ');
    const result = db.prepare(`
        UPDATE reports SET priority = ?
        WHERE id = ? AND location_unit_id IN (${placeholders})
    `).run(priority, req.params.id, ...unitIds);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'That report could not be found in your administrative area.' });
    }
    res.json({ id: req.params.id, priority });
});

app.get('/api/notifications', requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT id, event_key, title, message, report_id, announcement_id,
               created_at, read_at
        FROM notifications
        WHERE recipient_user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 50
    `).all(req.user.id);
    res.json({
        notifications: rows.map((row) => ({
            id: row.id,
            type: row.event_key,
            title: row.title,
            message: row.message,
            reportId: row.report_id,
            announcementId: row.announcement_id,
            createdAt: row.created_at,
            readAt: row.read_at
        }))
    });
});

app.patch('/api/notifications/:id/read', requireCsrf, requireAuth, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Choose a valid notification.' });
    }
    const result = db.prepare(`
        UPDATE notifications
        SET read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND recipient_user_id = ? AND read_at IS NULL
    `).run(id, req.user.id);
    if (result.changes === 0) {
        const owned = db.prepare(`
            SELECT id FROM notifications
            WHERE id = ? AND recipient_user_id = ?
        `).get(id, req.user.id);
        if (!owned) {
            return res.status(404).json({ error: 'That notification could not be found.' });
        }
    }
    res.json({ id, read: true });
});

app.get('/api/announcements', (req, res) => {
    if (!req.user) {
        return res.json({ announcements: [] });
    }
    const profile = db.prepare('SELECT location_unit_id FROM users WHERE id = ?').get(req.user.id);
    if (!profile?.location_unit_id) {
        return res.json({ announcements: [] });
    }
    const unitIds = getAncestorLocationIds(profile.location_unit_id);
    const placeholders = unitIds.map(() => '?').join(', ');
    const rows = db.prepare(`
        SELECT announcements.id, announcements.title, announcements.body,
               announcements.created_at, announcements.unit_id
        FROM announcements
        WHERE announcements.unit_id IN (${placeholders})
        ORDER BY announcements.created_at DESC
        LIMIT 20
    `).all(...unitIds);
    res.json({
        announcements: rows.map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body,
            createdAt: row.created_at,
            locationPath: getLocationPath(row.unit_id).map((level) => level.name).join(' › ')
        }))
    });
});

app.get('/api/admin/announcements', requireAuth, requireAdmin, (req, res) => {
    const rows = db.prepare(`
        SELECT id, title, body, created_at
        FROM announcements
        WHERE admin_user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
    `).all(req.user.id);
    res.json({
        announcements: rows.map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body,
            createdAt: row.created_at
        }))
    });
});

app.post('/api/admin/announcements', requireCsrf, requireAuth, requireAdmin, (req, res) => {
    const title = cleanString(req.body?.title);
    const body = cleanString(req.body?.body);
    if (title.length < 1 || title.length > 90) {
        return res.status(400).json({ error: 'Enter an update title between 1 and 90 characters.' });
    }
    if (body.length < 1 || body.length > 600) {
        return res.status(400).json({ error: 'Enter an update message between 1 and 600 characters.' });
    }
    const result = db.transaction(() => {
        const inserted = db.prepare(`
            INSERT INTO announcements (admin_user_id, unit_id, title, body)
            VALUES (?, ?, ?, ?)
        `).run(req.user.id, req.adminAssignment.unit_id, title, body);
        const announcementId = Number(inserted.lastInsertRowid);
        const unitIds = getDescendantLocationIds(req.adminAssignment.unit_id);
        if (unitIds.length > 0) {
            const placeholders = unitIds.map(() => '?').join(', ');
            const residents = db.prepare(`
                SELECT id
                FROM users
                WHERE role = 'user' AND location_unit_id IN (${placeholders})
            `).all(...unitIds);
            residents.forEach((resident) => addNotification({
                recipientUserId: resident.id,
                actorUserId: req.user.id,
                announcementId,
                eventKey: 'area_announcement',
                title,
                message: body
            }));
        }
        return announcementId;
    })();
    res.status(201).json({
        announcement: {
            id: result,
            title,
            body,
            createdAt: new Date().toISOString()
        }
    });
});

app.get('/', (req, res) => res.sendFile(path.join(projectDirectory, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(projectDirectory, 'index.html')));
app.get('/pages/:page', (req, res, next) => {
    const pageFiles = new Set([
        'report.html',
        'reports.html',
        'login.html',
        'register.html',
        'admin.html',
        'profile.html',
        'notifications.html'
    ]);
    if (!pageFiles.has(req.params.page)) {
        return next();
    }
    res.sendFile(path.join(projectDirectory, 'pages', req.params.page));
});
app.get('/app.css', (req, res) => res.sendFile(path.join(projectDirectory, 'app.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(projectDirectory, 'script.js')));
app.get('/assets/community-unity.jpg', (req, res) => res.sendFile(path.join(projectDirectory, 'assets', 'community-unity.jpg')));

app.use('/api', (req, res) => res.status(404).json({ error: 'That API route does not exist.' }));
app.use((req, res) => res.status(404).type('text').send('Page not found.'));
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ error: 'Please send valid JSON.' });
    }
    console.error(error);
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    res.status(500).type('text').send('Something went wrong.');
});

const host = process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1');
const server = app.listen(port, host, () => {
    console.log('MtaaFix is listening on port ' + port + '. Open http://localhost:' + port);
});

function shutdown() {
    server.close(() => {
        closeDatabase();
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

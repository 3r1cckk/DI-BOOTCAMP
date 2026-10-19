import { closeDatabase, db, locationCatalogReady } from '../database.js';

const [rawEmail, areaPath, title, approvedBy, verificationNote = ''] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !areaPath?.trim() ||
    !title?.trim() ||
    title.trim().length > 80 ||
    !approvedBy?.trim() ||
    approvedBy.trim().length > 80 ||
    verificationNote.trim().length > 240
) {
    console.error('Usage: npm run admin:promote -- person@example.com "County > Sub-County > Ward" "Administrator title" "Approving operator" ["Verification note"]');
    closeDatabase();
    process.exitCode = 1;
} else if (!locationCatalogReady) {
    console.error('Administrator access requires the verified Kenya location catalog. Install it before assigning local administrators.');
    closeDatabase();
    process.exitCode = 1;
} else {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
        console.error('No account found for that email. Register the account first, then run this command again.');
        closeDatabase();
        process.exitCode = 1;
    } else {
        const unit = db.prepare(`
            WITH RECURSIVE unit_paths(id, parent_id, path) AS (
                SELECT id, parent_id, name
                FROM administrative_units
                UNION ALL
                SELECT unit_paths.id, parent.parent_id, parent.name || ' > ' || unit_paths.path
                FROM unit_paths
                JOIN administrative_units AS parent ON parent.id = unit_paths.parent_id
            )
            SELECT id
            FROM unit_paths
            WHERE parent_id IS NULL AND lower(path) = lower(?)
        `).get(areaPath.trim());

        if (!unit) {
            console.error('No administrative area matches "' + areaPath.trim() + '". Use the exact county-to-area names shown in registration.');
            closeDatabase();
            process.exitCode = 1;
        } else {
            db.transaction(() => {
                db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
                db.prepare(`
                    INSERT INTO admin_assignments (user_id, unit_id, title)
                    VALUES (?, ?, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        unit_id = excluded.unit_id,
                        title = excluded.title
                `).run(user.id, unit.id, title.trim());
                db.prepare(`
                    INSERT INTO admin_approvals (
                        user_id, unit_id, title, approved_by, verification_note, approved_at
                    )
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id) DO UPDATE SET
                        unit_id = excluded.unit_id,
                        title = excluded.title,
                        approved_by = excluded.approved_by,
                        verification_note = excluded.verification_note,
                        approved_at = CURRENT_TIMESTAMP
                `).run(user.id, unit.id, title.trim(), approvedBy.trim(), verificationNote.trim() || null);
                db.prepare(`
                    INSERT INTO admin_approval_audit (
                        user_id, unit_id, title, approved_by, verification_note
                    )
                    VALUES (?, ?, ?, ?, ?)
                `).run(user.id, unit.id, title.trim(), approvedBy.trim(), verificationNote.trim() || null);
            })();
            console.log('Administrator access approved for ' + email + ' by ' + approvedBy.trim() + ' for ' + areaPath.trim() + ' as ' + title.trim() + '. Sign out and sign in again.');
            closeDatabase();
        }
    }
}

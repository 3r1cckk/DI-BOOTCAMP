import { randomBytes } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { DatabaseSync } from 'node:sqlite';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(process.env.AKIBA_DATA_DIR || 'data');
const databasePath = process.env.AKIBA_DB_PATH || path.join(dataDirectory, 'akiba.sqlite');
let database;
let databasePromise;

export async function getDatabase() {
  if (databasePromise) return databasePromise;
  if (database) return database;
  databasePromise = initializeDatabase();
  try {
    return await databasePromise;
  } catch (error) {
    database?.close();
    database = undefined;
    databasePromise = undefined;
    throw error;
  }
}

async function initializeDatabase() {
  await mkdir(path.dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  const db = database;
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.transaction = (operation) => {
    const execute = () => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = operation();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    };
    execute.immediate = execute;
    return execute;
  };
  const migration = await readFile(path.join(serverDirectory, 'migrations', '001_initial_schema.sql'), 'utf8');
  db.exec(migration);
  db.exec(`
    CREATE TABLE IF NOT EXISTS legacy_import_state (
      source TEXT PRIMARY KEY,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await importLegacyJson(db);
  return db;
}

export function closeDatabase() {
  if (!database) return;
  database.close();
  database = undefined;
  databasePromise = undefined;
}

export function writeAuditLog(db, { actorId, chamaId, action, entityType, entityId, metadata = {} }) {
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, chama_id, action, entity_type, entity_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomBytes(16).toString('hex'), actorId, chamaId, action, entityType, entityId, JSON.stringify(metadata));
}

async function importLegacyJson(db) {
  const imported = db.prepare('SELECT 1 FROM legacy_import_state WHERE source = ?').get('accounts.json');
  if (imported) return;

  let legacy;
  try {
    legacy = JSON.parse(await readFile(path.join(dataDirectory, 'accounts.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      db.prepare('INSERT INTO legacy_import_state (source) VALUES (?)').run('accounts.json');
      return;
    }
    throw error;
  }
  const accounts = Array.isArray(legacy.accounts) ? legacy.accounts : [];
  const chamaData = legacy.chamaData || {};
  const members = Array.isArray(chamaData.members) ? chamaData.members : [];
  const transactions = Array.isArray(chamaData.transactions) ? chamaData.transactions : [];
  const loans = Array.isArray(chamaData.loans) ? chamaData.loans : [];
  const chamaId = randomBytes(16).toString('hex');
  const memberById = new Map();
  const memberByEmail = new Map();
  const runImport = db.transaction(() => {
    if (!accounts.length && !members.length) {
      db.prepare('INSERT INTO legacy_import_state (source) VALUES (?)').run('accounts.json');
      return;
    }

    db.prepare('INSERT INTO chamas (id, name) VALUES (?, ?)').run(chamaId, 'My Chama');
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_salt, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const account of accounts) {
      if (!account.id || !account.email || !account.salt || !account.passwordHash) continue;
      insertUser.run(account.id, account.name || account.email, account.email, account.salt, account.passwordHash);
      memberByEmail.set(account.email.toLowerCase(), account);
    }

    const insertMembership = db.prepare(`
      INSERT INTO memberships
        (id, chama_id, user_id, role, status, phone, id_number, joined_date, total_saved, monthly_pledge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ensureUserForMember = (member) => {
      const email = String(member.email || `${member.id}@legacy.invalid`).toLowerCase();
      const existingAccount = memberByEmail.get(email);
      if (existingAccount) return existingAccount;
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
      if (existingUser) return { id: existingUser.id };
      const id = randomBytes(16).toString('hex');
      insertUser.run(id, member.name || email, email, randomBytes(16).toString('base64'), randomBytes(64).toString('base64'));
      return { id };
    };

    for (const member of members) {
      const account = ensureUserForMember(member);
      const role = normalizeRole(account.role === 'admin' ? 'admin' : member.role);
      const membershipId = randomBytes(16).toString('hex');
      insertMembership.run(
        membershipId, chamaId, account.id, role,
        ['pending', 'active', 'rejected', 'inactive'].includes(member.status) ? member.status : 'active',
        member.phone || '', member.idNumber || '', member.joinedDate || new Date().toISOString().slice(0, 10),
        Number(member.totalSaved) || 0, Number(member.monthlyPledge) || 0
      );
      memberById.set(member.id, { id: membershipId, userId: account.id, member });
    }

    for (const account of accounts) {
      if (db.prepare('SELECT 1 FROM memberships WHERE chama_id = ? AND user_id = ?').get(chamaId, account.id)) continue;
      const linked = [...memberById.values()].find((item) => item.userId === account.id);
      const member = linked?.member || {};
      insertMembership.run(
        randomBytes(16).toString('hex'), chamaId, account.id,
        account.role === 'admin' ? 'admin' : normalizeRole(account.role), 'active',
        member.phone || '', member.idNumber || '', member.joinedDate || new Date().toISOString().slice(0, 10),
        Number(member.totalSaved) || 0, Number(member.monthlyPledge) || 0
      );
    }

    const insertContribution = db.prepare(`
      INSERT INTO contributions
        (id, chama_id, membership_id, amount, type, status, payment_method, reference, notes, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const transaction of transactions) {
      const member = memberById.get(transaction.memberId);
      if (!member || !(Number(transaction.amount) > 0)) continue;
      const status = transaction.status === 'pending' ? 'pending' : transaction.status === 'failed' ? 'rejected' : 'confirmed';
      insertContribution.run(
        transaction.id || randomBytes(16).toString('hex'), chamaId, member.id, Number(transaction.amount),
        transaction.type || 'contribution', status, transaction.paymentMethod || 'cash',
        transaction.mpesaRef || null, transaction.notes || '', transaction.date || new Date().toISOString()
      );
    }

    const insertLoan = db.prepare(`
      INSERT INTO loans
        (id, chama_id, membership_id, amount, interest_rate, duration_months, start_date, due_date,
         monthly_installment, total_repayment, amount_repaid, guarantor_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const loan of loans) {
      const member = memberById.get(loan.memberId);
      if (!member || !(Number(loan.amount) > 0)) continue;
      insertLoan.run(
        loan.id || randomBytes(16).toString('hex'), chamaId, member.id, Number(loan.amount),
        Number(loan.interestRate) || 0, Math.max(1, Number(loan.durationMonths) || 1),
        loan.startDate || null, loan.dueDate || null, Number(loan.monthlyInstallment) || 0,
        Number(loan.totalRepayment) || 0, Number(loan.amountRepaid) || 0,
        loan.guarantorName || '', ['pending', 'approved', 'active', 'completed', 'rejected'].includes(loan.status) ? loan.status : 'pending'
      );
    }

    db.prepare('INSERT INTO legacy_import_state (source) VALUES (?)').run('accounts.json');
  });
  runImport();
}

function normalizeRole(value) {
  const role = String(value || 'member').toLowerCase();
  return ['member', 'treasurer', 'secretary', 'chairperson', 'admin'].includes(role) ? role : 'member';
}

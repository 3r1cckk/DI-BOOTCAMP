import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const schemaPath = new URL('../database/schema.sql', import.meta.url);

export function createDatabase(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(schemaPath, 'utf8'));
  return db;
}

function serialize(record) {
  return JSON.stringify(record);
}

function insertRecords(db, table, records) {
  const insert = db.prepare(`insert into ${table} (id, ${table === 'members' ? '' : 'member_id, '}data) values (?, ${table === 'members' ? '' : '?, '}?)`);
  for (const record of records) {
    if (table === 'members') {
      insert.run(record.id, serialize(record));
    } else {
      insert.run(record.id, record.memberId, serialize(record));
    }
  }
}

export function initializeDatabase(db, { members, loans, transactions }) {
  db.exec('begin immediate');
  try {
    const recordsExist = db.prepare(
      'select exists(select 1 from members) or exists(select 1 from loans) or exists(select 1 from transactions) as found',
    ).get();
    if (recordsExist.found) {
      db.exec('rollback');
      return false;
    }

    insertRecords(db, 'members', members);
    insertRecords(db, 'loans', loans);
    insertRecords(db, 'transactions', transactions);
    db.exec('commit');
    return true;
  } catch (error) {
    db.exec('rollback');
    throw error;
  }
}

export function loadDatabaseData(db) {
  const read = (table) => db.prepare(`select data from ${table} order by rowid`).all()
    .map(({ data }) => JSON.parse(data));

  return {
    members: read('members'),
    loans: read('loans'),
    transactions: read('transactions').reverse(),
  };
}

export function saveMember(db, member) {
  db.prepare('insert into members (id, data) values (?, ?)').run(member.id, serialize(member));
}

export function saveLoan(db, loan) {
  db.prepare('insert into loans (id, member_id, data) values (?, ?, ?)')
    .run(loan.id, loan.memberId, serialize(loan));
}

function saveTransaction(db, transaction) {
  db.prepare('insert into transactions (id, member_id, mpesa_ref, data) values (?, ?, ?, ?)')
    .run(transaction.id, transaction.memberId, transaction.mpesaRef?.trim().toUpperCase() || null, serialize(transaction));
}

function updateMemberSavings(db, memberId, amount) {
  const result = db.prepare(`
    update members
    set data = json_set(data, '$.totalSaved', coalesce(json_extract(data, '$.totalSaved'), 0) + ?)
    where id = ?
  `).run(amount, memberId);
  if (result.changes === 0) throw new Error(`Member ${memberId} does not exist.`);
}

export function recordContribution(db, transaction) {
  db.exec('begin immediate');
  try {
    if (transaction.amount <= 0) throw new Error('Contribution amount must be greater than zero.');
    updateMemberSavings(db, transaction.memberId, transaction.amount);
    saveTransaction(db, transaction);
    db.exec('commit');
  } catch (error) {
    db.exec('rollback');
    throw error;
  }
}

export function recordMpesaPayment(db, transaction) {
  db.exec('begin immediate');
  try {
    if (transaction.amount <= 0) throw new Error('Payment amount must be greater than zero.');

    if (transaction.type === 'contribution' || transaction.type === 'welfare') {
      updateMemberSavings(db, transaction.memberId, transaction.amount);
    } else if (transaction.type === 'loan_repayment') {
      const result = db.prepare(`
        update loans
        set data = json_set(data, '$.amountRepaid', coalesce(json_extract(data, '$.amountRepaid'), 0) + ?)
        where member_id = ? and json_extract(data, '$.status') = 'active'
      `).run(transaction.amount, transaction.memberId);
      if (result.changes === 0) throw new Error(`Member ${transaction.memberId} has no active loan.`);
    } else {
      throw new Error(`Unsupported M-PESA payment type: ${transaction.type}`);
    }

    saveTransaction(db, transaction);
    db.exec('commit');
  } catch (error) {
    db.exec('rollback');
    throw error;
  }
}

export function approveLoan(db, loanId, transaction) {
  db.exec('begin immediate');
  try {
    const result = db.prepare(`
      update loans
      set data = json_set(data, '$.status', 'active')
      where id = ? and member_id = ? and json_extract(data, '$.status') = 'pending'
    `).run(loanId, transaction.memberId);

    if (result.changes === 0) throw new Error(`Pending loan ${loanId} does not exist.`);
    saveTransaction(db, transaction);
    db.exec('commit');
  } catch (error) {
    db.exec('rollback');
    throw error;
  }
}

export function rejectLoan(db, loanId) {
  const result = db.prepare(`
    update loans
    set data = json_set(data, '$.status', 'rejected')
    where id = ? and json_extract(data, '$.status') = 'pending'
  `).run(loanId);

  if (result.changes === 0) throw new Error(`Pending loan ${loanId} does not exist.`);
}

export function createUser(db, { id, email, passwordHash, passwordSalt }) {
  db.prepare(`
    insert into users (id, email, password_hash, password_salt)
    values (?, ?, ?, ?)
  `).run(id, email, passwordHash, passwordSalt);
}

export function getUserByEmail(db, email) {
  return db.prepare(`
    select id, email, password_hash as passwordHash, password_salt as passwordSalt
    from users
    where email = ?
  `).get(email);
}

export function createSession(db, { tokenHash, userId, expiresAt }) {
  db.prepare('insert into sessions (token_hash, user_id, expires_at) values (?, ?, ?)')
    .run(tokenHash, userId, expiresAt);
}

export function getSessionUser(db, tokenHash, now = Date.now()) {
  db.prepare('delete from sessions where expires_at <= ?').run(now);
  return db.prepare(`
    select users.id, users.email
    from sessions
    join users on users.id = sessions.user_id
    where sessions.token_hash = ? and sessions.expires_at > ?
  `).get(tokenHash, now);
}

export function deleteSession(db, tokenHash) {
  db.prepare('delete from sessions where token_hash = ?').run(tokenHash);
}

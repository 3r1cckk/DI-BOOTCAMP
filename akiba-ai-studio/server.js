import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import express from 'express';
import { getDatabase, writeAuditLog } from './server/database.js';
import { requireMembership, requireRole, SUPPORTED_ROLES } from './server/rbac.js';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const scrypt = promisify(scryptCallback);
const app = express();
const port = Number(process.env.PORT || 3000);
const sessionCookie = 'akiba_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const resetLifetimeMs = 30 * 60 * 1000;
const rateLimits = new Map();
const adminOnly = requireRole(['admin']);
const anyMembership = requireMembership;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.get('/api/auth/session', authenticate, (req, res) => {
  res.json({ user: req.auth ? authResponse(req.auth) : null });
});

app.post('/api/auth/register', requireSameOrigin, limitRequests('register', 10, 60 * 60 * 1000), async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const chamaName = typeof req.body?.chamaName === 'string' ? req.body.chamaName.trim() : 'My Chama';
    if (name.length < 2 || name.length > 80 || !isValidEmail(email) ||
      chamaName.length < 2 || chamaName.length > 100) {
      res.status(400).json({ error: 'Enter a valid name, email, and chama name.' });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'Use a password of at least 8 characters with at least one letter and one number.' });
      return;
    }

    const db = await getDatabase();
    const userId = randomId();
    const chamaId = randomId();
    const membershipId = randomId();
    const salt = randomBytes(16);
    const passwordHash = await hashPassword(password, salt);
    const createAdmin = db.transaction(() => {
      if (db.prepare('SELECT COUNT(*) AS count FROM users').get().count > 0) {
        const error = new Error('Admin setup is complete. Ask an existing chama admin to create your account.');
        error.code = 'ADMIN_SETUP_COMPLETE';
        throw error;
      }
      db.prepare(`
        INSERT INTO users (id, name, email, password_salt, password_hash) VALUES (?, ?, ?, ?, ?)
      `).run(userId, name, email, salt.toString('base64'), passwordHash.toString('base64'));
      db.prepare('INSERT INTO chamas (id, name) VALUES (?, ?)').run(chamaId, chamaName);
      db.prepare(`
        INSERT INTO memberships (id, chama_id, user_id, role, status) VALUES (?, ?, ?, 'admin', 'active')
      `).run(membershipId, chamaId, userId);
      writeAuditLog(db, {
        actorId: userId, chamaId, action: 'admin.bootstrap', entityType: 'membership',
        entityId: membershipId, metadata: { role: 'admin' }
      });
    });
    try {
      createAdmin.immediate();
    } catch (error) {
      if (error.code === 'ADMIN_SETUP_COMPLETE') {
        res.status(403).json({ error: error.message });
        return;
      }
      throw error;
    }
    const token = await createSession(db, userId, chamaId);
    setSessionCookie(res, token);
    res.status(201).json({ user: getAuthPayload(db, userId, chamaId) });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    next(error);
  }
});

app.post('/api/auth/login', requireSameOrigin, limitRequests('login', 10, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const db = await getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
    const matches = user && typeof password === 'string'
      ? safeHashMatch(
        await hashPassword(password, Buffer.from(user.password_salt, 'base64')),
        Buffer.from(user.password_hash, 'base64')
      )
      : false;
    if (!matches) {
      res.status(401).json({ error: 'Email or password is incorrect.' });
      return;
    }

    const memberships = db.prepare(`
      SELECT m.chama_id AS chamaId, c.name AS chamaName, m.role, m.status
      FROM memberships m
      JOIN chamas c ON c.id = m.chama_id
      WHERE m.user_id = ? AND m.status = 'active'
      ORDER BY c.name COLLATE NOCASE
    `).all(user.id);
    if (!memberships.length) {
      res.status(403).json({ error: 'Your chama membership is not active. Contact a chama admin.' });
      return;
    }
    const selected = req.body?.chamaId
      ? memberships.find((membership) => membership.chamaId === req.body.chamaId)
      : memberships.length === 1 ? memberships[0] : null;
    if (req.body?.chamaId && !selected) {
      res.status(403).json({ error: 'You do not have an active membership in that chama.' });
      return;
    }
    if (!selected) {
      res.json({
        requiresChamaSelection: true,
        memberships,
        message: 'Choose which chama you want to open.'
      });
      return;
    }

    const token = await createSession(db, user.id, selected.chamaId);
    setSessionCookie(res, token);
    res.json({
      user: getAuthPayload(db, user.id, selected.chamaId),
      memberships
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/active-chama', requireSameOrigin, authenticate, async (req, res, next) => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'Please log in to continue.' });
      return;
    }
    const db = await getDatabase();
    const membership = db.prepare(`
      SELECT 1 FROM memberships
      WHERE chama_id = ? AND user_id = ? AND status = 'active'
    `).get(req.body?.chamaId, req.auth.user.id);
    if (!membership) {
      res.status(403).json({ error: 'You do not have an active membership in that chama.' });
      return;
    }
    db.prepare('UPDATE sessions SET active_chama_id = ? WHERE id_hash = ?')
      .run(req.body.chamaId, hashToken(getSessionId(req)));
    res.json({ user: getAuthPayload(db, req.auth.user.id, req.body.chamaId) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/forgot-password', requireSameOrigin, limitRequests('forgot-password', 5, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const sender = process.env.RESEND_FROM;
    const baseUrl = getAppBaseUrl(req);
    const missingConfiguration = [
      !resendKey && 'RESEND_API_KEY',
      !sender && 'RESEND_FROM',
      !baseUrl && 'APP_URL (must be HTTPS except on localhost)'
    ].filter(Boolean);
    if (missingConfiguration.length) {
      res.status(503).json({
        error: `Password recovery is not configured. Set ${missingConfiguration.join(', ')} in .env.local and restart Akiba.`
      });
      return;
    }
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const db = await getDatabase();
    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ? COLLATE NOCASE').get(email);
    if (user) {
      const token = randomBytes(32).toString('base64url');
      db.prepare('UPDATE users SET reset_token_hash = ?, reset_expires_at = ? WHERE id = ?')
        .run(hashToken(token), Date.now() + resetLifetimeMs, user.id);
      const resetUrl = new URL('/', baseUrl);
      resetUrl.hash = new URLSearchParams({ reset_token: token }).toString();
      try {
        await sendResetEmail({ apiKey: resendKey, from: sender, to: user.email, name: user.name, resetUrl: resetUrl.toString() });
      } catch (error) {
        db.prepare('UPDATE users SET reset_token_hash = NULL, reset_expires_at = NULL WHERE id = ? AND reset_token_hash = ?')
          .run(user.id, hashToken(token));
        console.error('Resend password recovery delivery failed:', error);
        res.status(502).json({ error: 'We could not send the recovery email. Please try again later.' });
        return;
      }
    }
    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/reset-password', requireSameOrigin, limitRequests('reset-password', 10, 15 * 60 * 1000), async (req, res, next) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const password = req.body?.password;
    if (!token || !isValidPassword(password)) {
      res.status(400).json({ error: 'The reset link or new password is invalid.' });
      return;
    }
    const db = await getDatabase();
    const tokenHash = hashToken(token);
    const user = db.prepare(`
      SELECT id FROM users WHERE reset_token_hash = ? AND reset_expires_at > ?
    `).get(tokenHash, Date.now());
    if (!user) {
      res.status(400).json({ error: 'This password reset link is invalid or has expired. Request a new link.' });
      return;
    }
    const salt = randomBytes(16);
    const passwordHash = await hashPassword(password, salt);
    const reset = db.transaction(() => {
      const updated = db.prepare(`
        UPDATE users SET password_salt = ?, password_hash = ?, reset_token_hash = NULL, reset_expires_at = NULL
        WHERE id = ? AND reset_token_hash = ? AND reset_expires_at > ?
      `).run(salt.toString('base64'), passwordHash.toString('base64'), user.id, tokenHash, Date.now());
      if (updated.changes !== 1) return false;
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      for (const membership of db.prepare('SELECT chama_id, id FROM memberships WHERE user_id = ?').all(user.id)) {
        writeAuditLog(db, {
          actorId: user.id, chamaId: membership.chama_id, action: 'auth.password_reset',
          entityType: 'user', entityId: user.id, metadata: { membershipId: membership.id }
        });
      }
      return true;
    });
    if (!reset()) {
      res.status(400).json({ error: 'This password reset link is invalid or has expired. Request a new link.' });
      return;
    }
    res.clearCookie(sessionCookie, cookieOptions());
    res.json({ message: 'Your password has been reset. Log in with your new password.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', requireSameOrigin, authenticate, async (req, res, next) => {
  try {
    const token = getSessionId(req);
    if (token) {
      const db = await getDatabase();
      db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(hashToken(token));
    }
    res.clearCookie(sessionCookie, cookieOptions());
    res.json({ message: 'Signed out.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/chama-data', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const members = db.prepare(`
      SELECT m.id, u.name, m.phone, u.email, m.id_number AS idNumber, m.role,
        m.joined_date AS joinedDate, m.total_saved AS totalSaved, m.monthly_pledge AS monthlyPledge,
        m.status, COALESCE(SUM(CASE WHEN l.status IN ('active', 'approved') THEN l.amount ELSE 0 END), 0) AS activeLoanAmount
      FROM memberships m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN loans l ON l.membership_id = m.id
      WHERE m.chama_id = ?
      GROUP BY m.id
      ORDER BY u.name COLLATE NOCASE
    `).all(chamaId);
    const transactions = db.prepare(`
      SELECT c.id, c.membership_id AS memberId, u.name AS memberName, m.phone, c.type,
        c.amount, c.occurred_at AS date, c.status, c.payment_method AS paymentMethod,
        c.reference AS mpesaRef, c.notes
      FROM contributions c
      JOIN memberships m ON m.id = c.membership_id
      JOIN users u ON u.id = m.user_id
      WHERE c.chama_id = ?
      ORDER BY c.occurred_at DESC
    `).all(chamaId).map((transaction) => ({
      ...transaction,
      status: transaction.status === 'confirmed' ? 'completed' :
        transaction.status === 'rejected' ? 'failed' : 'pending'
    }));
    const loans = db.prepare(`
      SELECT l.id, l.membership_id AS memberId, u.name AS memberName, l.amount,
        l.interest_rate AS interestRate, l.duration_months AS durationMonths,
        l.start_date AS startDate, l.due_date AS dueDate,
        l.monthly_installment AS monthlyInstallment, l.total_repayment AS totalRepayment,
        l.amount_repaid AS amountRepaid, l.guarantor_name AS guarantorName, l.status
      FROM loans l
      JOIN memberships m ON m.id = l.membership_id
      JOIN users u ON u.id = m.user_id
      WHERE l.chama_id = ?
      ORDER BY l.created_at DESC
    `).all(chamaId);
    res.json({ members, transactions, loans });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/chama-data', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const { members, transactions, loans } = req.body || {};
    if (![members, transactions, loans].every((items) => Array.isArray(items) && items.length <= 10000)) {
      res.status(400).json({ error: 'The chama data is invalid.' });
      return;
    }
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const save = db.transaction(() => {
      const currentMembers = new Map(db.prepare('SELECT * FROM memberships WHERE chama_id = ?').all(chamaId).map((row) => [row.id, row]));
      const currentTransactions = new Map(db.prepare('SELECT * FROM contributions WHERE chama_id = ?').all(chamaId).map((row) => [row.id, row]));
      const currentLoans = new Map(db.prepare('SELECT * FROM loans WHERE chama_id = ?').all(chamaId).map((row) => [row.id, row]));
      assertUniqueIds(members, 'member');
      assertUniqueIds(transactions, 'contribution');
      assertUniqueIds(loans, 'loan');
      const memberIds = new Set(members.map((member) => member.id));
      const transactionIds = new Set(transactions.map((transaction) => transaction.id));
      const loanIds = new Set(loans.map((loan) => loan.id));
      if ([...currentMembers.keys()].some((id) => !memberIds.has(id)) ||
        [...currentTransactions.keys()].some((id) => !transactionIds.has(id)) ||
        [...currentLoans.keys()].some((id) => !loanIds.has(id))) {
        throw new Error('Financial or membership history cannot be deleted. Mark a member inactive or record a correction instead.');
      }

      const updateMember = db.prepare(`
        UPDATE memberships SET role = ?, status = ?, phone = ?, id_number = ?, total_saved = ?, monthly_pledge = ?
        WHERE id = ? AND chama_id = ?
      `);
      for (const member of members) {
        const existing = currentMembers.get(member.id);
        if (!existing) throw new Error('New members must be created through the admin members endpoint.');
        const role = String(member.role || '').toLowerCase();
        if (!SUPPORTED_ROLES.includes(role)) throw new Error('Member role is invalid.');
        const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(existing.user_id);
        const status = ['pending', 'active', 'rejected', 'inactive'].includes(member.status) ? member.status : 'active';
        const updated = {
          role, status, phone: String(member.phone || ''), idNumber: String(member.idNumber || ''),
          totalSaved: nonNegativeNumber(member.totalSaved), monthlyPledge: nonNegativeNumber(member.monthlyPledge)
        };
        if (member.name !== user.name || normalizeEmail(member.email) !== user.email.toLowerCase()) {
          throw new Error('Account name and email must be changed through the account profile, not a chama membership.');
        }
        const changed = existing.role !== updated.role || existing.status !== updated.status ||
          existing.phone !== updated.phone || existing.id_number !== updated.idNumber ||
          existing.total_saved !== updated.totalSaved || existing.monthly_pledge !== updated.monthlyPledge;
        if (!changed) continue;
        updateMember.run(updated.role, updated.status, updated.phone, updated.idNumber, updated.totalSaved, updated.monthlyPledge, member.id, chamaId);
        writeAuditLog(db, {
          actorId: req.auth.user.id, chamaId, action: 'membership.updated',
          entityType: 'membership', entityId: member.id,
          metadata: { before: existing, after: updated }
        });
      }

      const insertContribution = db.prepare(`
        INSERT INTO contributions
          (id, chama_id, membership_id, amount, type, status, payment_method, reference, notes, occurred_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const transaction of transactions) {
        const existing = currentTransactions.get(transaction.id);
        const status = requireContributionStatus(transaction.status);
        if (existing) {
          const differs = existing.amount !== Number(transaction.amount) ||
            existing.type !== String(transaction.type || 'contribution') ||
            existing.status !== status ||
            existing.payment_method !== String(transaction.paymentMethod || 'cash') ||
            existing.reference !== (transaction.mpesaRef || null) ||
            existing.notes !== String(transaction.notes || '') ||
            existing.occurred_at !== String(transaction.date || existing.occurred_at);
          if (differs) throw new Error('Contribution corrections must use the audited contribution correction endpoint.');
          continue;
        }
        if (!currentMembers.has(transaction.memberId) || !(Number(transaction.amount) > 0)) {
          throw new Error('A contribution must belong to a chama member and have a positive amount.');
        }
        insertContribution.run(
          transaction.id || randomId(), chamaId, transaction.memberId, Number(transaction.amount),
          String(transaction.type || 'contribution'), status, String(transaction.paymentMethod || 'cash'),
          transaction.mpesaRef || null, String(transaction.notes || ''), String(transaction.date || new Date().toISOString())
        );
        writeAuditLog(db, {
          actorId: req.auth.user.id, chamaId, action: 'contribution.created',
          entityType: 'contribution', entityId: transaction.id,
          metadata: { amount: Number(transaction.amount), type: transaction.type || 'contribution', status }
        });
      }
      const updateLoan = db.prepare(`
        UPDATE loans SET status = ?, amount_repaid = ? WHERE id = ? AND chama_id = ?
      `);
      const insertLoan = db.prepare(`
        INSERT INTO loans
          (id, chama_id, membership_id, amount, interest_rate, duration_months, start_date, due_date,
           monthly_installment, total_repayment, amount_repaid, guarantor_name, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const loan of loans) {
        if (!currentLoans.has(loan.id)) {
          if (!currentMembers.has(loan.memberId) || !(Number(loan.amount) > 0)) {
            throw new Error('A loan must belong to a chama member and have a positive amount.');
          }
          insertLoan.run(
            loan.id || randomId(), chamaId, loan.memberId, Number(loan.amount), Number(loan.interestRate) || 0,
            Math.max(1, Number(loan.durationMonths) || 1), loan.startDate || null, loan.dueDate || null,
            Number(loan.monthlyInstallment) || 0, Number(loan.totalRepayment) || 0, Number(loan.amountRepaid) || 0,
            String(loan.guarantorName || ''), requireLoanStatus(loan.status)
          );
          writeAuditLog(db, {
            actorId: req.auth.user.id, chamaId, action: 'loan.created',
            entityType: 'loan', entityId: loan.id, metadata: { amount: Number(loan.amount), status: loan.status }
          });
          continue;
        }
        const existing = currentLoans.get(loan.id);
        const status = requireLoanStatus(loan.status);
        const amountRepaid = nonNegativeNumber(loan.amountRepaid);
        const immutableFieldsChanged = Number(loan.amount) !== existing.amount ||
          Number(loan.interestRate) !== existing.interest_rate ||
          Number(loan.durationMonths) !== existing.duration_months ||
          String(loan.guarantorName || '') !== existing.guarantor_name ||
          (loan.startDate || null) !== existing.start_date ||
          (loan.dueDate || null) !== existing.due_date ||
          Number(loan.monthlyInstallment) !== existing.monthly_installment ||
          Number(loan.totalRepayment) !== existing.total_repayment;
        if (immutableFieldsChanged) {
          throw new Error('Loan corrections must use an audited loan review endpoint.');
        }
        if (existing.status !== status || existing.amount_repaid !== amountRepaid) {
          updateLoan.run(status, amountRepaid, loan.id, chamaId);
          writeAuditLog(db, {
            actorId: req.auth.user.id, chamaId, action: 'loan.updated',
            entityType: 'loan', entityId: loan.id,
            metadata: { before: { status: existing.status, amountRepaid: existing.amount_repaid }, after: { status, amountRepaid } }
          });
        }
      }
      if (db.prepare(`
        SELECT COUNT(*) AS count FROM memberships
        WHERE chama_id = ? AND status = 'active' AND role = 'admin'
      `).get(chamaId).count === 0) {
        throw new Error('Each chama must retain at least one active admin.');
      }
    });
    try {
      save();
    } catch (error) {
      res.status(400).json({ error: error.message || 'The chama data could not be saved.' });
      return;
    }
    res.json({ message: 'Chama data saved.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/members', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const members = db.prepare(`
      SELECT m.id, u.name, u.email, m.role, m.status, m.phone, m.id_number AS idNumber,
        m.joined_date AS joinedDate, m.total_saved AS totalSaved, m.monthly_pledge AS monthlyPledge
      FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.chama_id = ? ORDER BY u.name COLLATE NOCASE
    `).all(req.auth.membership.chama_id);
    res.json({ members });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/members/:id', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const role = req.body?.role === undefined ? undefined : String(req.body.role).toLowerCase();
    const status = req.body?.status;
    if ((role !== undefined && !SUPPORTED_ROLES.includes(role)) ||
      (status !== undefined && !['pending', 'active', 'rejected', 'inactive'].includes(status))) {
      res.status(400).json({ error: 'Member role or status is invalid.' });
      return;
    }
    if (role === undefined && status === undefined) {
      res.status(400).json({ error: 'Provide a role or status to update.' });
      return;
    }
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const current = db.prepare('SELECT * FROM memberships WHERE id = ? AND chama_id = ?')
      .get(req.params.id, chamaId);
    if (!current) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    const nextRole = role || current.role;
    const nextStatus = status || current.status;
    const update = db.transaction(() => {
      db.prepare('UPDATE memberships SET role = ?, status = ? WHERE id = ? AND chama_id = ?')
        .run(nextRole, nextStatus, req.params.id, chamaId);
      if (db.prepare(`
        SELECT COUNT(*) AS count FROM memberships
        WHERE chama_id = ? AND status = 'active' AND role = 'admin'
      `).get(chamaId).count === 0) {
        throw new Error('Each chama must retain at least one active admin.');
      }
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'membership.access_updated',
        entityType: 'membership', entityId: req.params.id,
        metadata: { before: { role: current.role, status: current.status }, after: { role: nextRole, status: nextStatus } }
      });
    });
    try {
      update();
    } catch (error) {
      res.status(400).json({ error: error.message || 'The membership could not be updated.' });
      return;
    }
    res.json({ message: 'Membership role/status updated and audited.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/chamas', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const chamas = db.prepare(`
      SELECT c.id, c.name, m.role FROM memberships m
      JOIN chamas c ON c.id = m.chama_id
      WHERE m.user_id = ? AND m.status = 'active'
      ORDER BY c.name COLLATE NOCASE
    `).all(req.auth.user.id);
    res.json({ chamas });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/chamas', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Chama name must contain 2 to 100 characters.' });
      return;
    }
    const db = await getDatabase();
    const chamaId = randomId();
    const membershipId = randomId();
    const create = db.transaction(() => {
      db.prepare('INSERT INTO chamas (id, name) VALUES (?, ?)').run(chamaId, name);
      db.prepare(`
        INSERT INTO memberships (id, chama_id, user_id, role, status)
        VALUES (?, ?, ?, 'admin', 'active')
      `).run(membershipId, chamaId, req.auth.user.id);
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'chama.created',
        entityType: 'chama', entityId: chamaId, metadata: { name }
      });
    });
    create();
    res.status(201).json({ chama: { id: chamaId, name, role: 'admin' } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/chama-join-requests', requireSameOrigin, authenticate, async (req, res, next) => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'Please log in to continue.' });
      return;
    }
    const chamaId = typeof req.body?.chamaId === 'string' ? req.body.chamaId : '';
    const db = await getDatabase();
    const chama = db.prepare('SELECT id FROM chamas WHERE id = ?').get(chamaId);
    if (!chama) {
      res.status(404).json({ error: 'Chama not found.' });
      return;
    }
    const membershipId = randomId();
    try {
      const requestMembership = db.transaction(() => {
        db.prepare(`
          INSERT INTO memberships (id, chama_id, user_id, role, status)
          VALUES (?, ?, ?, 'member', 'pending')
        `).run(membershipId, chamaId, req.auth.user.id);
        writeAuditLog(db, {
          actorId: req.auth.user.id, chamaId, action: 'membership.requested',
          entityType: 'membership', entityId: membershipId, metadata: { role: 'member' }
        });
      });
      requestMembership();
    } catch (error) {
      if (isUniqueConstraint(error)) {
        res.status(409).json({ error: 'You already have a membership or request in this chama.' });
        return;
      }
      throw error;
    }
    res.status(201).json({ membershipId, status: 'pending' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/members', requireSameOrigin, limitRequests('create-member', 20, 60 * 60 * 1000), authenticate, adminOnly, async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const role = typeof req.body?.role === 'string' ? req.body.role.toLowerCase() : 'member';
    if (name.length < 2 || name.length > 80 || !isValidEmail(email) ||
      !SUPPORTED_ROLES.includes(role) || (password !== undefined && !isValidPassword(password))) {
      res.status(400).json({ error: 'Enter valid member details and a valid chama role. A new account password must have at least 8 characters, a letter, and a number.' });
      return;
    }
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
    if (existing && password !== undefined) {
      res.status(400).json({ error: 'This user already has an account. Leave the password blank; their existing password will remain unchanged.' });
      return;
    }
    if (!existing && !isValidPassword(password)) {
      res.status(400).json({ error: 'A new user account requires a password of at least 8 characters with a letter and a number.' });
      return;
    }
    const userId = existing?.id || randomId();
    const membershipId = randomId();
    const salt = existing ? null : randomBytes(16);
    const passwordHash = existing ? null : await hashPassword(password, salt);
    try {
      const createMembership = db.transaction(() => {
        if (!existing) {
          db.prepare(`
            INSERT INTO users (id, name, email, password_salt, password_hash) VALUES (?, ?, ?, ?, ?)
          `).run(userId, name, email, salt.toString('base64'), passwordHash.toString('base64'));
        }
        db.prepare(`
          INSERT INTO memberships
            (id, chama_id, user_id, role, status, phone, id_number, total_saved, monthly_pledge)
          VALUES (?, ?, ?, ?, 'active', ?, ?, 0, ?)
        `).run(membershipId, chamaId, userId, role, String(req.body.phone || ''), String(req.body.idNumber || ''), nonNegativeNumber(req.body.monthlyPledge));
        writeAuditLog(db, {
          actorId: req.auth.user.id, chamaId, action: 'membership.created',
          entityType: 'membership', entityId: membershipId, metadata: { userId, role }
        });
      });
      createMembership();
    } catch (error) {
      if (isUniqueConstraint(error)) {
        res.status(409).json({ error: 'That user already has a membership in this chama.' });
        return;
      }
      throw error;
    }
    const member = db.prepare(`
      SELECT m.id, u.name, u.email, m.role, m.status, m.phone, m.id_number AS idNumber,
        m.joined_date AS joinedDate, m.total_saved AS totalSaved, m.monthly_pledge AS monthlyPledge
      FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.id = ?
    `).get(membershipId);
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/contributions', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    res.json({ contributions: db.prepare(`
      SELECT c.*, u.name AS member_name FROM contributions c
      JOIN memberships m ON m.id = c.membership_id JOIN users u ON u.id = m.user_id
      WHERE c.chama_id = ? ORDER BY c.occurred_at DESC
    `).all(req.auth.membership.chama_id) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/contributions/:id', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const current = db.prepare('SELECT * FROM contributions WHERE id = ? AND chama_id = ?').get(req.params.id, chamaId);
    if (!current) {
      res.status(404).json({ error: 'Contribution not found.' });
      return;
    }
    const amount = req.body?.amount === undefined ? current.amount : Number(req.body.amount);
    const status = req.body?.status === undefined ? current.status : contributionStatusOrNull(req.body.status);
    const notes = req.body?.notes === undefined ? current.notes : String(req.body.notes);
    if (!(amount > 0) || status === null) {
      res.status(400).json({ error: 'Contribution amount or status is invalid.' });
      return;
    }
    const correction = db.transaction(() => {
      db.prepare('UPDATE contributions SET amount = ?, status = ?, notes = ? WHERE id = ? AND chama_id = ?')
        .run(amount, status, notes, req.params.id, chamaId);
      const oldBalanceEffect = current.status === 'confirmed' ? current.amount : 0;
      const newBalanceEffect = status === 'confirmed' ? amount : 0;
      db.prepare(`
        UPDATE memberships SET total_saved = MAX(0, total_saved + ?)
        WHERE id = ? AND chama_id = ?
      `).run(newBalanceEffect - oldBalanceEffect, current.membership_id, chamaId);
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'contribution.corrected',
        entityType: 'contribution', entityId: req.params.id,
        metadata: {
          before: current, after: { amount, status, notes },
          balanceAdjustment: newBalanceEffect - oldBalanceEffect
        }
      });
    });
    correction();
    res.json({ message: 'Contribution updated and correction recorded in the audit log.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/loans', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    res.json({ loans: db.prepare('SELECT * FROM loans WHERE chama_id = ? ORDER BY created_at DESC').all(req.auth.membership.chama_id) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/loans/:id', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const current = db.prepare('SELECT * FROM loans WHERE id = ? AND chama_id = ?').get(req.params.id, chamaId);
    if (!current) {
      res.status(404).json({ error: 'Loan not found.' });
      return;
    }
    const status = req.body?.status === undefined ? current.status : loanStatusOrNull(req.body.status);
    const amountRepaid = req.body?.amountRepaid === undefined ? current.amount_repaid : nonNegativeNumber(req.body.amountRepaid);
    if (status === null || req.body?.amountRepaid !== undefined &&
      (!Number.isFinite(Number(req.body.amountRepaid)) || Number(req.body.amountRepaid) < 0 || Number(req.body.amountRepaid) > current.total_repayment)) {
      res.status(400).json({ error: 'Loan status or amount repaid is invalid.' });
      return;
    }
    const update = db.transaction(() => {
      db.prepare('UPDATE loans SET status = ?, amount_repaid = ? WHERE id = ? AND chama_id = ?')
        .run(status, amountRepaid, req.params.id, chamaId);
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'loan.reviewed',
        entityType: 'loan', entityId: req.params.id,
        metadata: { before: { status: current.status, amountRepaid: current.amount_repaid }, after: { status, amountRepaid } }
      });
    });
    update();
    res.json({ message: 'Loan updated and recorded in the audit log.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/payouts', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    res.json({ payouts: db.prepare('SELECT * FROM payouts WHERE chama_id = ? ORDER BY created_at DESC').all(req.auth.membership.chama_id) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/payouts', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) {
      res.status(400).json({ error: 'Payout amount must be positive.' });
      return;
    }
    const db = await getDatabase();
    const id = randomId();
    const chamaId = req.auth.membership.chama_id;
    const membershipId = req.body.membershipId || null;
    if (membershipId && !db.prepare('SELECT 1 FROM memberships WHERE id = ? AND chama_id = ? AND status = ?')
      .get(membershipId, chamaId, 'active')) {
      res.status(400).json({ error: 'Payout recipient must be an active member of this chama.' });
      return;
    }
    const create = db.transaction(() => {
      db.prepare(`
        INSERT INTO payouts (id, chama_id, membership_id, amount, status, description)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `).run(id, chamaId, membershipId, amount, String(req.body.description || ''));
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'payout.created',
        entityType: 'payout', entityId: id, metadata: { amount }
      });
    });
    create();
    res.status(201).json({ id, status: 'pending' });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/payouts/:id', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const status = ['approved', 'rejected', 'paid'].includes(req.body?.status) ? req.body.status : null;
    if (!status) {
      res.status(400).json({ error: 'Payout status must be approved, rejected, or paid.' });
      return;
    }
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const current = db.prepare('SELECT * FROM payouts WHERE id = ? AND chama_id = ?').get(req.params.id, chamaId);
    if (!current) {
      res.status(404).json({ error: 'Payout not found.' });
      return;
    }
    const update = db.transaction(() => {
      db.prepare("UPDATE payouts SET status = ?, updated_at = datetime('now') WHERE id = ? AND chama_id = ?")
        .run(status, req.params.id, chamaId);
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'payout.reviewed',
        entityType: 'payout', entityId: req.params.id, metadata: { before: current.status, after: status }
      });
    });
    update();
    res.json({ message: 'Payout updated and recorded in the audit log.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/settings', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const chama = db.prepare('SELECT id, name, settings_json AS settings FROM chamas WHERE id = ?')
      .get(req.auth.membership.chama_id);
    res.json(chama);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/settings', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Chama name must contain 2 to 100 characters.' });
      return;
    }
    const db = await getDatabase();
    const chamaId = req.auth.membership.chama_id;
    const before = db.prepare('SELECT name, settings_json FROM chamas WHERE id = ?').get(chamaId);
    const settings = req.body.settings && typeof req.body.settings === 'object' && !Array.isArray(req.body.settings)
      ? JSON.stringify(req.body.settings)
      : before.settings_json;
    const update = db.transaction(() => {
      db.prepare('UPDATE chamas SET name = ?, settings_json = ? WHERE id = ?').run(name, settings, chamaId);
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'chama.settings_updated',
        entityType: 'chama', entityId: chamaId,
        metadata: { before, after: { name, settings } }
      });
    });
    update();
    res.json({ message: 'Chama settings updated.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/announcements', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!title || title.length > 160 || !body || body.length > 10000) {
      res.status(400).json({ error: 'Announcement title and message are required.' });
      return;
    }
    const db = await getDatabase();
    const id = randomId();
    const chamaId = req.auth.membership.chama_id;
    const publish = db.transaction(() => {
      db.prepare('INSERT INTO announcements (id, chama_id, title, body, created_by) VALUES (?, ?, ?, ?, ?)')
        .run(id, chamaId, title, body, req.auth.user.id);
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'announcement.created',
        entityType: 'announcement', entityId: id, metadata: { title }
      });
    });
    publish();
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/meetings', requireSameOrigin, authenticate, adminOnly, async (req, res, next) => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const startsAt = typeof req.body?.startsAt === 'string' && !Number.isNaN(Date.parse(req.body.startsAt))
      ? new Date(req.body.startsAt).toISOString()
      : '';
    if (!title || title.length > 160 || !startsAt) {
      res.status(400).json({ error: 'Enter a meeting title and valid start date.' });
      return;
    }
    const db = await getDatabase();
    const id = randomId();
    const chamaId = req.auth.membership.chama_id;
    const schedule = db.transaction(() => {
      db.prepare('INSERT INTO meetings (id, chama_id, title, starts_at, location) VALUES (?, ?, ?, ?, ?)')
        .run(id, chamaId, title, startsAt, String(req.body.location || '').slice(0, 200));
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId, action: 'meeting.scheduled',
        entityType: 'meeting', entityId: id, metadata: { title, startsAt }
      });
    });
    schedule();
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/audit-logs', authenticate, adminOnly, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const logs = db.prepare(`
      SELECT id, actor_id AS actorId, chama_id AS chamaId, action, entity_type AS entityType,
        entity_id AS entityId, timestamp, metadata
      FROM audit_logs WHERE chama_id = ? ORDER BY timestamp DESC LIMIT 1000
    `).all(req.auth.membership.chama_id);
    res.json({ auditLogs: logs });
  } catch (error) {
    next(error);
  }
});

app.get('/api/member/dashboard', authenticate, anyMembership, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const membership = req.auth.membership;
    const chamaId = membership.chama_id;
    const member = db.prepare(`
      SELECT m.id, u.name, u.email, m.phone, m.id_number AS idNumber, m.role,
        m.joined_date AS joinedDate, m.total_saved AS totalSaved, m.monthly_pledge AS monthlyPledge, m.status
      FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.id = ?
    `).get(membership.id);
    const groupMembers = db.prepare(`
      SELECT m.id, u.name, m.role FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.chama_id = ? AND m.status = 'active' ORDER BY u.name COLLATE NOCASE
    `).all(chamaId);
    const ownTransactions = db.prepare(`
      SELECT id, membership_id AS memberId, type, amount, occurred_at AS date,
        CASE status WHEN 'confirmed' THEN 'completed' WHEN 'rejected' THEN 'failed' ELSE 'pending' END AS status,
        payment_method AS paymentMethod, reference AS mpesaRef, notes
      FROM contributions WHERE membership_id = ? ORDER BY occurred_at DESC
    `).all(membership.id);
    const ownLoans = db.prepare(`
      SELECT id, membership_id AS memberId, amount, interest_rate AS interestRate,
        duration_months AS durationMonths, start_date AS startDate, due_date AS dueDate,
        monthly_installment AS monthlyInstallment, total_repayment AS totalRepayment,
        amount_repaid AS amountRepaid, guarantor_name AS guarantorName, status
      FROM loans WHERE membership_id = ? ORDER BY created_at DESC
    `).all(membership.id);
    const groupSavings = db.prepare(`
      SELECT COALESCE(SUM(total_saved), 0) AS total FROM memberships WHERE chama_id = ? AND status = 'active'
    `).get(chamaId).total;
    const groupLoans = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM loans WHERE chama_id = ? AND status IN ('active', 'approved')
    `).get(chamaId).total;
    const currentMonthContributions = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM contributions
      WHERE chama_id = ? AND status = 'confirmed' AND substr(occurred_at, 1, 7) = ?
    `).get(chamaId, new Date().toISOString().slice(0, 7)).total;
    const announcements = db.prepare(`
      SELECT id, title, body, created_at AS createdAt FROM announcements
      WHERE chama_id = ? ORDER BY created_at DESC LIMIT 100
    `).all(chamaId);
    const meetings = db.prepare(`
      SELECT id, title, starts_at AS startsAt, location FROM meetings
      WHERE chama_id = ? ORDER BY starts_at LIMIT 100
    `).all(chamaId);
    res.json({
      member: { ...member, activeLoanAmount: ownLoans
        .filter((loan) => loan.status === 'active' || loan.status === 'approved')
        .reduce((sum, loan) => sum + loan.amount, 0) },
      role: membership.role,
      chama: { id: chamaId, name: membership.chama_name },
      group: {
        members: groupMembers, memberCount: groupMembers.length,
        totalSavings: groupSavings, activeLoanTotal: groupLoans, currentMonthContributions
      },
      transactions: ownTransactions,
      loans: ownLoans,
      announcements,
      meetings
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/member/contributions', requireSameOrigin, authenticate, anyMembership, async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    if (!(amount > 0) || amount > 10000000) {
      res.status(400).json({ error: 'Enter a contribution amount greater than zero.' });
      return;
    }
    if (!['mpesa', 'bank_transfer', 'cash'].includes(req.body?.paymentMethod || 'cash') ||
      typeof req.body?.notes === 'string' && req.body.notes.length > 2000) {
      res.status(400).json({ error: 'Contribution payment details are invalid.' });
      return;
    }
    const db = await getDatabase();
    const membership = req.auth.membership;
    const id = randomId();
    const add = db.transaction(() => {
      db.prepare(`
        INSERT INTO contributions
          (id, chama_id, membership_id, amount, type, status, payment_method, notes)
        VALUES (?, ?, ?, ?, 'contribution', 'pending', ?, ?)
      `).run(id, membership.chama_id, membership.id, amount, String(req.body.paymentMethod || 'cash'), String(req.body.notes || ''));
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId: membership.chama_id, action: 'contribution.submitted',
        entityType: 'contribution', entityId: id, metadata: { amount }
      });
    });
    add();
    res.status(201).json({ id, status: 'pending' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/member/loans', requireSameOrigin, authenticate, anyMembership, async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    const durationMonths = Number(req.body?.durationMonths);
    if (!(amount > 0) || amount > 10000000 || !Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) {
      res.status(400).json({ error: 'Enter a valid loan amount and duration.' });
      return;
    }
    const db = await getDatabase();
    const membership = req.auth.membership;
    const id = randomId();
    const interestRate = 10;
    const totalRepayment = Math.round(amount * (1 + interestRate / 100));
    const monthlyInstallment = Math.round(totalRepayment / durationMonths);
    const apply = db.transaction(() => {
      db.prepare(`
        INSERT INTO loans
          (id, chama_id, membership_id, amount, interest_rate, duration_months, monthly_installment,
           total_repayment, guarantor_name, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(id, membership.chama_id, membership.id, amount, interestRate, durationMonths,
        monthlyInstallment, totalRepayment, String(req.body.guarantorName || ''));
      writeAuditLog(db, {
        actorId: req.auth.user.id, chamaId: membership.chama_id, action: 'loan.applied',
        entityType: 'loan', entityId: id, metadata: { amount, durationMonths }
      });
    });
    apply();
    res.status(201).json({ id, status: 'pending' });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, req, res, next) => {
  console.error('Akiba server request failed:', error);
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: 'The request could not be completed. Please try again.' });
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist'), { index: false }));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  await getDatabase();
  app.listen(port, () => console.log(`Akiba is running on port ${port}.`));
}

async function authenticate(req, res, next) {
  try {
    const token = getSessionId(req);
    if (!token) {
      req.auth = null;
      next();
      return;
    }
    const db = await getDatabase();
    const session = db.prepare(`
      SELECT s.user_id, s.active_chama_id, s.expires_at, u.name, u.email,
        m.id AS membership_id, m.role, m.status, c.name AS chama_name
      FROM sessions s JOIN users u ON u.id = s.user_id
      LEFT JOIN memberships m ON m.user_id = s.user_id AND m.chama_id = s.active_chama_id AND m.status = 'active'
      LEFT JOIN chamas c ON c.id = s.active_chama_id
      WHERE s.id_hash = ?
    `).get(hashToken(token));
    if (!session || session.expires_at <= Date.now()) {
      if (session) db.prepare('DELETE FROM sessions WHERE id_hash = ?').run(hashToken(token));
      res.clearCookie(sessionCookie, cookieOptions());
      req.auth = null;
      next();
      return;
    }
    req.auth = {
      user: { id: session.user_id, name: session.name, email: session.email },
      membership: session.membership_id ? {
        id: session.membership_id, chama_id: session.active_chama_id,
        chama_name: session.chama_name, role: session.role, status: session.status
      } : null
    };
    next();
  } catch (error) {
    next(error);
  }
}

function authResponse(auth) {
  if (!auth.membership) return null;
  return {
    ...auth.user,
    role: auth.membership.role,
    membershipId: auth.membership.id,
    activeChama: { id: auth.membership.chama_id, name: auth.membership.chama_name }
  };
}

async function createSession(db, userId, chamaId) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO sessions (id_hash, user_id, active_chama_id, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), userId, chamaId, Date.now() + sessionLifetimeMs);
  return token;
}

function getAuthPayload(db, userId, chamaId) {
  const row = db.prepare(`
    SELECT u.id, u.name, u.email, c.id AS chamaId, c.name AS chamaName, m.id AS membershipId, m.role
    FROM users u
    JOIN memberships m ON m.user_id = u.id AND m.chama_id = ? AND m.status = 'active'
    JOIN chamas c ON c.id = m.chama_id
    WHERE u.id = ?
  `).get(chamaId, userId);
  return {
    id: row.id, name: row.name, email: row.email, role: row.role,
    activeChama: { id: row.chamaId, name: row.chamaName },
    membershipId: row.membershipId
  };
}

function setSessionCookie(res, token) {
  res.cookie(sessionCookie, token, { ...cookieOptions(), maxAge: sessionLifetimeMs });
}

function getSessionId(req) {
  const cookies = req.headers.cookie || '';
  const entry = cookies.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  return entry ? decodeURIComponent(entry.slice(sessionCookie.length + 1)) : '';
}

function cookieOptions() {
  return {
    httpOnly: true, sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', path: '/'
  };
}

function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  const expectedOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && origin === expectedOrigin) {
    next();
    return;
  }
  res.status(403).json({ error: 'This request origin is not allowed.' });
}

function limitRequests(action, maximum, windowMs) {
  return (req, res, next) => {
    const key = `${action}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();
    const current = rateLimits.get(key);
    if (!current || current.resetAt <= now) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (current.count >= maximum) {
      res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
      return;
    }
    current.count += 1;
    next();
  };
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128 &&
    /[a-z]/i.test(value) && /\d/.test(value);
}

async function hashPassword(password, salt) {
  return scrypt(password, salt, 64);
}

function safeHashMatch(left, right) {
  return left.length === right.length && timingSafeEqual(left, right);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function randomId() {
  return randomBytes(16).toString('hex');
}

function normalizeLoanStatus(value) {
  return ['pending', 'approved', 'active', 'completed', 'rejected'].includes(value) ? value : null;
}

function loanStatusOrNull(value) {
  return normalizeLoanStatus(value);
}

function requireLoanStatus(value) {
  const status = normalizeLoanStatus(value);
  if (!status) throw new Error('Loan status is invalid.');
  return status;
}

function contributionStatusOrNull(value) {
  if (value === 'completed') return 'confirmed';
  if (value === 'failed') return 'rejected';
  return ['pending', 'confirmed', 'rejected'].includes(value) ? value : null;
}

function requireContributionStatus(value) {
  const status = contributionStatusOrNull(value);
  if (!status) throw new Error('Contribution status is invalid.');
  return status;
}

function assertUniqueIds(records, entity) {
  const ids = records.map((record) => record.id);
  if (ids.some((id) => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) {
    throw new Error(`The ${entity} list contains a missing or duplicate ID.`);
  }
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function isUniqueConstraint(error) {
  return error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY';
}

function getAppBaseUrl(req) {
  const configured = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return '';
    return url.origin;
  } catch {
    return '';
  }
}

async function sendResetEmail({ apiKey, from, to, name, resetUrl }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], subject: 'Reset your Akiba password',
      text: `Hello ${name},\n\nUse the link below to reset your Akiba password. This link expires in 30 minutes and can only be used once.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}.`);
}

export { app, requireRole };

import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const authDataPath = process.env.AKIBA_AUTH_DATA_PATH;
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const passwordHashLength = 64;
const dummySalt = Buffer.alloc(16, 7);
let pool = null;
let store = { users: [], sessions: [], chamas: [], memberships: [], chamaData: [], approvals: [] };

if (authDataPath) {
  const storePath = path.resolve(authDataPath);
  mkdirSync(path.dirname(storePath), { recursive: true });
  try {
    const savedStore = JSON.parse(readFileSync(storePath, "utf8"));
    if (
      !savedStore ||
      !Array.isArray(savedStore.users) ||
      !Array.isArray(savedStore.sessions)
    ) {
      throw new TypeError("Akiba authentication store has an invalid structure.");
    }
    store = {
      users: savedStore.users,
      sessions: savedStore.sessions,
      chamas: Array.isArray(savedStore.chamas) ? savedStore.chamas : [],
      memberships: Array.isArray(savedStore.memberships) ? savedStore.memberships : [],
      chamaData: Array.isArray(savedStore.chamaData) ? savedStore.chamaData : [],
      approvals: Array.isArray(savedStore.approvals) ? savedStore.approvals : []
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
} else {
  const port = Number(process.env.PGPORT || 5432);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new TypeError("PGPORT must be a valid PostgreSQL port.");
  }
  pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
  });
}

export async function initializeAuthStore() {
  if (!pool) return;

  const schemaPath = fileURLToPath(new URL("./database.sql", import.meta.url));
  await pool.query(readFileSync(schemaPath, "utf8"));
  await migrateLegacyAuthStore();
}

export async function registerUser({ name, email, password, chamaName }) {
  const salt = randomBytes(16);
  const passwordHash = hashPassword(password, salt).toString("hex");
  const id = randomBytes(16).toString("hex");
  const isPlatformAdmin = false;

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO akiba_users (id, name, email, password_salt, password_hash, is_platform_admin)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, name, email, is_platform_admin`,
        [id, name, email, salt.toString("hex"), passwordHash, isPlatformAdmin]
      );
      if (!result.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      if (!isPlatformAdmin) {
        await createChamaWithClient(client, id, chamaName || `${name}'s Chama`);
      }
      await client.query("COMMIT");
      return publicUser(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  if (store.users.some((user) => user.email === email)) return null;
  const user = {
    id,
    name,
    email,
    passwordSalt: salt.toString("hex"),
    passwordHash,
    isPlatformAdmin,
    createdAt: new Date().toISOString()
  };
  store.users.push(user);
  if (!isPlatformAdmin) createChamaInMemory(user, chamaName || `${name}'s Chama`);
  persistStore();
  return publicUser(user);
}

export async function authenticateUser(email, password) {
  if (pool) {
    const result = await pool.query(
      `SELECT id, name, email, password_salt, password_hash, is_platform_admin
       FROM akiba_users
       WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    const salt = user ? Buffer.from(user.password_salt, "hex") : dummySalt;
    const storedHash = user
      ? Buffer.from(user.password_hash, "hex")
      : Buffer.alloc(passwordHashLength);
    const suppliedHash = hashPassword(password, salt);
    const matches =
      storedHash.length === suppliedHash.length &&
      timingSafeEqual(storedHash, suppliedHash);
    return user && matches ? publicUser(user) : null;
  }

  const user = store.users.find((item) => item.email === email);
  const salt = user ? Buffer.from(user.passwordSalt, "hex") : dummySalt;
  const storedHash = user
    ? Buffer.from(user.passwordHash, "hex")
    : Buffer.alloc(passwordHashLength);
  const suppliedHash = hashPassword(password, salt);
  const matches =
    storedHash.length === suppliedHash.length &&
    timingSafeEqual(storedHash, suppliedHash);
  return user && matches ? publicUser(user) : null;
}

export async function createSession(userId, adminAuthorized = false) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = Date.now() + sessionLifetimeMs;

  if (pool) {
    await pool.query(
      `INSERT INTO akiba_sessions (token_hash, user_id, expires_at, admin_authorized)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, userId, new Date(expiresAt), adminAuthorized]
    );
  } else {
    store.sessions = store.sessions.filter((session) => session.expiresAt > Date.now());
    store.sessions.push({ tokenHash, userId, expiresAt, adminAuthorized });
    persistStore();
  }
  return { token, maxAge: sessionLifetimeMs };
}

export async function findSession(token) {
  if (typeof token !== "string" || token.length !== 43) return null;
  const tokenHash = hashSessionToken(token);

  if (pool) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_platform_admin, s.admin_authorized
       FROM akiba_sessions AS s
       JOIN akiba_users AS u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash]
    );
    return result.rows[0]
      ? { ...publicUser(result.rows[0]), adminAuthorized: result.rows[0].admin_authorized }
      : null;
  }

  const session = store.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    store.sessions = store.sessions.filter((item) => item !== session);
    persistStore();
    return null;
  }

  const user = store.users.find((item) => item.id === session.userId);
  return user ? { ...publicUser(user), adminAuthorized: session.adminAuthorized === true } : null;
}

export async function revokeSession(token) {
  if (typeof token !== "string" || token.length !== 43) return;
  const tokenHash = hashSessionToken(token);

  if (pool) {
    await pool.query("DELETE FROM akiba_sessions WHERE token_hash = $1", [tokenHash]);
    return;
  }

  const remaining = store.sessions.filter((session) => session.tokenHash !== tokenHash);
  if (remaining.length !== store.sessions.length) {
    store.sessions = remaining;
    persistStore();
  }
}

export async function ensureDefaultChama(user) {
  if (!user || user.isPlatformAdmin) return;
  const memberships = await getChamasForUser(user.id);
  if (memberships.length > 0) return;

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await createChamaWithClient(client, user.id, `${user.name}'s Chama`);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return;
  }

  const storedUser = store.users.find((item) => item.id === user.id);
  if (storedUser) {
    createChamaInMemory(storedUser, `${user.name}'s Chama`);
    persistStore();
  }
}

export async function getChamasForUser(userId) {
  if (pool) {
    const result = await pool.query("SELECT is_platform_admin FROM akiba_users WHERE id = $1", [userId]);
    if (result.rows[0]?.is_platform_admin) {
      const allChamas = await pool.query(
        `SELECT id, name, 'platform_admin' AS role
         FROM akiba_chamas
         ORDER BY created_at, id`
      );
      return allChamas.rows;
    }
    const memberships = await pool.query(
      `SELECT c.id, c.name, m.role
       FROM akiba_chama_memberships AS m
       JOIN akiba_chamas AS c ON c.id = m.chama_id
       WHERE m.user_id = $1
       ORDER BY c.created_at, c.id`,
      [userId]
    );
    return memberships.rows;
  }

  if (store.users.find((user) => user.id === userId)?.isPlatformAdmin) {
    return store.chamas.map((chama) => ({ id: chama.id, name: chama.name, role: "platform_admin" }));
  }

  return store.memberships
    .filter((membership) => membership.userId === userId)
    .flatMap((membership) => {
      const chama = store.chamas.find((item) => item.id === membership.chamaId);
      return chama ? [{ id: chama.id, name: chama.name, role: membership.role }] : [];
    });
}

export async function getChamaRole(userId, chamaId) {
  if (pool) {
    const result = await pool.query(
      `SELECT u.is_platform_admin, m.role
       FROM akiba_users AS u
       LEFT JOIN akiba_chama_memberships AS m
         ON m.user_id = u.id AND m.chama_id = $2
       WHERE u.id = $1`,
      [userId, chamaId]
    );
    const access = result.rows[0];
    if (access?.is_platform_admin) return "platform_admin";
    return access?.role || null;
  }

  const user = store.users.find((item) => item.id === userId);
  if (user?.isPlatformAdmin) return "platform_admin";
  return store.memberships.find((membership) =>
    membership.userId === userId && membership.chamaId === chamaId
  )?.role || null;
}

export async function getChamaData(chamaId) {
  if (pool) {
    const result = await pool.query(
      "SELECT data FROM akiba_chama_data WHERE chama_id = $1",
      [chamaId]
    );
    return result.rows[0]?.data || null;
  }
  return store.chamaData.find((entry) => entry.chamaId === chamaId)?.data || null;
}

export async function saveChamaData(chamaId, data) {
  if (pool) {
    await pool.query(
      `INSERT INTO akiba_chama_data (chama_id, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (chama_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [chamaId, JSON.stringify(data)]
    );
    return;
  }

  const entry = store.chamaData.find((item) => item.chamaId === chamaId);
  if (entry) entry.data = data;
  else store.chamaData.push({ chamaId, data });
  persistStore();
}

export async function listChamaMembers(chamaId) {
  if (pool) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, m.role
       FROM akiba_chama_memberships AS m
       JOIN akiba_users AS u ON u.id = m.user_id
       WHERE m.chama_id = $1
       ORDER BY m.created_at, u.name`,
      [chamaId]
    );
    return result.rows;
  }

  return store.memberships
    .filter((membership) => membership.chamaId === chamaId)
    .flatMap((membership) => {
      const user = store.users.find((item) => item.id === membership.userId);
      return user ? [{ id: user.id, name: user.name, email: user.email, role: membership.role }] : [];
    });
}

export async function addChamaMember({ chamaId, email, role }) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userResult = await client.query(
        "SELECT id FROM akiba_users WHERE email = $1",
        [email]
      );
      if (!userResult.rows[0]) {
        await client.query("ROLLBACK");
        return "user_not_found";
      }
      const result = await client.query(
        `INSERT INTO akiba_chama_memberships (chama_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (chama_id, user_id) DO NOTHING
         RETURNING user_id`,
        [chamaId, userResult.rows[0].id, role]
      );
      await client.query("COMMIT");
      return result.rows[0] ? "added" : "already_member";
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const user = store.users.find((item) => item.email === email);
  if (!user) return "user_not_found";
  if (store.memberships.some((item) => item.chamaId === chamaId && item.userId === user.id)) {
    return "already_member";
  }
  if (role === "chairperson" && store.memberships.some((item) =>
    item.chamaId === chamaId && item.role === "chairperson"
  )) {
    return "chairperson_exists";
  }
  store.memberships.push({ chamaId, userId: user.id, role });
  persistStore();
  return "added";
}

export async function updateChamaMemberRole({ chamaId, userId, role }) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const target = await client.query(
        `SELECT user_id FROM akiba_chama_memberships
         WHERE chama_id = $1 AND user_id = $2 FOR UPDATE`,
        [chamaId, userId]
      );
      if (!target.rows[0]) {
        await client.query("ROLLBACK");
        return false;
      }
      if (role === "chairperson") {
        await client.query(
          `UPDATE akiba_chama_memberships SET role = 'ordinary_member'
           WHERE chama_id = $1 AND role = 'chairperson' AND user_id <> $2`,
          [chamaId, userId]
        );
      }
      await client.query(
        `UPDATE akiba_chama_memberships SET role = $3
         WHERE chama_id = $1 AND user_id = $2`,
        [chamaId, userId, role]
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const membership = store.memberships.find((item) =>
    item.chamaId === chamaId && item.userId === userId
  );
  if (!membership) return false;
  if (role === "chairperson") {
    store.memberships.forEach((item) => {
      if (item.chamaId === chamaId && item.role === "chairperson" && item.userId !== userId) {
        item.role = "ordinary_member";
      }
    });
  }
  membership.role = role;
  persistStore();
  return true;
}

export async function createFinancialApproval(approval) {
  const record = { ...approval, id: randomUUID(), status: "pending", createdAt: new Date().toISOString() };
  if (pool) {
    await pool.query(
      `INSERT INTO akiba_financial_approvals
       (id, chama_id, requested_by, status, amount, description, base_data_hash, proposed_data)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7::jsonb)`,
      [record.id, record.chamaId, record.requestedBy, record.amount,
        record.description, record.baseDataHash, JSON.stringify(record.proposedData)]
    );
    return record;
  }
  store.approvals.push(record);
  persistStore();
  return record;
}

export async function listFinancialApprovals(chamaId) {
  if (pool) {
    const result = await pool.query(
      `SELECT id, chama_id AS "chamaId", requested_by AS "requestedBy",
              reviewed_by AS "reviewedBy", status, amount, description,
              created_at AS "createdAt", reviewed_at AS "reviewedAt"
       FROM akiba_financial_approvals
       WHERE chama_id = $1
       ORDER BY created_at DESC`,
      [chamaId]
    );
    return result.rows;
  }
  return store.approvals
    .filter((approval) => approval.chamaId === chamaId)
    .map(({ proposedData, baseDataHash, ...approval }) => approval)
    .reverse();
}

export async function getFinancialApproval(approvalId, chamaId) {
  if (pool) {
    const result = await pool.query(
      `SELECT id, chama_id AS "chamaId", requested_by AS "requestedBy",
              status, amount, description, base_data_hash AS "baseDataHash",
              proposed_data AS "proposedData"
       FROM akiba_financial_approvals
       WHERE id = $1 AND chama_id = $2`,
      [approvalId, chamaId]
    );
    return result.rows[0] || null;
  }
  return store.approvals.find((approval) =>
    approval.id === approvalId && approval.chamaId === chamaId
  ) || null;
}

export async function decideFinancialApproval({ approvalId, chamaId, reviewerId, decision, currentDataHash }) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT requested_by, status, base_data_hash, proposed_data
         FROM akiba_financial_approvals
         WHERE id = $1 AND chama_id = $2
         FOR UPDATE`,
        [approvalId, chamaId]
      );
      const approval = result.rows[0];
      if (!approval || approval.status !== "pending") {
        await client.query("ROLLBACK");
        return "not_pending";
      }
      if (approval.requested_by === reviewerId) {
        await client.query("ROLLBACK");
        return "self_approval";
      }
      if (decision === "approved" && approval.base_data_hash !== currentDataHash) {
        await client.query(
          `UPDATE akiba_financial_approvals SET status = 'stale', reviewed_by = $2,
           reviewed_at = NOW() WHERE id = $1`,
          [approvalId, reviewerId]
        );
        await client.query("COMMIT");
        return "stale";
      }
      if (decision === "approved") {
        await client.query(
          `UPDATE akiba_chama_data SET data = $2::jsonb, updated_at = NOW()
           WHERE chama_id = $1`,
          [chamaId, JSON.stringify(approval.proposed_data)]
        );
      }
      await client.query(
        `UPDATE akiba_financial_approvals SET status = $2, reviewed_by = $3,
         reviewed_at = NOW() WHERE id = $1`,
        [approvalId, decision, reviewerId]
      );
      await client.query("COMMIT");
      return decision;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const approval = store.approvals.find((item) =>
    item.id === approvalId && item.chamaId === chamaId
  );
  if (!approval || approval.status !== "pending") return "not_pending";
  if (approval.requestedBy === reviewerId) return "self_approval";
  if (decision === "approved" && approval.baseDataHash !== currentDataHash) {
    approval.status = "stale";
  } else {
    approval.status = decision;
    if (decision === "approved") {
      const entry = store.chamaData.find((item) => item.chamaId === chamaId);
      if (entry) entry.data = approval.proposedData;
    }
  }
  approval.reviewedBy = reviewerId;
  approval.reviewedAt = new Date().toISOString();
  persistStore();
  return approval.status;
}

async function createChamaWithClient(client, userId, name) {
  const chamaId = randomUUID();
  const userResult = await client.query("SELECT name FROM akiba_users WHERE id = $1", [userId]);
  await client.query(
    "INSERT INTO akiba_chamas (id, name, created_by) VALUES ($1, $2, $3)",
    [chamaId, name, userId]
  );
  await client.query(
    `INSERT INTO akiba_chama_memberships (chama_id, user_id, role)
     VALUES ($1, $2, 'chairperson')`,
    [chamaId, userId]
  );
  await client.query(
    "INSERT INTO akiba_chama_data (chama_id, data) VALUES ($1, $2::jsonb)",
    [chamaId, JSON.stringify(emptyChamaData(name, userResult.rows[0]?.name || "Chama Admin"))]
  );
}

function createChamaInMemory(user, name) {
  const chamaId = randomUUID();
  store.chamas.push({ id: chamaId, name, createdBy: user.id, createdAt: new Date().toISOString() });
  store.memberships.push({ chamaId, userId: user.id, role: "chairperson" });
  store.chamaData.push({ chamaId, data: emptyChamaData(name, user.name) });
}

function emptyChamaData(chamaName, adminName) {
  return {
    members: [],
    contributions: [],
    loans: [],
    transactions: [],
    pendingMpesaPayments: [],
    settings: { chamaName, adminName, adminEmail: "", contributionDueDay: 5 }
  };
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, passwordHashLength, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
  });
}

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isPlatformAdmin: user.is_platform_admin === true || user.isPlatformAdmin === true
  };
}

function persistStore() {
  const storePath = path.resolve(authDataPath);
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(store, null, 2), { mode: 0o600 });
  renameSync(temporaryPath, storePath);
}

async function migrateLegacyAuthStore() {
  const legacyPath = path.resolve("./data/auth-users.json");
  let legacyStore;
  try {
    legacyStore = JSON.parse(readFileSync(legacyPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (
    !legacyStore ||
    !Array.isArray(legacyStore.users) ||
    !Array.isArray(legacyStore.sessions)
  ) {
    throw new TypeError("Existing Akiba account data has an invalid structure.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const user of legacyStore.users) {
      await client.query(
        `INSERT INTO akiba_users
         (id, name, email, password_salt, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          user.id,
          user.name,
          user.email,
          user.passwordSalt,
          user.passwordHash,
          user.createdAt
        ]
      );
    }
    for (const session of legacyStore.sessions) {
      if (session.expiresAt <= Date.now()) continue;
      await client.query(
        `INSERT INTO akiba_sessions (token_hash, user_id, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (token_hash) DO NOTHING`,
        [session.tokenHash, session.userId, new Date(session.expiresAt)]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

import assert from 'node:assert/strict';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scrypt = promisify(scryptCallback);

test('existing account and chama JSON data imports into relational storage without modifying the source', async () => {
  const dataDirectory = await mkdtemp(path.join(tmpdir(), 'akiba-legacy-import-'));
  const originalDataDirectory = process.env.AKIBA_DATA_DIR;
  process.env.AKIBA_DATA_DIR = dataDirectory;
  const salt = randomBytes(16);
  const password = 'LegacyAkibaPassword2026';
  const source = {
    accounts: [{
      id: 'legacy-admin',
      name: 'Legacy Admin',
      email: 'legacy-admin@example.test',
      role: 'admin',
      salt: salt.toString('base64'),
      passwordHash: (await scrypt(password, salt, 64)).toString('base64')
    }],
    sessions: [],
    chamaData: {
      members: [{
        id: 'legacy-member',
        name: 'Legacy Member',
        phone: '0700000000',
        email: 'legacy-member@example.test',
        idNumber: 'LEGACY-ID',
        role: 'Treasurer',
        joinedDate: '2025-01-01',
        totalSaved: 850,
        monthlyPledge: 200,
        status: 'active'
      }],
      transactions: [{
        id: 'legacy-contribution',
        memberId: 'legacy-member',
        type: 'contribution',
        amount: 850,
        date: '2025-01-15T10:00:00.000Z',
        status: 'completed',
        paymentMethod: 'cash'
      }],
      loans: []
    }
  };
  const originalJson = JSON.stringify(source);
  await writeFile(path.join(dataDirectory, 'accounts.json'), originalJson);

  let server;
  let closeDatabase;
  try {
    const { app } = await import('../server.js?legacy-migration-test');
    const databaseModule = await import('../server/database.js');
    closeDatabase = databaseModule.closeDatabase;
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const login = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'legacy-admin@example.test', password })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const chamaData = await fetch(`${origin}/api/admin/chama-data`, { headers: { Cookie: cookie } });
    assert.equal(chamaData.status, 200);
    const imported = await chamaData.json();
    assert.equal(imported.members.find((member) => member.email === 'legacy-member@example.test').totalSaved, 850);
    assert.equal(imported.members.find((member) => member.email === 'legacy-member@example.test').role, 'treasurer');
    assert.equal(imported.transactions[0].id, 'legacy-contribution');
    assert.equal(await readFile(path.join(dataDirectory, 'accounts.json'), 'utf8'), originalJson);
  } finally {
    if (originalDataDirectory === undefined) delete process.env.AKIBA_DATA_DIR;
    else process.env.AKIBA_DATA_DIR = originalDataDirectory;
    if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    closeDatabase?.();
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('password recovery uses a one-time email token and invalidates prior sessions', async () => {
  const dataDirectory = await mkdtemp(path.join(tmpdir(), 'akiba-auth-test-'));
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    AKIBA_DATA_DIR: process.env.AKIBA_DATA_DIR,
    APP_URL: process.env.APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM
  };
  const sentEmails = [];
  let resendStatus = 200;
  let closeDatabase;

  process.env.AKIBA_DATA_DIR = dataDirectory;
  process.env.APP_URL = 'http://localhost';
  process.env.NODE_ENV = 'test';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.RESEND_FROM = 'Akiba <accounts@example.test>';

  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    sentEmails.push(JSON.parse(options.body));
    return new Response('{}', { status: resendStatus });
  };

  let server;
  try {
    const { app } = await import('../server.js');
    const databaseModule = await import('../server/database.js');
    const { getDatabase } = databaseModule;
    closeDatabase = databaseModule.closeDatabase;
    const db = await getDatabase();
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const clientFetch = originalFetch.bind(globalThis);
    const request = (endpoint, body) => clientFetch(`${origin}${endpoint}`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const registration = await request('/api/auth/register', {
      name: 'Test Member',
      email: 'member@example.test',
      password: 'Akiba123'
    });
    assert.equal(registration.status, 201);
    const originalUser = (await registration.json()).user;
    const originalCookie = registration.headers.get('set-cookie').split(';')[0];

    const unknownEmail = await request('/api/auth/forgot-password', { email: 'missing@example.test' });
    assert.equal(unknownEmail.status, 200);
    assert.equal((await unknownEmail.json()).message, 'If an account exists for that email, a password reset link has been sent.');
    assert.equal(sentEmails.length, 0);

    const recoveryRequest = await request('/api/auth/forgot-password', { email: 'member@example.test' });
    assert.equal(recoveryRequest.status, 200);
    assert.equal(sentEmails.length, 1);
    const resetUrl = sentEmails[0].text.match(/http:\/\/localhost\/#reset_token=[^\s]+/)?.[0];
    assert.ok(resetUrl, 'reset link should be included in the delivered message');
    const token = new URL(resetUrl).hash.slice(1).split('=')[1];
    const savedUser = db.prepare('SELECT password_hash, reset_token_hash FROM users WHERE email = ?').get('member@example.test');
    assert.notEqual(savedUser.reset_token_hash, token, 'only a hash of the raw reset token is stored');
    assert.equal(savedUser.password_hash.includes('Akiba123'), false, 'plaintext password must not be stored');

    const shortPasswordReset = await request('/api/auth/reset-password', {
      token,
      password: 'Short7!'
    });
    assert.equal(shortPasswordReset.status, 400, 'passwords shorter than 8 characters must be rejected');

    const resetAttempts = await Promise.all([
      request('/api/auth/reset-password', { token, password: 'NewPass8' }),
      request('/api/auth/reset-password', { token, password: 'OtherPass8' })
    ]);
    assert.deepEqual(resetAttempts.map((response) => response.status).sort(), [200, 400]);
    const winningPassword = resetAttempts[0].status === 200
      ? 'NewPass8'
      : 'OtherPass8';

    const oldSession = await clientFetch(`${origin}/api/auth/session`, {
      headers: { Cookie: originalCookie }
    });
    assert.deepEqual(await oldSession.json(), { user: null });

    const oldPasswordLogin = await request('/api/auth/login', {
      email: 'member@example.test',
      password: 'Akiba123'
    });
    assert.equal(oldPasswordLogin.status, 401);

    const newPasswordLogin = await request('/api/auth/login', {
      email: 'member@example.test',
      password: winningPassword
    });
    assert.equal(newPasswordLogin.status, 200);

    const reusedToken = await request('/api/auth/reset-password', {
      token,
      password: 'AnotherPass8'
    });
    assert.equal(reusedToken.status, 400);

    const secondRegistration = await request('/api/auth/register', {
      name: 'Another Member',
      email: 'another@example.test',
      password: 'Akiba123'
    });
    assert.equal(secondRegistration.status, 201, 'new signups should create a separate chama with an admin');
    const secondUser = (await secondRegistration.json()).user;
    assert.equal(secondUser.role, 'admin');
    assert.notEqual(secondUser.activeChama.id, originalUser.activeChama.id);
    resendStatus = 500;
    const failedDelivery = await request('/api/auth/forgot-password', { email: 'member@example.test' });
    assert.equal(failedDelivery.status, 502);
    const account = db.prepare('SELECT reset_token_hash FROM users WHERE email = ?').get('member@example.test');
    assert.equal(account.reset_token_hash, null, 'failed email delivery must invalidate the unused reset link');
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    closeDatabase?.();
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('admin invitations create role-scoped accounts through expiring one-time links', async () => {
  const dataDirectory = await mkdtemp(path.join(tmpdir(), 'akiba-invite-test-'));
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    AKIBA_DATA_DIR: process.env.AKIBA_DATA_DIR,
    APP_URL: process.env.APP_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    SOZURI_API_KEY: process.env.SOZURI_API_KEY,
    SOZURI_PROJECT: process.env.SOZURI_PROJECT,
    SOZURI_API_URL: process.env.SOZURI_API_URL,
    SOZURI_FROM: process.env.SOZURI_FROM,
    SOZURI_TYPE: process.env.SOZURI_TYPE
  };
  const sentEmails = [];
  const sentSms = [];
  let resendStatus = 200;
  let closeDatabase;
  let server;

  process.env.AKIBA_DATA_DIR = dataDirectory;
  process.env.APP_URL = 'http://localhost';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.RESEND_FROM = 'Akiba <accounts@example.test>';
  process.env.SOZURI_API_KEY = 'sozuri_test_key';
  process.env.SOZURI_PROJECT = 'akiba-test';
  process.env.SOZURI_API_URL = 'https://sozuri.test/api/v1/messaging';
  process.env.SOZURI_FROM = 'AKIBA';
  process.env.SOZURI_TYPE = 'transactional';

  globalThis.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      sentEmails.push(JSON.parse(options.body));
      return new Response('{}', { status: resendStatus });
    }
    assert.equal(String(url), 'https://sozuri.test/api/v1/messaging');
    const body = JSON.parse(options.body);
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.equal(body.apiKey, 'sozuri_test_key');
    assert.equal(body.project, 'akiba-test');
    assert.equal(body.from, 'AKIBA');
    assert.equal(body.channel, 'sms');
    sentSms.push(body);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  try {
    const { app } = await import('../server.js?member-invitation-test');
    const databaseModule = await import('../server/database.js');
    const { getDatabase } = databaseModule;
    closeDatabase = databaseModule.closeDatabase;
    const db = await getDatabase();
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const clientFetch = originalFetch.bind(globalThis);
    const request = (endpoint, { method = 'GET', body, cookie } = {}) => clientFetch(`${origin}${endpoint}`, {
      method,
      headers: {
        ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });

    const registration = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Chama Admin', email: 'admin@example.test', phone: '0700000000', password: 'AdminAkibaPassword2026', chamaName: 'Chama A' }
    });
    assert.equal(registration.status, 201);
    const admin = (await registration.json()).user;
    const adminCookie = registration.headers.get('set-cookie').split(';')[0];
    assert.equal(admin.role, 'admin');
    assert.equal(admin.activeChama.name, 'Chama A');

    const duplicateEmailRegistration = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Another Admin',
        email: 'admin@example.test',
        password: 'AnotherAdminPassword2026',
        chamaName: 'Another Chama'
      }
    });
    assert.equal(duplicateEmailRegistration.status, 409);
    assert.match((await duplicateEmailRegistration.json()).error, /use a different email to create a separate chama/i);

    const publicRegistration = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Public User', email: 'public@example.test', password: 'PublicAkibaPassword2026' }
    });
    assert.equal(publicRegistration.status, 201);
    const publicAdmin = (await publicRegistration.json()).user;
    assert.equal(publicAdmin.role, 'admin');
    assert.notEqual(publicAdmin.activeChama.id, admin.activeChama.id);

    const emailInviteResponse = await request('/api/admin/invites', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'Invited Admin',
        phoneOrEmail: 'invited-admin@example.test',
        role: 'admin',
        idNumber: 'ID-10',
        monthlyPledge: 2500
      }
    });
    assert.equal(emailInviteResponse.status, 201);
    const emailInvite = await emailInviteResponse.json();
    assert.equal(emailInvite.delivery, 'email');
    assert.equal(sentEmails.length, 1);
    assert.match(sentEmails[0].text, /expires in 48 hours and can only be used once/i);
    const emailedUrl = sentEmails[0].text.match(/http:\/\/localhost\/#invite_token=[^\s]+/)?.[0];
    assert.ok(emailedUrl, 'invitation email should include a link');
    const emailToken = new URL(emailedUrl).hash.slice(1).split('=')[1];
    const storedEmailInvite = db.prepare('SELECT token FROM invites WHERE phone_or_email = ?').get('invited-admin@example.test');
    assert.notEqual(storedEmailInvite.token, emailToken, 'only a hash of the invitation token should be stored');

    const inviteDetailsResponse = await request(`/api/auth/invites/${encodeURIComponent(emailToken)}`);
    assert.equal(inviteDetailsResponse.status, 200);
    assert.deepEqual(await inviteDetailsResponse.json(), {
      name: 'Invited Admin',
      phoneOrEmail: 'invited-admin@example.test',
      role: 'admin',
      chamaName: 'Chama A',
      requiresEmail: false
    });

    const acceptedAdminResponse = await request('/api/auth/accept-invitation', {
      method: 'POST',
      body: { token: emailToken, password: 'InvitedAdminPassword2026' }
    });
    assert.equal(acceptedAdminResponse.status, 201);
    const invitedAdmin = (await acceptedAdminResponse.json()).user;
    assert.equal(invitedAdmin.role, 'admin');
    assert.equal(invitedAdmin.name, 'Invited Admin');
    assert.equal(invitedAdmin.email, 'invited-admin@example.test');

    const reusedEmailInvite = await request('/api/auth/accept-invitation', {
      method: 'POST',
      body: { token: emailToken, password: 'AnotherPassword2026' }
    });
    assert.equal(reusedEmailInvite.status, 410);

    const phoneInviteResponse = await request('/api/admin/invites', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'Phone Invite',
        phoneOrEmail: '+254 700 111 222',
        role: 'member',
        idNumber: 'ID-11',
        monthlyPledge: 1500
      }
    });
    assert.equal(phoneInviteResponse.status, 201);
    const phoneInvite = await phoneInviteResponse.json();
    assert.equal(phoneInvite.delivery, 'sms');
    assert.equal(sentEmails.length, 1);
    assert.equal(sentSms.length, 1);
    assert.equal(sentSms[0].to, '+254700111222');
    assert.match(sentSms[0].message, /Phone Invite/);
    assert.ok(sentSms[0].message.includes(phoneInvite.invitationUrl));
    const phoneToken = new URL(phoneInvite.invitationUrl).hash.slice(1).split('=')[1];

    const phoneDetailsResponse = await request(`/api/auth/invites/${encodeURIComponent(phoneToken)}`);
    assert.deepEqual(await phoneDetailsResponse.json(), {
      name: 'Phone Invite',
      phoneOrEmail: '+254 700 111 222',
      role: 'member',
      chamaName: 'Chama A',
      requiresEmail: true
    });

    const missingEmail = await request('/api/auth/accept-invitation', {
      method: 'POST',
      body: { token: phoneToken, password: 'PhoneMemberPassword2026' }
    });
    assert.equal(missingEmail.status, 400);

    const acceptedMemberResponse = await request('/api/auth/accept-invitation', {
      method: 'POST',
      body: { token: phoneToken, email: 'phone-member@example.test', password: 'PhoneMemberPassword2026' }
    });
    assert.equal(acceptedMemberResponse.status, 201);
    const invitedMember = (await acceptedMemberResponse.json()).user;
    assert.equal(invitedMember.role, 'member');
    const savedMembership = db.prepare('SELECT phone, monthly_pledge FROM memberships WHERE id = ?')
      .get(invitedMember.membershipId);
    assert.equal(savedMembership.phone, '+254 700 111 222');
    assert.equal(savedMembership.monthly_pledge, 1500);

    const expiringInviteResponse = await request('/api/admin/invites', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'Expired Invite',
        phoneOrEmail: '0700111223',
        role: 'member',
        monthlyPledge: 0
      }
    });
    assert.equal(expiringInviteResponse.status, 201);
    const expiringToken = new URL((await expiringInviteResponse.json()).invitationUrl).hash.slice(1).split('=')[1];
    db.prepare('UPDATE invites SET expires_at = ? WHERE phone_or_email = ?').run(Date.now() - 1, '0700111223');
    const expiredInviteResponse = await request(`/api/auth/invites/${encodeURIComponent(expiringToken)}`);
    assert.equal(expiredInviteResponse.status, 410);

    resendStatus = 500;
    const failedDelivery = await request('/api/admin/invites', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'Email Delivery Failure',
        phoneOrEmail: 'delivery-failure@example.test',
        role: 'member',
        monthlyPledge: 0
      }
    });
    assert.equal(failedDelivery.status, 502);
    const invalidatedInvite = db.prepare('SELECT expires_at AS expiresAt FROM invites WHERE phone_or_email = ?')
      .get('delivery-failure@example.test');
    assert.ok(invalidatedInvite.expiresAt <= Date.now(), 'failed email delivery must invalidate the token');
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

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('one user has chama-specific roles and member requests are scoped and read-only', async () => {
  const dataDirectory = await mkdtemp(path.join(tmpdir(), 'akiba-rbac-test-'));
  const originalDataDirectory = process.env.AKIBA_DATA_DIR;
  process.env.AKIBA_DATA_DIR = dataDirectory;

  let server;
  let closeDatabase;
  try {
    const { app } = await import('../server.js?chama-rbac-test');
    const databaseModule = await import('../server/database.js');
    const { getDatabase } = databaseModule;
    closeDatabase = databaseModule.closeDatabase;
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = (endpoint, { method = 'GET', body, cookie } = {}) => fetch(`${origin}${endpoint}`, {
      method,
      headers: {
        ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const cookieFrom = (response) => response.headers.get('set-cookie').split(';')[0];

    const adminRegistration = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Chama Admin', email: 'admin@example.test', password: 'AdminAkibaPassword2026', chamaName: 'Chama A' }
    });
    assert.equal(adminRegistration.status, 201);
    const adminUser = (await adminRegistration.json()).user;
    assert.equal(adminUser.role, 'admin');
    assert.equal(adminUser.activeChama.name, 'Chama A');
    const adminCookie = cookieFrom(adminRegistration);

    const publicRegistration = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Public User', email: 'public@example.test', password: 'PublicAkibaPassword2026' }
    });
    assert.equal(publicRegistration.status, 403);

    const createMember = (member, cookie = adminCookie) => request('/api/admin/members', {
      method: 'POST',
      cookie,
      body: { phone: '0700000000', idNumber: 'ID-1', monthlyPledge: 500, ...member }
    });
    const aliceResponse = await createMember({
      name: 'Alice Member', email: 'alice@example.test',
      password: 'AliceAkibaPassword2026', role: 'member'
    });
    assert.equal(aliceResponse.status, 201);
    const aliceA = (await aliceResponse.json()).member;
    const beatriceResponse = await createMember({
      name: 'Beatrice Member', email: 'beatrice@example.test',
      password: 'BeatriceAkibaPassword2026', role: 'member'
    });
    assert.equal(beatriceResponse.status, 201);
    const beatriceA = (await beatriceResponse.json()).member;

    const chamaBResponse = await request('/api/admin/chamas', {
      method: 'POST', cookie: adminCookie, body: { name: 'Chama B' }
    });
    assert.equal(chamaBResponse.status, 201);
    const chamaB = (await chamaBResponse.json()).chama;
    const adminInBResponse = await request('/api/auth/active-chama', {
      method: 'POST', cookie: adminCookie, body: { chamaId: chamaB.id }
    });
    assert.equal(adminInBResponse.status, 200);
    const adminInBCookie = adminCookie;
    const aliceBResponse = await createMember({
      name: 'Alice Member', email: 'alice@example.test', role: 'treasurer'
    }, adminInBCookie);
    assert.equal(aliceBResponse.status, 201);
    assert.equal((await aliceBResponse.json()).member.role, 'treasurer');

    await request('/api/auth/active-chama', {
      method: 'POST', cookie: adminInBCookie, body: { chamaId: adminUser.activeChama.id }
    });
    const adminDataBeforeSave = await request('/api/admin/chama-data', { cookie: adminCookie });
    const adminMember = (await adminDataBeforeSave.json()).members.find((member) => member.email === 'admin@example.test');
    assert.ok(adminMember);
    const savedData = {
      members: [
        adminMember,
        { ...aliceA, totalSaved: 500 },
        { ...beatriceA, totalSaved: 300 }
      ],
      transactions: [
        { id: 'alice-tx', memberId: aliceA.id, type: 'contribution', amount: 500, date: new Date().toISOString(), status: 'completed', paymentMethod: 'cash' },
        { id: 'peer-tx', memberId: beatriceA.id, type: 'contribution', amount: 300, date: new Date().toISOString(), status: 'completed', paymentMethod: 'cash', notes: 'private peer transaction' }
      ],
      loans: [
        { id: 'alice-loan', memberId: aliceA.id, amount: 100, interestRate: 0, durationMonths: 1, startDate: '2026-01-01', dueDate: '2026-02-01', monthlyInstallment: 100, totalRepayment: 100, amountRepaid: 0, guarantorName: 'Member', status: 'active' }
      ]
    };
    const saveResponse = await request('/api/admin/chama-data', {
      method: 'PUT', cookie: adminCookie, body: savedData
    });
    assert.equal(saveResponse.status, 200, JSON.stringify(await saveResponse.json()));

    const loginWithoutChama = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.test', password: 'AliceAkibaPassword2026' }
    });
    assert.equal(loginWithoutChama.status, 200);
    const loginChoices = await loginWithoutChama.json();
    assert.equal(loginChoices.requiresChamaSelection, true);
    assert.deepEqual(loginChoices.memberships.map((item) => item.role).sort(), ['member', 'treasurer']);

    const memberLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.test', password: 'AliceAkibaPassword2026', chamaId: adminUser.activeChama.id }
    });
    assert.equal(memberLogin.status, 200);
    const memberCookie = cookieFrom(memberLogin);
    const memberContext = (await memberLogin.json()).user;
    assert.equal(memberContext.role, 'member');
    assert.deepEqual(memberContext.activeChama, { id: adminUser.activeChama.id, name: 'Chama A' });

    const memberAdminData = await request('/api/admin/chama-data', { cookie: memberCookie });
    assert.equal(memberAdminData.status, 403);
    assert.deepEqual(await memberAdminData.json(), { error: 'You do not have permission to perform this action.' });
    for (const route of ['/api/admin/members', '/api/admin/contributions', '/api/admin/loans', '/api/admin/payouts', '/api/admin/settings']) {
      const forbidden = await request(route, { cookie: memberCookie });
      assert.equal(forbidden.status, 403, `${route} should be admin-only`);
      assert.deepEqual(await forbidden.json(), { error: 'You do not have permission to perform this action.' });
    }

    const memberWrite = await request('/api/admin/chama-data', {
      method: 'PUT', cookie: memberCookie, body: savedData
    });
    assert.equal(memberWrite.status, 403);
    const memberCreation = await request('/api/admin/members', {
      method: 'POST', cookie: memberCookie,
      body: { name: 'Intruder', email: 'intruder@example.test', password: 'IntruderAkibaPassword2026', role: 'admin' }
    });
    assert.equal(memberCreation.status, 403);

    const memberContribution = await request('/api/member/contributions', {
      method: 'POST', cookie: memberCookie, body: { amount: 25, paymentMethod: 'cash' }
    });
    assert.equal(memberContribution.status, 201);
    const memberLoan = await request('/api/member/loans', {
      method: 'POST', cookie: memberCookie, body: { amount: 200, durationMonths: 2 }
    });
    assert.equal(memberLoan.status, 201);

    const portalResponse = await request('/api/member/dashboard', { cookie: memberCookie });
    assert.equal(portalResponse.status, 200);
    const portal = await portalResponse.json();
    assert.equal(portal.role, 'member');
    assert.equal(portal.member.email, 'alice@example.test');
    assert.equal(portal.member.activeLoanAmount, 100);
    assert.equal(portal.group.totalSavings, 800);
    assert.deepEqual(portal.transactions.map((transaction) => transaction.id).sort(), [
      'alice-tx',
      (await memberContribution.json()).id
    ].sort());
    assert.deepEqual(portal.loans.map((loan) => loan.id).sort(), [
      'alice-loan',
      (await memberLoan.json()).id
    ].sort());
    assert.deepEqual(portal.group.members.find((member) => member.id === beatriceA.id), {
      id: beatriceA.id, name: 'Beatrice Member', role: 'member'
    });
    assert.equal(JSON.stringify(portal).includes('private peer transaction'), false);
    assert.equal(JSON.stringify(portal).includes('0799999999'), false);

    const noDeleteResponse = await request('/api/admin/chama-data', {
      method: 'PUT', cookie: adminCookie, body: { ...savedData, transactions: [savedData.transactions[0]] }
    });
    assert.equal(noDeleteResponse.status, 400);
    const correction = await request('/api/admin/contributions/alice-tx', {
      method: 'PATCH', cookie: adminCookie, body: { amount: 550, status: 'confirmed', notes: 'Audited correction' }
    });
    assert.equal(correction.status, 200);
    const correctedPortal = await request('/api/member/dashboard', { cookie: memberCookie });
    const correctedMemberData = await correctedPortal.json();
    assert.equal(correctedMemberData.member.totalSaved, 550);
    assert.equal(correctedMemberData.group.totalSavings, 850);
    const db = await getDatabase();
    assert.ok(db.prepare('SELECT COUNT(*) AS count FROM audit_logs WHERE chama_id = ?').get(adminUser.activeChama.id).count >= 5);
    const correctionAudit = db.prepare(`
      SELECT metadata FROM audit_logs WHERE chama_id = ? AND action = 'contribution.corrected'
    `).get(adminUser.activeChama.id);
    assert.equal(JSON.parse(correctionAudit.metadata).balanceAdjustment, 50);

    const loginInB = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.test', password: 'AliceAkibaPassword2026', chamaId: chamaB.id }
    });
    assert.equal(loginInB.status, 200);
    assert.equal((await loginInB.json()).user.role, 'treasurer');
    const treasurerCookie = cookieFrom(loginInB);
    const treasurerAdminRoute = await request('/api/admin/payouts', { cookie: treasurerCookie });
    assert.equal(treasurerAdminRoute.status, 403);

    const chamaCResponse = await request('/api/admin/chamas', {
      method: 'POST', cookie: adminCookie, body: { name: 'Chama C' }
    });
    assert.equal(chamaCResponse.status, 201);
    const chamaC = (await chamaCResponse.json()).chama;
    const joinRequest = await request('/api/chama-join-requests', {
      method: 'POST', cookie: memberCookie, body: { chamaId: chamaC.id }
    });
    assert.equal(joinRequest.status, 201);
    const pendingMembershipId = (await joinRequest.json()).membershipId;
    await request('/api/auth/active-chama', {
      method: 'POST', cookie: adminCookie, body: { chamaId: chamaC.id }
    });
    const approval = await request(`/api/admin/members/${pendingMembershipId}`, {
      method: 'PATCH', cookie: adminCookie, body: { status: 'active', role: 'secretary' }
    });
    assert.equal(approval.status, 200);
    const secretaryLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.test', password: 'AliceAkibaPassword2026', chamaId: chamaC.id }
    });
    assert.equal(secretaryLogin.status, 200);
    assert.equal((await secretaryLogin.json()).user.role, 'secretary');
  } finally {
    if (originalDataDirectory === undefined) delete process.env.AKIBA_DATA_DIR;
    else process.env.AKIBA_DATA_DIR = originalDataDirectory;
    if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    closeDatabase?.();
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import express from 'express';
import { createApiRouter } from './api.js';
import { createAuthRouter, requireAuth } from './auth.js';
import { createDatabase } from './database.js';

let db;
let server;
let baseUrl;
let sessionCookie;

const member = {
  id: 'member-1',
  name: 'Test Member',
  phone: '0712345678',
  email: 'test@example.com',
  idNumber: '12345678',
  role: 'Member',
  joinedDate: '2026-01-01',
  totalSaved: 1000,
  monthlyPledge: 500,
  status: 'active',
  activeLoanAmount: 0,
};

const pendingLoan = {
  id: 'loan-1',
  memberId: member.id,
  memberName: member.name,
  amount: 1000,
  interestRate: 10,
  durationMonths: 1,
  startDate: '2026-01-01',
  dueDate: '2026-02-01',
  monthlyInstallment: 1100,
  totalRepayment: 1100,
  amountRepaid: 0,
  guarantorName: 'Other Member',
  status: 'pending',
};

const transaction = (overrides = {}) => ({
  id: `transaction-${crypto.randomUUID()}`,
  memberId: member.id,
  memberName: member.name,
  phone: member.phone,
  type: 'contribution',
  amount: 250,
  date: '2026-01-01 10:00',
  status: 'completed',
  paymentMethod: 'cash',
  mpesaRef: '',
  notes: '',
  ...overrides,
});

beforeEach(async () => {
  db = createDatabase(':memory:');
  const app = express();
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api', requireAuth(db), createApiRouter(db));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const signup = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'operator@example.com', password: 'a-strong-password' }),
  });
  sessionCookie = signup.headers.get('set-cookie').split(';')[0];
});

async function apiRequest(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('cookie', sessionCookie);
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

afterEach(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  db.close();
});

test('initializes an empty database once and loads persisted records', async () => {
  const initialized = await apiRequest('/initialize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ members: [member], loans: [pendingLoan], transactions: [] }),
  });
  assert.deepEqual(await initialized.json(), { initialized: true });

  const duplicateInitialize = await apiRequest('/initialize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ members: [member], loans: [pendingLoan], transactions: [] }),
  });
  assert.deepEqual(await duplicateInitialize.json(), { initialized: false });

  const loaded = await apiRequest('/data');
  assert.deepEqual(await loaded.json(), {
    members: [member],
    loans: [pendingLoan],
    transactions: [],
  });
});

test('records a contribution atomically and updates the member savings total', async () => {
  db.prepare('insert into members (id, data) values (?, ?)').run(member.id, JSON.stringify(member));
  const response = await apiRequest('/transactions/contribution', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(transaction()),
  });

  assert.equal(response.status, 201);
  const loaded = await apiRequest('/data').then((result) => result.json());
  assert.equal(loaded.members[0].totalSaved, 1250);
  assert.equal(loaded.transactions.length, 1);
});

test('rolls back failed payments and rejects duplicate M-PESA receipts', async () => {
  db.prepare('insert into members (id, data) values (?, ?)').run(member.id, JSON.stringify(member));
  const payment = transaction({
    type: 'contribution',
    paymentMethod: 'mpesa',
    mpesaRef: 'QHK1234ABC',
  });

  const firstResponse = await apiRequest('/transactions/mpesa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payment),
  });
  assert.equal(firstResponse.status, 201);

  const duplicateResponse = await apiRequest('/transactions/mpesa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payment, id: 'duplicate-payment' }),
  });
  assert.equal(duplicateResponse.status, 409);

  const missingMemberResponse = await apiRequest('/transactions/contribution', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(transaction({ memberId: 'missing-member' })),
  });
  assert.equal(missingMemberResponse.status, 500);
  const loaded = await apiRequest('/data').then((result) => result.json());
  assert.equal(loaded.members[0].totalSaved, 1250);
  assert.equal(loaded.transactions.length, 1);
});

test('approves a pending loan and records its disbursement in one transaction', async () => {
  db.prepare('insert into members (id, data) values (?, ?)').run(member.id, JSON.stringify(member));
  db.prepare('insert into loans (id, member_id, data) values (?, ?, ?)')
    .run(pendingLoan.id, pendingLoan.memberId, JSON.stringify(pendingLoan));

  const disbursement = transaction({
    id: 'disbursement-1',
    type: 'loan_disbursement',
    amount: pendingLoan.amount,
    paymentMethod: 'mpesa',
    mpesaRef: 'QHK5678ABC',
  });
  const response = await apiRequest(`/loans/${pendingLoan.id}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(disbursement),
  });
  assert.equal(response.status, 200);

  const loaded = await apiRequest('/data').then((result) => result.json());
  assert.equal(loaded.loans[0].status, 'active');
  assert.equal(loaded.transactions[0].type, 'loan_disbursement');
});

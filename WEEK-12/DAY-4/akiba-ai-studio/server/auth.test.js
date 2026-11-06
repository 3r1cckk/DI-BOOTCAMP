import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import express from 'express';
import { createApiRouter } from './api.js';
import { createAuthRouter, requireAuth } from './auth.js';
import { createDatabase, getUserByEmail } from './database.js';

let db;
let server;
let baseUrl;

beforeEach(async () => {
  db = createDatabase(':memory:');
  const app = express();
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api', requireAuth(db), createApiRouter(db));
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  db.close();
});

const json = (body) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

test('sign-up saves a password hash, starts a session, and protects chama data', async () => {
  const response = await fetch(`${baseUrl}/auth/signup`, json({
    email: 'Treasurer@example.com',
    password: 'a-strong-password',
  }));
  assert.equal(response.status, 201);

  const { user } = await response.json();
  assert.equal(user.email, 'treasurer@example.com');
  assert.equal('password' in user, false);

  const storedUser = getUserByEmail(db, user.email);
  assert.notEqual(storedUser.passwordHash, 'a-strong-password');
  assert.equal(storedUser.passwordSalt.length, 32);

  const cookie = response.headers.get('set-cookie').split(';')[0];
  const currentUser = await fetch(`${baseUrl}/auth/me`, { headers: { cookie } }).then((result) => result.json());
  assert.deepEqual(currentUser.user, user);
  assert.equal((await fetch(`${baseUrl}/data`)).status, 401);
  assert.equal((await fetch(`${baseUrl}/data`, { headers: { cookie } })).status, 200);
});

test('rejects invalid sign-ups and duplicate email addresses', async () => {
  const invalidPassword = await fetch(`${baseUrl}/auth/signup`, json({
    email: 'member@example.com',
    password: 'short',
  }));
  assert.equal(invalidPassword.status, 400);

  const signup = () => fetch(`${baseUrl}/auth/signup`, json({
    email: 'member@example.com',
    password: 'a-strong-password',
  }));
  assert.equal((await signup()).status, 201);
  assert.equal((await signup()).status, 409);
});

test('login validates the password and logout revokes the database session', async () => {
  await fetch(`${baseUrl}/auth/signup`, json({
    email: 'member@example.com',
    password: 'a-strong-password',
  }));

  const wrongPassword = await fetch(`${baseUrl}/auth/login`, json({
    email: 'member@example.com',
    password: 'not-the-password',
  }));
  assert.equal(wrongPassword.status, 401);

  const login = await fetch(`${baseUrl}/auth/login`, json({
    email: 'MEMBER@example.com',
    password: 'a-strong-password',
  }));
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];

  const logout = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { cookie },
  });
  assert.equal(logout.status, 200);
  const currentUser = await fetch(`${baseUrl}/auth/me`, { headers: { cookie } }).then((result) => result.json());
  assert.equal(currentUser.user, null);
});

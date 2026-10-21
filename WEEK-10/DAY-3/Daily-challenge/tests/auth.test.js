import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import request from 'supertest'

const testDirectory = mkdtempSync(join(tmpdir(), 'jwt-auth-guide-'))
process.env.DATABASE_PATH = join(testDirectory, 'auth.sqlite')
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-that-is-at-least-32-characters'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-that-is-at-least-32-characters'
process.env.NODE_ENV = 'test'

const { app } = await import('../src/app.js')
const { database } = await import('../src/database.js')

after(() => {
  database.close()
  rmSync(testDirectory, { recursive: true, force: true })
})

test('registration creates an account and protects the profile route', async () => {
  const client = request.agent(app)
  const registration = await client.post('/api/auth/register').send({
    username: 'test_cook',
    email: 'test@example.com',
    password: 'correct-horse-42',
  })

  assert.equal(registration.status, 201)
  assert.equal(registration.body.user.username, 'test_cook')
  assert.match(registration.headers['set-cookie'].join(';'), /HttpOnly/)

  const profile = await client.get('/api/profile')
  assert.equal(profile.status, 200)
  assert.equal(profile.body.user.email, 'test@example.com')

  const updated = await client.patch('/api/profile').send({ username: 'new_cook' })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.user.username, 'new_cook')
})

test('registration validates input and prevents duplicate usernames', async () => {
  const invalid = await request(app).post('/api/auth/register').send({
    username: 'x',
    email: 'not-an-email',
    password: 'short',
  })
  assert.equal(invalid.status, 400)

  const duplicate = await request(app).post('/api/auth/register').send({
    username: 'new_cook',
    email: 'another@example.com',
    password: 'correct-horse-42',
  })
  assert.equal(duplicate.status, 409)
})

test('login accepts an email address and refresh rotates and revokes tokens', async () => {
  const client = request.agent(app)
  const login = await client.post('/api/auth/login').send({
    login: 'test@example.com',
    password: 'correct-horse-42',
  })
  assert.equal(login.status, 200)

  const originalRefreshCookie = login.headers['set-cookie'].find((cookie) =>
    cookie.startsWith('refreshToken='),
  )
  assert.ok(originalRefreshCookie)

  const refresh = await client.post('/api/auth/refresh')
  assert.equal(refresh.status, 200)
  const replay = await request(app)
    .post('/api/auth/refresh')
    .set('Cookie', originalRefreshCookie.split(';')[0])
  assert.equal(replay.status, 401)

  const currentRefreshCookie = refresh.headers['set-cookie'].find((cookie) =>
    cookie.startsWith('refreshToken='),
  )
  assert.ok(currentRefreshCookie)
  const logout = await client.post('/api/auth/logout')
  assert.equal(logout.status, 200)

  const afterLogout = await request(app)
    .post('/api/auth/refresh')
    .set('Cookie', currentRefreshCookie.split(';')[0])
  assert.equal(afterLogout.status, 401)
})

test('protected profile route rejects requests without an access token', async () => {
  const response = await request(app).get('/api/profile')
  assert.equal(response.status, 401)
})

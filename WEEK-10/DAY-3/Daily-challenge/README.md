# JWT authentication in Node.js and Express

A small, runnable walkthrough of registration, password hashing, JWT
authentication, protected profile routes, HTTP-only cookies, refresh-token
rotation, logout, and SQLite persistence. The Matrix-style background is
decorative; it does not affect the authentication flow.

## Requirements

- Node.js 22.5 or later (the project uses the built-in `node:sqlite` module)
- npm

## Get started

```powershell
cd WEEK-10\DAY-3\Daily-challenge
npm install
Copy-Item .env.example .env
```

Open `.env`. Replace both token secrets with separate random values of at least
32 characters. The start scripts load this file. For example, generate secrets with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Run that command twice, and use the two different values for
`ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.

Start the server:

```powershell
npm run dev
```

Visit <http://localhost:3000>. User accounts are stored in `data/auth.sqlite`;
passwords are stored as bcrypt hashes. The database and `.env` file are ignored
by Git.

## What is a JWT?

A JSON Web Token has three base64url-encoded parts:

1. **Header** — describes the token type and signing algorithm.
2. **Payload** — carries claims such as the user ID, token type, and expiry.
3. **Signature** — lets the server detect a token whose contents were changed.

A signed JWT is not encrypted. Anyone holding one can read its header and
payload, so never put passwords, secrets, or private user data inside. This
guide uses short-lived access tokens for protected routes and longer-lived
refresh tokens to renew a session.

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Validate a new account, hash its password, and sign in |
| `POST` | `/api/auth/login` | Verify a password and sign in |
| `POST` | `/api/auth/refresh` | Revoke a refresh token and rotate the session |
| `POST` | `/api/auth/logout` | Revoke the current refresh token and clear cookies |
| `GET` | `/api/profile` | Read the signed-in user's protected profile |
| `PATCH` | `/api/profile` | Change the signed-in user's username |
| `GET` | `/api/health` | Check that the server is running |

Access tokens expire after 15 minutes. Refresh tokens expire after 7 days; only
a SHA-256 hash of each refresh token is stored in SQLite. The cookies are
`httpOnly`, `sameSite: strict`, and `secure` in production. The API also limits
registration/login attempts and refresh requests.

## Step-by-step checklist

- [x] Set up Express and the required authentication middleware.
- [x] Validate usernames, email addresses, and passwords.
- [x] Hash passwords with bcrypt and compare them at login.
- [x] Sign access and refresh JWTs with different secrets and expiry times.
- [x] Verify access JWTs in middleware before protected profile routes.
- [x] Set tokens in HTTP-only cookies and clear them on logout.
- [x] Rotate refresh tokens and revoke them on refresh and logout.
- [x] Persist users and refresh-token hashes in SQLite.
- [x] Rate-limit authentication endpoints.
- [ ] Add email verification before enabling a newly registered account.
- [ ] For a production app, review CSRF protections, HTTPS, secret rotation,
  backups, monitoring, and your database's operational needs.

## Try it with curl

Registration sets cookies. Save them to a local cookie jar:

```powershell
curl.exe -i -c cookies.txt -H "Content-Type: application/json" `
  -d '{"username":"alex_1","email":"alex@example.com","password":"correct-horse-42"}' `
  http://localhost:3000/api/auth/register
```

Use the saved access cookie on a protected route:

```powershell
curl.exe -i -b cookies.txt http://localhost:3000/api/profile
```

Refresh or sign out using the same cookie jar:

```powershell
curl.exe -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/refresh
curl.exe -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout
```

Do not use real passwords in a shared or production environment for these
examples.

## Verify the project

```powershell
npm run check
npm test
```

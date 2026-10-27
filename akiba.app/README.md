# Akiba M-Pesa sandbox

Akiba can request chama contributions using Safaricom Daraja's sandbox STK
Push. Daraja credentials stay on the Express server. Contributions are added to
the dashboard only after the callback confirms the amount, phone number, and
M-Pesa receipt.

This is a sandbox integration, not a live-money setup. Akiba stores account
and session records in PostgreSQL, using the connection settings in `.env`;
the server applies the auth schema from `database.sql` on startup. M-Pesa
payment requests are stored locally in `data/mpesa-payments.json`. Chama
member, loan, contribution, and transaction records still live in each
browser's local storage: accounts do not yet have separate or synchronized
group data. Do not use this prototype for real group funds or expose it
publicly. Production use needs a shared database with per-chama access
controls, deployment HTTPS, account recovery, and Safaricom production
onboarding.

## Chama data backups

From **Settings**, download an Akiba JSON backup to keep a private copy of the
current browser's chama records. Restore accepts versioned Akiba backups up to
5 MB, validates their structure, and asks for confirmation before replacing
the records in that browser. Backups contain member contact information and
financial records, so store them securely. They do not contain account
passwords or Daraja credentials.

## Sign-in

Akiba uses a standard account sign-in flow. Each user creates an account with
an email and personal password, then signs in with those same credentials.
The app keeps only a password hash in storage and never exposes it to the
browser.

## Set up the sandbox

1. Create a Daraja app in the Safaricom developer portal and get its sandbox
   consumer key, consumer secret, Till shortcode, and Lipa Na M-Pesa passkey.
2. Ensure PostgreSQL is running and the database named in `PGDATABASE` exists.
   Set `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` in `.env`
   to match your PostgreSQL setup. Akiba creates the required account and
   session tables from `database.sql` when it starts.
3. If `.env` does not exist, copy `.env.example` to `.env`. If `.env` already
   exists, keep its current settings and add any missing M-Pesa variables from
   `.env.example`; do not replace the existing file. Fill in any needed sandbox
   values. Never commit `.env` or paste its secrets into chat.
4. Expose the local Akiba server at port 3000 with an HTTPS tunnel such as
   ngrok or Cloudflare Tunnel. Set `MPESA_CALLBACK_URL` to the tunnel's public
   HTTPS URL followed by `/api/mpesa/callback`.
5. Set `MPESA_CALLBACK_SECRET` to a long random value. Akiba adds it to the
   callback URL and rejects callbacks that do not include it.
6. Start Akiba from this directory:

   ```powershell
   # If .env does not already exist:
   Copy-Item .env.example .env
   # Otherwise add the M-Pesa entries from .env.example to the existing .env.
   # Edit .env with the credentials and public callback URL.
   npm start
   ```

   Open `http://localhost:3000/`. Do not use VS Code Live Server or another
   static-file server for sign-in: it does not run the account API. The landing
   page and its sign-in form must be loaded from Akiba's Express server.

In Contributions, choose **Record contribution**, enter the member, a whole
KES amount, select **M-Pesa STK Push**, and enter a Kenyan phone number. The
member must approve the prompt. The dashboard updates only when the sandbox
callback reports a successful payment. If the dashboard is closed or reloaded
while a prompt is pending, Akiba resumes checking its status when the dashboard
is opened again. The **Record cash / other payment** option preserves manual
contribution recording.

## Payment API

- `POST /api/mpesa/stk-push` validates the contribution and starts a
  `CustomerBuyGoodsOnline` STK Push for the configured Till.
- `POST /api/mpesa/callback` accepts the secret-protected Daraja callback and
  checks its amount, phone number, and receipt against the pending request.
- `GET /api/mpesa/status/:checkoutRequestId` lets the dashboard check whether
  the request is pending, completed, or failed.

Payment records are stored locally so pending requests survive a server
restart. Although sign-in is implemented, this demo still lacks per-chama data
isolation, password recovery, and a production-grade payment database. Keep
`.env` and the `data/` directory private and out of Git.

## Checks

```powershell
npm test
node --check server.js
node --check app.js
```

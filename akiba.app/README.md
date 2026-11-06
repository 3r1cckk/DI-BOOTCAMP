# Akiba M-Pesa sandbox

Akiba can request chama contributions using Safaricom Daraja's sandbox STK
Push. Daraja credentials stay on the Express server. Contributions are added to
the dashboard only after the callback confirms the amount, phone number, and
M-Pesa receipt.

This is a sandbox integration, not a live-money setup. Akiba stores account
and session records in PostgreSQL, using the connection settings in `.env`;
the server applies the schema from `database.sql` on startup. Login passwords
are stored as salted hashes, not plaintext. Chama members, loans, loan
repayments, contributions, and transactions are also saved to PostgreSQL in
each chama's `akiba_chama_data` JSONB record, so they are shared with authorized
members of that chama rather than kept only in the browser. M-Pesa payment
requests are stored locally in `data/mpesa-payments.json`. Do not use this
prototype for real group funds or expose it publicly. Production use needs
deployment HTTPS, account recovery, and Safaricom production onboarding.

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
New accounts must verify their email before they can sign in; verification
links expire after 24 hours, and the sign-in form can resend them. Existing
accounts are kept verified during the schema migration. The app keeps only a
password hash and a hash of each verification token in storage.

## Member invitations

Chairpersons and secretaries can create invitation links from **Members**.
Links expire after seven days and can be accepted once. Invitees can create an
Akiba account or sign in to join the chama; secretaries can invite ordinary
members only. Set `AKIBA_PUBLIC_URL` to the canonical HTTPS origin if links
should use a fixed public hostname; otherwise Akiba uses the request hostname.

## Set up the sandbox

1. Create a Daraja app in the Safaricom developer portal and get its sandbox
   consumer key, consumer secret, Till shortcode, and Lipa Na M-Pesa passkey.
2. Ensure PostgreSQL is running and the database named in `PGDATABASE` exists.
   Set `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` in `.env`
   to match your PostgreSQL setup. Akiba creates the required account, session,
   invitation, and verification tables from `database.sql` when it starts.
3. If `.env` does not exist, copy `.env.example` to `.env`. If `.env` already
   exists, keep its current settings and add any missing email and M-Pesa
   variables from `.env.example`; do not replace the existing file. Fill in any
   needed sandbox values. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
   `SMTP_PASSWORD`, and `AKIBA_EMAIL_FROM` with your email provider's SMTP
   settings. Set `AKIBA_PUBLIC_URL` to Akiba's public HTTPS origin; this is
   required in production so verification and invitation links use the trusted
   hostname. Never commit `.env` or paste its secrets into chat.
4. Expose the local Akiba server at port 3000 with an HTTPS tunnel such as
   ngrok or Cloudflare Tunnel. Set `MPESA_CALLBACK_URL` to the tunnel's public
   HTTPS URL followed by `/api/mpesa/callback`.
5. Set `MPESA_CALLBACK_SECRET` to a long random value. Akiba adds it to the
   callback URL and rejects callbacks that do not include it.
6. Start Akiba from this directory:

   ```powershell
   # If .env does not already exist:
   Copy-Item .env.example .env
   # Otherwise add missing email and M-Pesa entries from .env.example to .env.
   # Edit .env with the credentials, sender, and public URLs.
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

The Contributions workspace also tracks monthly pledged amounts against
recorded payments. Set each member's monthly pledge and the due day in Chama
Settings to see due, due-soon, partially paid, and overdue statuses. Reminder
buttons open a prefilled WhatsApp message for members with a valid Kenyan phone
number; messages are drafts and are never sent automatically. The notification
bell opens this follow-up list when any monthly pledge remains outstanding.

The Loans workspace tracks principal, one-time simple interest, repayments,
remaining balance, and due-date status. Record full or partial repayments from
each outstanding loan; repayment entries are append-only for treasurers and
cannot exceed the loan balance. Existing loans without an interest rate are
treated as zero-interest loans.

The dashboard highlights monthly pledge collection, outstanding pledges, and
net cash flow. **Reports** includes a six-month comparison of contributions,
other income, and expenses, plus loan repayment and outstanding-balance totals.

Loans and expenses of KES 50,000 or more require review by a different
authorized financial manager before they are recorded. The **Approvals**
workspace lets chairpersons and treasurers review requests; requesters cannot
approve their own operations. The **Audit log** records financial record
changes with record references, approval requests, decisions, the acting user,
and the time. The workspace shows the latest 200 events; the log is read-only
and available to chairpersons and treasurers.

Contributions, Loans, Transactions, and Reports provide an **Export CSV**
download. Contribution exports include receipt and M-Pesa reference details;
loan exports include both loan balances and itemized repayments. CSV text is
escaped for spreadsheet compatibility, with formula-like text neutralized.
Exports contain private member and financial information; store them securely.

## Payment API

- `POST /api/mpesa/stk-push` validates the contribution and starts a
  `CustomerBuyGoodsOnline` STK Push for the configured Till.
- `POST /api/mpesa/callback` accepts the secret-protected Daraja callback and
  checks its amount, phone number, and receipt against the pending request.
- `GET /api/mpesa/status/:checkoutRequestId` lets the dashboard check whether
  the request is pending, completed, or failed.

Payment records are stored locally so pending requests survive a server
restart. Per-chama membership and access controls are enforced by the API, but
this demo still lacks password recovery and a production-grade payment
database. Keep `.env` and the `data/` directory private and out of Git.

## Checks

```powershell
npm test
node --check server.js
node --check app.js
```

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e476a830-8206-4eca-8e06-30bdeadde17a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` if using Gemini features.
3. Set `VITE_POCHI_BUSINESS_PHONE` in `.env.local` to the recipient Pochi la Biashara number.
4. Open the landing page and choose **Sign up** to create an account, or **Log in** if you already registered.
5. Run the app and SQLite database together:
   `npm run dev`
6. Open `http://localhost:3000`.

Pochi payments are completed by the payer in M-PESA. This app does not send an STK prompt or receive automatic payment callbacks. A treasurer must verify the amount and receipt in the recipient Pochi account before recording a payment. For automatic STK Push, use an eligible Daraja-approved PayBill or Till integration instead.

Chama data and registered accounts are stored in `database/akiba.sqlite`. Accounts use salted password hashes and HTTP-only session cookies; passwords are never stored as plain text in the database. The dashboard API requires a valid session. On its first authenticated run, the app initializes the database with the existing sample members, loans, and transactions. Subsequent changes are saved in SQLite. Accounts on the same local installation share the chama records; sign-up creates another operator account, not a separate chama. Keep a backup of the database file; it is excluded from Git. To use a different local database file, set `DATABASE_PATH` before starting the server.

Run the app with Node.js 22.13 or newer, which includes the built-in SQLite module. `npm run build` builds the frontend; use `npm start` to serve that production build with the same local database. Use `npm test` to run the database and app tests.

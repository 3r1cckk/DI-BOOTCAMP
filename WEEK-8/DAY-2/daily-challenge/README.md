# Week 8 Daily Challenge: React + Express

A React client that reads a greeting from an Express server and posts a message to it.

## Run locally

Open two terminals:

1. Start Express:

   ```powershell
   cd WEEK-8\DAY-2\daily-challenge\server
   npm install
   npm run dev
   ```

2. Start the React client:

   ```powershell
   cd WEEK-8\DAY-2\daily-challenge\client
   npm install
   npm run dev
   ```

Open the URL printed by Vite. The Vite development proxy forwards `/api` requests to Express on port `5000`.

The Express server can use a different port via the `PORT` environment variable; update the client proxy in `client/vite.config.js` to match.

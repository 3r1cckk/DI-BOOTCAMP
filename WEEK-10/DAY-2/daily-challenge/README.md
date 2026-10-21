# The Recipe Drawer — Generic Data Fetcher

A React, TypeScript, and Redux Toolkit example that searches the Spoonacular
Recipe - Food - Nutrition API. The reusable `DataFetcher<T>` component handles
loading, errors, empty results, and typed rendering while Redux owns the shared
request state.

## Run locally

```powershell
cd WEEK-10\DAY-2\daily-challenge
npm install
npm run dev
```

Open the local address printed by Vite. Enter a RapidAPI key for the
Spoonacular API in the form, choose a search term, and search. Keys entered in
the form are held in the page's memory only; they are not written to
`localStorage` or committed to this project. The optional `.env.example`
documents a development-only alternative; copy it to `.env.local` to provide
`VITE_RAPIDAPI_KEY` locally, and never commit a real key.

## Project structure

- `src/api/api.ts` — generic JSON request helper and Spoonacular API client
- `src/types/types.ts` — API, request, and Redux state types
- `src/features/dataSlice.ts` — async request lifecycle in Redux Toolkit
- `src/components/DataFetcher.tsx` — generic, reusable data display component
- `src/App.tsx` — recipe search page and typed recipe detail dialog
- `src/main.tsx` — Redux store provider and application entry point

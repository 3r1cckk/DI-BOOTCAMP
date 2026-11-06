# ShambaSmart

A lightweight, browser-based starter for practical farm tools and information.

## Run locally

From this directory, start a local server:

```bash
npm start
```

Then open [http://localhost:5173](http://localhost:5173).

The app uses browser ES modules and does not require a build step or npm dependencies. Sample weather, prices, and farm records are illustrative; connect a data provider or persistence layer before relying on them.

## Project structure

- `public/` — static assets such as the favicon.
- `src/components/` — reusable interface components.
- `src/pages/` — page views for the farm workspace.
- `src/styles/` — shared application styles.
- `src/main.js` — navigation and app entry point.

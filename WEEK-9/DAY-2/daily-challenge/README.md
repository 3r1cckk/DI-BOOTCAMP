# Daybook — Daily planner

A React and Redux planner for organizing tasks by date. Tasks persist in the browser's local storage.

## Run locally

```sh
npm install
npm run dev
```

## Redux structure

- `src/actions.ts` contains add, edit, delete, and completion actions.
- `src/reducer.ts` stores tasks by local calendar date and updates them immutably.
- `src/store.ts` configures the Redux store and browser persistence.
- The planner UI connects to Redux with React Redux's `connect`.

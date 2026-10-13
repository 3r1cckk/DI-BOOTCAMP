# Daily — Todo list

A React todo list that keeps its task state in a Redux store.

## Run locally

```sh
npm install
npm run dev
```

## Redux structure

- `src/actions.ts` defines add, toggle, and remove action creators.
- `src/reducer.ts` updates todo state immutably.
- `src/store.ts` creates the Redux store.
- `src/App.tsx` connects the UI to Redux with `connect` from React Redux.

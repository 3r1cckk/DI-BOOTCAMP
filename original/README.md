# Gather — Recipe Book

A small recipe book built with TypeScript and Vite. Add recipes with
ingredients and instructions, mark favorites, expand recipe details, and remove
individual recipes or clear the collection.

Recipes are saved in this browser's `localStorage` and stay on this device.

## Run locally

```sh
npm install
npm run dev
```

Run the production type check and build with `npm run build`, or lint the
TypeScript source with `npm run lint`.

## Project structure

- `src/model/RecipeItem.ts` — individual recipe data and favorite state
- `src/model/RecipeCollection.ts` — collection operations and local storage
- `src/templates/RecipeTemplate.ts` — recipe card rendering and interactions
- `src/main.ts` — form handling and app startup

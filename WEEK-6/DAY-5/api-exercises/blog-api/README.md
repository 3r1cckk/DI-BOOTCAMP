# Blog API

Express REST API with PostgreSQL persistence through Knex.

## Setup

1. Create a PostgreSQL database (the default is `postgres`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your database connection string.
3. Run `npm install`.
4. Run `npm run migrate` to create the `posts` table.
5. Run `npm start` to start the API on port 3000.

## Routes

- `GET /posts` lists posts.
- `GET /posts/:id` returns one post.
- `POST /posts` creates a post with `title` and `content`.
- `PUT /posts/:id` updates a post with `title` and `content`.
- `DELETE /posts/:id` deletes a post.
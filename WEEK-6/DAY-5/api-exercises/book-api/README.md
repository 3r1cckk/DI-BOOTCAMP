# Book API

Express CRUD API with PostgreSQL persistence through Knex.

## Setup

1. Create a PostgreSQL database (the default is `postgres`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your database connection string.
3. Run `npm install`.
4. Run `npm run migrate` to create the `books` table.
5. Run `npm start` to start the API on port 5000.

## Routes

- `GET /api/books` lists books.
- `GET /api/books/:bookId` returns one book.
- `POST /api/books` creates a book with `title`, `author`, and `publishedYear`.
- `PUT /api/books/:bookId` updates a book with those fields.
- `DELETE /api/books/:bookId` deletes a book.
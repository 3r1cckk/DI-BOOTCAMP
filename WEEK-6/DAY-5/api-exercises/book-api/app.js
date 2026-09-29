const express = require('express');

const app = express();
const port = 5000;
let nextBookId = 4;
const books = [
  { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', publishedYear: 1937 },
  { id: 2, title: 'Kindred', author: 'Octavia E. Butler', publishedYear: 1979 },
  { id: 3, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', publishedYear: 1969 }
];

app.use(express.json());

function isValidBook({ title, author, publishedYear }) {
  return typeof title === 'string' && title.trim()
    && typeof author === 'string' && author.trim()
    && Number.isInteger(publishedYear);
}

app.get('/api/books', (req, res) => {
  res.json(books);
});

app.get('/api/books/:bookId', (req, res) => {
  const book = books.find((item) => item.id === Number(req.params.bookId));
  if (!book) return res.status(404).json({ error: 'Book not found' });

  res.json(book);
});

app.post('/api/books', (req, res) => {
  if (!isValidBook(req.body || {})) {
    return res.status(400).json({ error: 'Title, author, and an integer publishedYear are required' });
  }

  const book = {
    id: nextBookId++,
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    publishedYear: req.body.publishedYear
  };
  books.push(book);
  res.status(201).json(book);
});

app.put('/api/books/:bookId', (req, res) => {
  const book = books.find((item) => item.id === Number(req.params.bookId));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (!isValidBook(req.body || {})) {
    return res.status(400).json({ error: 'Title, author, and an integer publishedYear are required' });
  }

  book.title = req.body.title.trim();
  book.author = req.body.author.trim();
  book.publishedYear = req.body.publishedYear;
  res.json(book);
});

app.delete('/api/books/:bookId', (req, res) => {
  const bookIndex = books.findIndex((item) => item.id === Number(req.params.bookId));
  if (bookIndex === -1) return res.status(404).json({ error: 'Book not found' });

  books.splice(bookIndex, 1);
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  const status = error.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'Invalid JSON request body' : 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Book API listening at http://localhost:${port}`);
});
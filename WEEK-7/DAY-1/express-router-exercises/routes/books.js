const express = require('express');

const router = express.Router();
const books = [];
let nextBookId = 1;

router.get('/', (req, res) => {
  res.json(books);
});

router.post('/', (req, res) => {
  const { title, author } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof author !== 'string' || !author.trim()) {
    return res.status(400).json({ error: 'A non-empty title and author are required' });
  }

  const book = { id: nextBookId++, title: title.trim(), author: author.trim() };
  books.push(book);
  res.status(201).json(book);
});

router.put('/:id', (req, res) => {
  const book = books.find((item) => item.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const { title, author } = req.body || {};
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }
  if (author !== undefined && (typeof author !== 'string' || !author.trim())) {
    return res.status(400).json({ error: 'Author must be a non-empty string' });
  }

  if (title !== undefined) book.title = title.trim();
  if (author !== undefined) book.author = author.trim();
  res.json(book);
});

router.delete('/:id', (req, res) => {
  const bookIndex = books.findIndex((item) => item.id === Number(req.params.id));
  if (bookIndex === -1) return res.status(404).json({ error: 'Book not found' });

  books.splice(bookIndex, 1);
  res.status(204).end();
});

module.exports = router;
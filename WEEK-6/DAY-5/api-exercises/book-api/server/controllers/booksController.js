const books = require('../models/bookModel');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateBook(body) {
  const { title, author, publishedYear } = body || {};
  if (typeof title !== 'string' || !title.trim()
    || typeof author !== 'string' || !author.trim()
    || !Number.isInteger(publishedYear)) {
    return null;
  }

  return { title: title.trim(), author: author.trim(), publishedYear };
}

async function getAll(req, res, next) {
  try {
    res.json(await books.getAll());
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  const id = parseId(req.params.bookId);
  if (!id) return res.status(400).json({ error: 'Book id must be a positive integer' });

  try {
    const book = await books.getById(id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  const book = validateBook(req.body);
  if (!book) return res.status(400).json({ error: 'Title, author, and an integer publishedYear are required' });

  try {
    res.status(201).json(await books.create(book));
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  const id = parseId(req.params.bookId);
  if (!id) return res.status(400).json({ error: 'Book id must be a positive integer' });

  const bookData = validateBook(req.body);
  if (!bookData) return res.status(400).json({ error: 'Title, author, and an integer publishedYear are required' });

  try {
    const book = await books.update(id, bookData);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  const id = parseId(req.params.bookId);
  if (!id) return res.status(400).json({ error: 'Book id must be a positive integer' });

  try {
    const deleted = await books.remove(id);
    if (!deleted) return res.status(404).json({ error: 'Book not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
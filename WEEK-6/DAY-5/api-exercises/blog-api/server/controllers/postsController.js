const posts = require('../models/postModel');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getAll(req, res, next) {
  try {
    res.json(await posts.getAll());
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Post id must be a positive integer' });

  try {
    const post = await posts.getById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  const { title, content } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    res.status(201).json(await posts.create({ title: title.trim(), content: content.trim() }));
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Post id must be a positive integer' });

  const { title, content } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const post = await posts.update(id, { title: title.trim(), content: content.trim() });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Post id must be a positive integer' });

  try {
    const deleted = await posts.remove(id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
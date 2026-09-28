const express = require('express');

const router = express.Router();
const todos = [];
let nextTodoId = 1;

router.get('/', (req, res) => {
  res.json(todos);
});

router.post('/', (req, res) => {
  const { title } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'A non-empty title is required' });
  }

  const todo = { id: nextTodoId++, title: title.trim(), completed: false };
  todos.push(todo);
  res.status(201).json(todo);
});

router.put('/:id', (req, res) => {
  const todo = todos.find((item) => item.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'To-do item not found' });

  const { title, completed } = req.body || {};
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed must be a boolean' });
  }

  if (title !== undefined) todo.title = title.trim();
  if (completed !== undefined) todo.completed = completed;
  res.json(todo);
});

router.delete('/:id', (req, res) => {
  const todoIndex = todos.findIndex((item) => item.id === Number(req.params.id));
  if (todoIndex === -1) return res.status(404).json({ error: 'To-do item not found' });

  todos.splice(todoIndex, 1);
  res.status(204).end();
});

module.exports = router;
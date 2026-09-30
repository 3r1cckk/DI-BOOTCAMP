const { randomUUID } = require('node:crypto');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const express = require('express');

const router = express.Router();
const tasksFile = path.join(__dirname, '..', 'tasks.json');
const editableFields = ['title', 'description', 'completed'];

async function readTasks() {
  const contents = await readFile(tasksFile, 'utf8');
  const tasks = JSON.parse(contents);

  if (!Array.isArray(tasks)) {
    throw new Error('Task storage must contain a JSON array.');
  }

  return tasks;
}

async function writeTasks(tasks) {
  await writeFile(tasksFile, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasInvalidTaskFields(body) {
  return editableFields.some((field) => {
    if (!(field in body)) return false;
    if (field === 'title') return !isNonEmptyString(body.title);
    if (field === 'description') return typeof body.description !== 'string';
    return typeof body.completed !== 'boolean';
  });
}

router.get('/', async (request, response, next) => {
  try {
    return response.json(await readTasks());
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  try {
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === request.params.id);

    if (!task) return response.status(404).json({ error: 'Task not found.' });
    return response.json(task);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (request, response, next) => {
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  if (!isNonEmptyString(body.title)) {
    return response.status(400).json({ error: 'A non-empty title is required.' });
  }
  if (hasInvalidTaskFields(body)) {
    return response.status(400).json({ error: 'Task fields have invalid values.' });
  }

  try {
    const tasks = await readTasks();
    const task = {
      id: randomUUID(),
      title: body.title.trim(),
      description: body.description ?? '',
      completed: body.completed ?? false,
    };

    tasks.push(task);
    await writeTasks(tasks);
    return response.status(201).json(task);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  const body = request.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  if (!editableFields.some((field) => field in body)) {
    return response.status(400).json({ error: 'Provide at least one task field to update.' });
  }
  if (hasInvalidTaskFields(body)) {
    return response.status(400).json({ error: 'Task fields have invalid values.' });
  }

  try {
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === request.params.id);

    if (!task) return response.status(404).json({ error: 'Task not found.' });

    for (const field of editableFields) {
      if (field in body) task[field] = field === 'title' ? body[field].trim() : body[field];
    }

    await writeTasks(tasks);
    return response.json(task);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((item) => item.id === request.params.id);

    if (taskIndex === -1) return response.status(404).json({ error: 'Task not found.' });

    tasks.splice(taskIndex, 1);
    await writeTasks(tasks);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
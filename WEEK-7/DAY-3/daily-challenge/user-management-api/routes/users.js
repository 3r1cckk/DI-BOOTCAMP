const { randomUUID } = require('node:crypto');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcrypt');
const express = require('express');

const router = express.Router();
const usersFile = path.join(__dirname, '..', 'users.json');
const saltRounds = 12;
const editableFields = ['name', 'lastName', 'email', 'username', 'password'];

async function readUsers() {
  const users = JSON.parse(await readFile(usersFile, 'utf8'));
  if (!Array.isArray(users)) throw new Error('User storage must contain a JSON array.');
  return users;
}

async function writeUsers(users) {
  await writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function isObjectBody(body) {
  return body !== null && typeof body === 'object' && !Array.isArray(body);
}

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalidProfileFields(body) {
  return ['name', 'lastName', 'username'].some((field) => field in body && !validString(body[field]))
    || ('email' in body && !validEmail(body.email));
}

async function passwordIsInUse(users, password, excludedUserId) {
  for (const user of users) {
    if (user.id !== excludedUserId && await bcrypt.compare(password, user.passwordHash)) return true;
  }
  return false;
}

router.post('/register', async (request, response, next) => {
  const body = request.body;
  if (!isObjectBody(body)) {
    return response.status(400).json({ message: 'Provide all required registration fields.' });
  }
  if (['name', 'lastName', 'username'].some((field) => !validString(body[field]))
      || !validEmail(body.email)
      || typeof body.password !== 'string'
      || body.password.length < 8) {
    return response.status(400).json({ message: 'Enter a name, last name, valid email, username, and password of at least 8 characters.' });
  }

  try {
    const users = await readUsers();
    const usernameExists = users.some((user) => user.username.toLowerCase() === body.username.trim().toLowerCase());
    const passwordExists = await passwordIsInUse(users, body.password);
    if (usernameExists || passwordExists) {
      return response.status(409).json({ message: 'Username or password already exists.' });
    }

    const user = {
      id: randomUUID(),
      name: body.name.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      username: body.username.trim(),
      passwordHash: await bcrypt.hash(body.password, saltRounds),
    };

    users.push(user);
    await writeUsers(users);
    return response.status(201).json({ message: 'Registration successful.', user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (request, response, next) => {
  const { username, password } = request.body || {};
  if (!validString(username) || typeof password !== 'string' || password.length === 0) {
    return response.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const users = await readUsers();
    const user = users.find((item) => item.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return response.status(401).json({ message: 'Username or password is incorrect.' });
    }

    return response.json({ message: `Welcome, ${user.name}!`, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/users', async (request, response, next) => {
  try {
    return response.json((await readUsers()).map(publicUser));
  } catch (error) {
    return next(error);
  }
});

router.get('/users/:id', async (request, response, next) => {
  try {
    const user = (await readUsers()).find((item) => item.id === request.params.id);
    if (!user) return response.status(404).json({ message: 'User not found.' });
    return response.json(publicUser(user));
  } catch (error) {
    return next(error);
  }
});

router.put('/users/:id', async (request, response, next) => {
  const body = request.body;
  if (!isObjectBody(body) || !editableFields.some((field) => field in body)) {
    return response.status(400).json({ message: 'Provide at least one valid user field to update.' });
  }
  if (invalidProfileFields(body) || ('password' in body && (typeof body.password !== 'string' || body.password.length < 8))) {
    return response.status(400).json({ message: 'One or more user fields are invalid.' });
  }

  try {
    const users = await readUsers();
    const user = users.find((item) => item.id === request.params.id);
    if (!user) return response.status(404).json({ message: 'User not found.' });

    if ('username' in body && users.some((item) => item.id !== user.id
        && item.username.toLowerCase() === body.username.trim().toLowerCase())) {
      return response.status(409).json({ message: 'Username already exists.' });
    }
    if ('password' in body && await passwordIsInUse(users, body.password, user.id)) {
      return response.status(409).json({ message: 'Password already exists.' });
    }

    for (const field of ['name', 'lastName', 'email', 'username']) {
      if (field in body) user[field] = field === 'email' ? body[field].trim().toLowerCase() : body[field].trim();
    }
    if ('password' in body) user.passwordHash = await bcrypt.hash(body.password, saltRounds);

    await writeUsers(users);
    return response.json({ message: 'User updated successfully.', user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
import express from 'express';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import {
  createSession,
  createUser,
  deleteSession,
  getSessionUser,
  getUserByEmail,
} from './database.js';

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const cookieName = 'akiba_session';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readSessionToken(request) {
  const cookieHeader = request.headers.cookie ?? '';
  const sessionCookie = cookieHeader.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  return sessionCookie?.slice(cookieName.length + 1) || null;
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionLifetimeMs / 1000)}${secure}`,
  );
}

function clearSessionCookie(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  );
}

async function passwordHash(password, salt) {
  return (await scrypt(password, salt, 64)).toString('hex');
}

async function startSession(db, user, response) {
  const token = randomBytes(32).toString('base64url');
  createSession(db, {
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: Date.now() + sessionLifetimeMs,
  });
  setSessionCookie(response, token);
  return { id: user.id, email: user.email };
}

export function createAuthRouter(db) {
  const router = express.Router();
  router.use(express.json({ limit: '10kb' }));

  router.get('/me', (request, response) => {
    const token = readSessionToken(request);
    const user = token ? getSessionUser(db, hashToken(token)) : null;
    response.json({ user: user ?? null });
  });

  router.post('/signup', async (request, response, next) => {
    try {
      const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
      const password = typeof request.body?.password === 'string' ? request.body.password : '';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        response.status(400).json({ error: 'Enter a valid email address.' });
        return;
      }
      if (password.length < 10 || password.length > 128) {
        response.status(400).json({ error: 'Password must be between 10 and 128 characters.' });
        return;
      }

      const salt = randomBytes(16).toString('hex');
      const user = { id: randomUUID(), email };
      createUser(db, {
        ...user,
        passwordSalt: salt,
        passwordHash: await passwordHash(password, salt),
      });

      response.status(201).json({ user: await startSession(db, user, response) });
    } catch (error) {
      if (error?.errcode === 2067) {
        response.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
        return;
      }
      next(error);
    }
  });

  router.post('/login', async (request, response, next) => {
    try {
      const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
      const password = typeof request.body?.password === 'string' ? request.body.password : '';
      const user = getUserByEmail(db, email);

      if (!user || password.length > 128) {
        response.status(401).json({ error: 'Email or password is incorrect.' });
        return;
      }

      const submittedHash = Buffer.from(await passwordHash(password, user.passwordSalt), 'hex');
      const storedHash = Buffer.from(user.passwordHash, 'hex');
      if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
        response.status(401).json({ error: 'Email or password is incorrect.' });
        return;
      }

      response.json({ user: await startSession(db, user, response) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (request, response) => {
    const token = readSessionToken(request);
    if (token) deleteSession(db, hashToken(token));
    clearSessionCookie(response);
    response.json({ signedOut: true });
  });

  return router;
}

export function requireAuth(db) {
  return (request, response, next) => {
    const token = readSessionToken(request);
    const user = token ? getSessionUser(db, hashToken(token)) : null;
    if (!user) {
      response.status(401).json({ error: 'Sign in to access the chama dashboard.' });
      return;
    }

    request.user = { id: user.id, email: user.email };
    next();
  };
}

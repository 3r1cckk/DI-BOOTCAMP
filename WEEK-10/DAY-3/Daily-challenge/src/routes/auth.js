import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { database } from '../database.js'
import {
  ACCESS_TOKEN_SECONDS,
  createTokenPair,
  hashToken,
  REFRESH_TOKEN_SECONDS,
  verifyRefreshToken,
} from '../tokens.js'

export const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a little and try again.' },
})

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Please wait and try again.' },
})

const findUserById = database.prepare(
  'SELECT id, username, email, password_hash FROM users WHERE id = ?',
)
const findUserByLogin = database.prepare(
  'SELECT id, username, email, password_hash FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE',
)
const insertUser = database.prepare(
  'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
)
const insertRefreshToken = database.prepare(
  'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
)
const findRefreshToken = database.prepare(
  'SELECT id, user_id, token_hash, expires_at, revoked_at FROM refresh_tokens WHERE id = ? AND user_id = ?',
)
const revokeRefreshToken = database.prepare(
  'UPDATE refresh_tokens SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
)

authRouter.post('/register', authLimiter, async (req, res, next) => {
  try {
    const username = normalizeUsername(req.body?.username)
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password

    if (!isValidUsername(username)) {
      res.status(400).json({
        error: 'Choose a username with 3–24 letters, numbers, or underscores.',
      })
      return
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' })
      return
    }
    if (!isValidPassword(password)) {
      res.status(400).json({
        error: 'Use a password with at least 12 characters, including a letter and a number.',
      })
      return
    }

    const user = {
      id: randomUUID(),
      username,
      email,
    }
    const passwordHash = await bcrypt.hash(password, 12)

    try {
      insertUser.run(user.id, user.username, user.email, passwordHash)
    } catch (error) {
      if (isUniqueConstraint(error)) {
        res.status(409).json({ error: 'That username or email is already registered.' })
        return
      }
      throw error
    }

    issueSession(res, user)
    res.status(201).json({ user })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const login = normalizeLogin(req.body?.login)
    const password = req.body?.password
    if (!login || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Enter your username or email and password.' })
      return
    }

    const user = findUserByLogin.get(login, login)
    const passwordMatches =
      user && typeof user.password_hash === 'string'
        ? await bcrypt.compare(password, user.password_hash)
        : false

    if (!user || !passwordMatches) {
      res.status(401).json({ error: 'That username/email and password do not match.' })
      return
    }

    const publicUser = { id: user.id, username: user.username, email: user.email }
    issueSession(res, publicUser)
    res.json({ user: publicUser })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/refresh', refreshLimiter, (req, res, next) => {
  const token = req.cookies?.refreshToken
  if (typeof token !== 'string') {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
    return
  }

  try {
    const claims = verifyRefreshToken(token)
    const storedToken = findRefreshToken.get(claims.tokenId, claims.userId)
    const now = Math.floor(Date.now() / 1000)

    if (
      !storedToken ||
      storedToken.revoked_at !== null ||
      storedToken.expires_at <= now ||
      storedToken.token_hash !== hashToken(token)
    ) {
      clearSessionCookies(res)
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
      return
    }

    const user = findUserById.get(claims.userId)
    if (!user) {
      revokeRefreshToken.run(now, claims.tokenId, claims.userId)
      clearSessionCookies(res)
      res.status(401).json({ error: 'This account is no longer available. Please sign in again.' })
      return
    }

    database.exec('BEGIN IMMEDIATE')
    try {
      const revoked = revokeRefreshToken.run(now, claims.tokenId, claims.userId)
      if (Number(revoked.changes) !== 1) {
        database.exec('ROLLBACK')
        clearSessionCookies(res)
        res.status(401).json({ error: 'This session has already been refreshed. Please sign in again.' })
        return
      }
      issueSession(res, { id: user.id, username: user.username, email: user.email })
      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }

    res.json({ message: 'Your session has been refreshed.' })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      clearSessionCookies(res)
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
      return
    }
    next(error)
  }
})

authRouter.post('/logout', (req, res, next) => {
  const token = req.cookies?.refreshToken
  try {
    if (typeof token === 'string') {
      const claims = verifyRefreshToken(token)
      revokeRefreshToken.run(
        Math.floor(Date.now() / 1000),
        claims.tokenId,
        claims.userId,
      )
    }
    clearSessionCookies(res)
    res.json({ message: 'You are signed out.' })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      clearSessionCookies(res)
      res.json({ message: 'You are signed out.' })
      return
    }
    next(error)
  }
})

function issueSession(res, user) {
  const tokens = createTokenPair(user)
  insertRefreshToken.run(
    tokens.refreshId,
    user.id,
    hashToken(tokens.refreshToken),
    tokens.refreshExpiresAt,
  )

  res.cookie('accessToken', tokens.accessToken, cookieOptions(ACCESS_TOKEN_SECONDS, '/'))
  res.cookie(
    'refreshToken',
    tokens.refreshToken,
    cookieOptions(REFRESH_TOKEN_SECONDS, '/api/auth'),
  )
}

function cookieOptions(maxAgeSeconds, path) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path,
    maxAge: maxAgeSeconds * 1000,
  }
}

function clearSessionCookies(res) {
  res.clearCookie('accessToken', cookieOptions(0, '/'))
  res.clearCookie('refreshToken', cookieOptions(0, '/api/auth'))
}

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeLogin(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(value)
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 12 &&
    value.length <= 128 &&
    /[a-zA-Z]/.test(value) &&
    /\d/.test(value)
  )
}

function isUniqueConstraint(error) {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed')
}

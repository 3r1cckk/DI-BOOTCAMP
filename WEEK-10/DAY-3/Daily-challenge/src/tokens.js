import { createHash, randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'

const ISSUER = 'jwt-auth-guide'
const AUDIENCE = 'jwt-auth-guide-client'
export const ACCESS_TOKEN_SECONDS = 15 * 60
export const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60

function getSecret(name) {
  const secret = process.env[name]
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters.`)
  }
  return secret
}

export function createTokenPair(user) {
  const accessToken = jwt.sign(
    { username: user.username, type: 'access' },
    getSecret('ACCESS_TOKEN_SECRET'),
    {
      algorithm: 'HS256',
      subject: user.id,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: ACCESS_TOKEN_SECONDS,
    },
  )

  const refreshId = randomUUID()
  const refreshToken = jwt.sign(
    { type: 'refresh' },
    getSecret('REFRESH_TOKEN_SECRET'),
    {
      algorithm: 'HS256',
      subject: user.id,
      jwtid: refreshId,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: REFRESH_TOKEN_SECONDS,
    },
  )

  return {
    accessToken,
    refreshToken,
    refreshId,
    refreshExpiresAt: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_SECONDS,
  }
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, getSecret('ACCESS_TOKEN_SECRET'), {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  })

  if (
    typeof payload === 'string' ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string' ||
    typeof payload.username !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid access token payload.')
  }

  return { id: payload.sub, username: payload.username }
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, getSecret('REFRESH_TOKEN_SECRET'), {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  })

  if (
    typeof payload === 'string' ||
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.jti !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid refresh token payload.')
  }

  return { userId: payload.sub, tokenId: payload.jti }
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

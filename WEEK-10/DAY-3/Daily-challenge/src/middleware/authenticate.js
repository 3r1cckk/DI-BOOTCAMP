import { verifyAccessToken } from '../tokens.js'

export function authenticate(req, res, next) {
  const cookieToken = req.cookies?.accessToken
  const authorization = req.get('authorization')
  const bearerToken =
    authorization?.startsWith('Bearer ') === true
      ? authorization.slice('Bearer '.length)
      : undefined
  const token = cookieToken || bearerToken

  if (!token) {
    res.status(401).json({ error: 'Sign in to view this page.' })
    return
  }

  try {
    req.auth = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}

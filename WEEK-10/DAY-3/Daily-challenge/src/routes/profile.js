import { Router } from 'express'
import { database } from '../database.js'
import { authenticate } from '../middleware/authenticate.js'

export const profileRouter = Router()

const findProfile = database.prepare(
  'SELECT id, username, email, created_at FROM users WHERE id = ?',
)
const updateUsername = database.prepare(
  'UPDATE users SET username = ? WHERE id = ?',
)

profileRouter.use(authenticate)

profileRouter.get('/', (req, res) => {
  const user = findProfile.get(req.auth.id)
  if (!user) {
    res.status(404).json({ error: 'This account could not be found.' })
    return
  }
  res.json({ user })
})

profileRouter.patch('/', (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    res.status(400).json({ error: 'Choose a username with 3–24 letters, numbers, or underscores.' })
    return
  }

  try {
    updateUsername.run(username, req.auth.id)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'That username is already taken.' })
      return
    }
    throw error
  }

  const user = findProfile.get(req.auth.id)
  res.json({ user })
})

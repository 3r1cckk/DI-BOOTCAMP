import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { profileRouter } from './routes/profile.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const publicDirectory = resolve(currentDirectory, '../public')

export const app = express()
app.disable('x-powered-by')
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  }),
)
app.use(express.json({ limit: '10kb', strict: true }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use(express.static(publicDirectory, { index: 'index.html', maxAge: '1h' }))

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'That API endpoint does not exist.' })
})

app.use((error, _req, res, _next) => {
  if (res.headersSent) return

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Please send valid JSON.' })
    return
  }

  console.error('Request failed:', error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

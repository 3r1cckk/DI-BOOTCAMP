import { app } from './app.js'

function validateSecrets() {
  for (const name of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
    const secret = process.env[name]
    if (!secret || secret.length < 32) {
      throw new Error(
        `${name} is required and must be at least 32 characters. Copy .env.example and set unique secrets.`,
      )
    }
  }

  if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('Use different values for ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET.')
  }
}

validateSecrets()

const port = Number.parseInt(process.env.PORT ?? '3000', 10)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port number.')
}

app.listen(port, () => {
  console.log(`JWT authentication guide listening at http://localhost:${port}`)
})

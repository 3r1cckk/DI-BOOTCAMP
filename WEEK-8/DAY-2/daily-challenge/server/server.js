import express from 'express'

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(express.json())

app.get('/api/hello', (_request, response) => {
  response.send('Hello From Express')
})

app.post('/api/world', (request, response) => {
  const { message } = request.body ?? {}

  console.log(request.body)

  if (typeof message !== 'string') {
    return response.status(400).json({ error: 'A string message is required.' })
  }

  response.send(
    `I received your POST request. This is what you sent me: ${message}`,
  )
})

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`)
})

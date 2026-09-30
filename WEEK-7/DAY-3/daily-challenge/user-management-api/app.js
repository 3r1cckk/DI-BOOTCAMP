const path = require('node:path');
const express = require('express');
const userRouter = require('./routes/users');

const app = express();
const port = process.env.PORT || 3001;
const publicDirectory = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicDirectory));
app.use(userRouter);

app.get('/', (request, response) => {
  response.sendFile(path.join(publicDirectory, 'login.html'));
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ message: 'Request body must contain valid JSON.' });
  }

  console.error(error);
  return response.status(500).json({ message: 'An unexpected server error occurred.' });
});

app.listen(port, () => {
  console.log(`User API listening on http://localhost:${port}`);
});
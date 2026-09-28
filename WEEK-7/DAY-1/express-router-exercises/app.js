const express = require('express');
const indexRouter = require('./routes');
const todosRouter = require('./routes/todos');
const booksRouter = require('./routes/books');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/', indexRouter);
app.use('/todos', todosRouter);
app.use('/books', booksRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  const status = error.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'Invalid JSON request body' : 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Express Router app listening at http://localhost:${port}`);
});
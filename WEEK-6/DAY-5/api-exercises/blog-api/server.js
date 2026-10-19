const express = require('express');
const postsRoutes = require('./server/routes/postsRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/posts', postsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'Invalid JSON request body' : 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Blog API listening at http://localhost:${port}`);
  });
}

module.exports = app;
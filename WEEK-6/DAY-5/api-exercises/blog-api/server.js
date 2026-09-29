const express = require('express');

const app = express();
const port = 3000;
let nextPostId = 3;
const posts = [
  { id: 1, title: 'First post', content: 'Welcome to the blog.' },
  { id: 2, title: 'Express APIs', content: 'Building APIs with Express is straightforward.' }
];

app.use(express.json());

app.get('/posts', (req, res) => {
  res.json(posts);
});

app.get('/posts/:id', (req, res) => {
  const post = posts.find((item) => item.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  res.json(post);
});

app.post('/posts', (req, res) => {
  const { title, content } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const post = { id: nextPostId++, title: title.trim(), content: content.trim() };
  posts.push(post);
  res.status(201).json(post);
});

app.put('/posts/:id', (req, res) => {
  const post = posts.find((item) => item.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { title, content } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  post.title = title.trim();
  post.content = content.trim();
  res.json(post);
});

app.delete('/posts/:id', (req, res) => {
  const postIndex = posts.findIndex((item) => item.id === Number(req.params.id));
  if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

  posts.splice(postIndex, 1);
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  const status = error.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'Invalid JSON request body' : 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Blog API listening at http://localhost:${port}`);
});
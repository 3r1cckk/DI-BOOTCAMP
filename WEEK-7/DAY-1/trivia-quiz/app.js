const express = require('express');
const session = require('express-session');
const quizRouter = require('./routes/quiz');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'local-trivia-quiz-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  },
}));

app.use('/quiz', quizRouter);

app.use((req, res) => {
  res.status(404).type('text').send('Page not found');
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Trivia quiz listening at http://localhost:${port}/quiz`);
  });
}

module.exports = app;
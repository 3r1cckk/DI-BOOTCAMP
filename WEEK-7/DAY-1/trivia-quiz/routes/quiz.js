const express = require('express');
const triviaQuestions = require('../models/triviaQuestions');

const router = express.Router();

function getQuizState(req) {
  if (!req.session.quiz) {
    req.session.quiz = {
      currentQuestionIndex: 0,
      score: 0,
      feedback: null,
    };
  }

  return req.session.quiz;
}

function renderPage(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Trivia Quiz</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; background: #f3f5f2; color: #18231d; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    main { width: min(100%, 560px); box-sizing: border-box; padding: 32px; background: #fff; border: 1px solid #d9e1dc; border-top: 5px solid #147d64; border-radius: 8px; }
    h1 { margin: 0 0 8px; font-size: 1.7rem; }
    p { line-height: 1.55; }
    .progress { color: #53645b; font-size: .95rem; }
    label { display: block; margin: 24px 0 8px; font-weight: 650; }
    input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #99aaa0; border-radius: 4px; font: inherit; }
    button, a.button { display: inline-block; margin-top: 18px; padding: 11px 16px; border: 0; border-radius: 4px; background: #147d64; color: #fff; font: inherit; font-weight: 650; text-decoration: none; cursor: pointer; }
    .feedback { padding: 12px; border-left: 4px solid #147d64; background: #edf6f1; }
    .feedback.incorrect { border-color: #bd4d35; background: #fbf0ed; }
    @media (max-width: 480px) { main { padding: 24px 20px; } }
  </style>
</head>
<body><main>${content}</main></body>
</html>`;
}

function renderQuestion(quiz, feedback) {
  const question = triviaQuestions[quiz.currentQuestionIndex];
  const feedbackMarkup = feedback
    ? `<p class="feedback ${feedback.correct ? '' : 'incorrect'}" role="status">${feedback.message}</p>`
    : '';

  return renderPage('Question', `
    <p class="progress">Question ${quiz.currentQuestionIndex + 1} of ${triviaQuestions.length} · Score: ${quiz.score}</p>
    <h1>${question.question}</h1>
    ${feedbackMarkup}
    <form action="/quiz" method="post">
      <label for="answer">Your answer</label>
      <input id="answer" name="answer" type="text" autocomplete="off" required autofocus>
      <button type="submit">Submit answer</button>
    </form>
  `);
}

router.get('/', (req, res) => {
  const quiz = getQuizState(req);

  if (quiz.currentQuestionIndex >= triviaQuestions.length) {
    return res.type('html').send(renderPage('Quiz complete', `
      <h1>Quiz complete</h1>
      <p>Your score is ${quiz.score} out of ${triviaQuestions.length}.</p>
      <a class="button" href="/quiz/score">View final score</a>
    `));
  }

  const feedback = quiz.feedback;
  quiz.feedback = null;
  res.type('html').send(renderQuestion(quiz, feedback));
});

router.post('/', (req, res) => {
  const quiz = getQuizState(req);

  if (quiz.currentQuestionIndex >= triviaQuestions.length) {
    return res.redirect('/quiz/score');
  }

  const submittedAnswer = typeof req.body.answer === 'string' ? req.body.answer.trim() : '';
  if (!submittedAnswer) {
    quiz.feedback = { correct: false, message: 'Enter an answer before continuing.' };
    return res.redirect('/quiz');
  }

  const question = triviaQuestions[quiz.currentQuestionIndex];
  const normalize = (answer) => answer.trim().replace(/\s+/g, ' ').toLowerCase();
  const isCorrect = normalize(submittedAnswer) === normalize(question.answer);

  if (isCorrect) {
    quiz.score += 1;
    quiz.feedback = { correct: true, message: 'Correct!' };
  } else {
    quiz.feedback = { correct: false, message: `Not quite. The correct answer is ${question.answer}.` };
  }

  quiz.currentQuestionIndex += 1;
  res.redirect(quiz.currentQuestionIndex === triviaQuestions.length ? '/quiz/score' : '/quiz');
});

router.get('/score', (req, res) => {
  const quiz = req.session.quiz;
  if (!quiz || quiz.currentQuestionIndex < triviaQuestions.length) {
    return res.redirect('/quiz');
  }

  const feedbackMarkup = quiz.feedback
    ? `<p class="feedback ${quiz.feedback.correct ? '' : 'incorrect'}" role="status">${quiz.feedback.message}</p>`
    : '';

  res.type('html').send(renderPage('Final score', `
    <h1>Final score</h1>
    ${feedbackMarkup}
    <p>You answered ${quiz.score} out of ${triviaQuestions.length} questions correctly.</p>
    <a class="button" href="/quiz">Review your result</a>
  `));
});

module.exports = router;
# Trivia Quiz

A small Express app that serves a three-question trivia quiz. Each browser session keeps its own question progress and score.

## Run

```powershell
npm install
npm start
```

Open [http://localhost:3001/quiz](http://localhost:3001/quiz). Set `PORT` to change the port or `SESSION_SECRET` to provide a session secret.

## Routes

- `GET /quiz` starts the quiz or displays the current question.
- `POST /quiz` accepts the form field `answer`, provides feedback, and advances to the next question.
- `GET /quiz/score` displays the final score after the last answer.

The default in-memory session store is suitable for this exercise, not production deployment.
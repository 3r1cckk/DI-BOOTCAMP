const express = require('express');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const app = express();
const port = process.env.PORT || 3000;
const optionCount = 4;

const emojis = [
  { emoji: '😀', name: 'Smile' },
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🌮', name: 'Taco' },
  { emoji: '🦋', name: 'Butterfly' },
  { emoji: '🍉', name: 'Watermelon' },
  { emoji: '🚀', name: 'Rocket' },
  { emoji: '🎸', name: 'Guitar' },
  { emoji: '🌈', name: 'Rainbow' },
  { emoji: '🐙', name: 'Octopus' },
  { emoji: '🍩', name: 'Doughnut' },
  { emoji: '🦉', name: 'Owl' },
  { emoji: '⚽', name: 'Soccer ball' },
  { emoji: '🍄', name: 'Mushroom' },
  { emoji: '🧊', name: 'Ice cube' },
  { emoji: '🦕', name: 'Dinosaur' },
  { emoji: '☂️', name: 'Umbrella' },
  { emoji: '🥑', name: 'Avocado' },
  { emoji: '🐢', name: 'Turtle' },
  { emoji: '🎈', name: 'Balloon' },
  { emoji: '🧁', name: 'Cupcake' }
];

const players = new Map();
const leaderboard = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function createRound() {
  const answerIndex = Math.floor(Math.random() * emojis.length);
  const answer = emojis[answerIndex];
  const distractors = emojis
    .filter((_, index) => index !== answerIndex)
    .sort(() => Math.random() - 0.5)
    .slice(0, optionCount - 1);

  return {
    id: randomUUID(),
    emoji: answer.emoji,
    answer: answer.name,
    options: [...distractors, answer].sort(() => Math.random() - 0.5).map(({ name }) => name)
  };
}

function publicRound(round) {
  return { id: round.id, emoji: round.emoji, options: round.options };
}

app.post('/api/start', (request, response) => {
  const name = typeof request.body.name === 'string' ? request.body.name.trim().slice(0, 20) : '';
  if (!name) {
    return response.status(400).json({ error: 'Enter a player name to start.' });
  }

  const playerId = randomUUID();
  const player = { name, score: 0, streak: 0, round: createRound() };
  players.set(playerId, player);

  return response.json({ playerId, name, score: player.score, streak: player.streak, round: publicRound(player.round) });
});

app.post('/api/guess', (request, response) => {
  const { playerId, roundId, answer } = request.body;
  const player = players.get(playerId);

  if (!player || player.round.id !== roundId) {
    return response.status(409).json({ error: 'That round has expired. Start a new game to keep playing.' });
  }
  if (typeof answer !== 'string' || !player.round.options.includes(answer)) {
    return response.status(400).json({ error: 'Choose one of the options shown.' });
  }

  const correct = answer === player.round.answer;
  if (correct) {
    player.score += 10;
    player.streak += 1;
  } else {
    player.streak = 0;
  }

  const leaderboardKey = player.name.toLowerCase();
  const previousEntry = leaderboard.get(leaderboardKey);
  if (!previousEntry || player.score > previousEntry.score) {
    leaderboard.set(leaderboardKey, { name: player.name, score: player.score });
  }

  const correctAnswer = player.round.answer;
  player.round = createRound();

  return response.json({
    correct,
    correctAnswer,
    score: player.score,
    streak: player.streak,
    round: publicRound(player.round)
  });
});

app.get('/api/leaderboard', (_request, response) => {
  const topScores = [...leaderboard.values()]
    .sort((first, second) => second.score - first.score || first.name.localeCompare(second.name))
    .slice(0, 5);
  response.json(topScores);
});

app.listen(port, () => {
  console.log(`Emoji Quiz is running at http://localhost:${port}`);
});
const startForm = document.querySelector('#start-form');
const guessForm = document.querySelector('#guess-form');
const nameInput = document.querySelector('#player-name');
const emojiDisplay = document.querySelector('#emoji-display');
const optionsList = document.querySelector('#options-list');
const feedback = document.querySelector('#feedback');
const submitButton = document.querySelector('#submit-button');
const scoreValue = document.querySelector('#score-value');
const playerLabel = document.querySelector('#player-label');
const roundLabel = document.querySelector('#round-label');
const streakChip = document.querySelector('#streak-chip');
const streakValue = document.querySelector('#streak-value');
const leaderboardList = document.querySelector('#leaderboard-list');

let playerId = null;
let currentRound = null;
let isSubmitting = false;

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

function displayRound(round) {
  currentRound = round;
  emojiDisplay.textContent = round.emoji;
  emojiDisplay.setAttribute('aria-label', `Mystery emoji ${round.emoji}`);
  emojiDisplay.style.animation = 'none';
  requestAnimationFrame(() => { emojiDisplay.style.animation = ''; });
  optionsList.replaceChildren();

  round.options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'option-card';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = option;
    input.required = true;
    input.id = `option-${index}`;
    const text = document.createElement('span');
    text.textContent = option;
    label.append(input, text);
    optionsList.append(label);
  });
}

async function refreshLeaderboard() {
  try {
    const scores = await requestJson('/api/leaderboard');
    leaderboardList.replaceChildren();
    if (scores.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-board';
      empty.textContent = 'Your name could go here.';
      leaderboardList.append(empty);
      return;
    }

    scores.forEach((entry, index) => {
      const row = document.createElement('li');
      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = String(index + 1).padStart(2, '0');
      const name = document.createElement('span');
      name.className = 'leader-name';
      name.textContent = entry.name;
      const score = document.createElement('span');
      score.className = 'leader-score';
      score.textContent = `${entry.score} PTS`;
      row.append(rank, name, score);
      leaderboardList.append(row);
    });
  } catch {
    leaderboardList.textContent = 'Leaderboard unavailable.';
  }
}

startForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const startButton = startForm.querySelector('button');
  startButton.disabled = true;
  startButton.textContent = 'Starting...';

  try {
    const data = await requestJson('/api/start', {
      method: 'POST',
      body: JSON.stringify({ name: nameInput.value })
    });
    playerId = data.playerId;
    scoreValue.textContent = String(data.score).padStart(2, '0');
    playerLabel.textContent = data.name.toUpperCase();
    displayRound(data.round);
    startForm.hidden = true;
    guessForm.hidden = false;
    roundLabel.textContent = 'ROUND 01';
    promptLabel.textContent = 'Pick the name that matches the emoji.';
    await refreshLeaderboard();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = 'feedback is-wrong';
  } finally {
    startButton.disabled = false;
    startButton.innerHTML = 'Let’s play <span aria-hidden="true">↗</span>';
  }
});

guessForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (isSubmitting) return;

  const selected = guessForm.querySelector('input[name="answer"]:checked');
  if (!selected) {
    feedback.textContent = 'Choose an answer first.';
    feedback.className = 'feedback is-wrong';
    return;
  }

  isSubmitting = true;
  submitButton.disabled = true;
  submitButton.innerHTML = 'Checking...';
  feedback.textContent = '';

  try {
    const result = await requestJson('/api/guess', {
      method: 'POST',
      body: JSON.stringify({ playerId, roundId: currentRound.id, answer: selected.value })
    });
    scoreValue.textContent = String(result.score).padStart(2, '0');
    streakValue.textContent = result.streak;
    streakChip.hidden = result.streak === 0;
    feedback.textContent = result.correct ? 'That’s right! You know your emojis.' : `Not quite. That was ${result.correctAnswer}.`;
    feedback.className = `feedback ${result.correct ? 'is-correct' : 'is-wrong'}`;
    roundLabel.textContent = `ROUND ${String(Number(roundLabel.textContent.replace('ROUND ', '')) + 1).padStart(2, '0')}`;
    displayRound(result.round);
    await refreshLeaderboard();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = 'feedback is-wrong';
  } finally {
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.innerHTML = 'Lock it in <span aria-hidden="true">↗</span>';
  }
});

refreshLeaderboard();
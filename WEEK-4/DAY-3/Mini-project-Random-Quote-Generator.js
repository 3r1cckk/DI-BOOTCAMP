const quotes = [
  {
    id: 0,
    author: 'Albert Einstein',
    quote: 'Life is like riding a bicycle. To keep your balance, you must keep moving.',
    likes: 0,
  },
  {
    id: 1,
    author: 'Maya Angelou',
    quote: 'You may not control all the events that happen to you, but you can decide not to be reduced by them.',
    likes: 0,
  },
  {
    id: 2,
    author: 'Steve Jobs',
    quote: 'Your time is limited, so don’t waste it living someone else’s life.',
    likes: 0,
  },
  {
    id: 3,
    author: 'Nelson Mandela',
    quote: 'It always seems impossible until it is done.',
    likes: 0,
  },
];

let lastDisplayedId = null;
let filteredQuotes = [];
let currentFilterIndex = 0;
let nextId = quotes.length;

const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const quoteLikes = document.getElementById('quote-likes');
const statsOutput = document.getElementById('stats-output');
const filterOutput = document.getElementById('filter-output');

function getCurrentActiveQuote() {
  if (filteredQuotes.length > 0) {
    return filteredQuotes[currentFilterIndex];
  }

  return quotes.find((quote) => quote.id === lastDisplayedId) || null;
}

function renderQuote(quote) {
  if (!quote) return;

  quoteText.textContent = `"${quote.quote}"`;
  quoteAuthor.textContent = `- ${quote.author}`;
  quoteLikes.textContent = `Likes: ${quote.likes}`;

  statsOutput.textContent = '';
}

function getRandomQuote() {
  if (quotes.length === 0) return null;

  if (quotes.length === 1) {
    lastDisplayedId = quotes[0].id;
    return quotes[0];
  }

  let randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  while (randomQuote.id === lastDisplayedId) {
    randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  }

  lastDisplayedId = randomQuote.id;
  filteredQuotes = [];
  currentFilterIndex = 0;
  return randomQuote;
}

function countCharactersWithSpaces(quoteTextValue) {
  return quoteTextValue.length;
}

function countCharactersWithoutSpaces(quoteTextValue) {
  return quoteTextValue.replace(/\s/g, '').length;
}

function countWords(quoteTextValue) {
  const cleanedText = quoteTextValue.trim();
  if (!cleanedText) return 0;
  return cleanedText.split(/\s+/).length;
}

function displayFilterResults() {
  if (filteredQuotes.length === 0) {
    filterOutput.textContent = 'No quotes found for this author.';
    return;
  }

  const currentQuote = filteredQuotes[currentFilterIndex];
  filterOutput.textContent = `Showing ${currentFilterIndex + 1} of ${filteredQuotes.length} quote(s) by ${currentQuote.author}`;
  renderQuote(currentQuote);
  lastDisplayedId = currentQuote.id;
}

document.getElementById('generate-quote').addEventListener('click', () => {
  const chosenQuote = getRandomQuote();
  if (chosenQuote) {
    renderQuote(chosenQuote);
  }
});

document.getElementById('add-quote-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const quoteInput = document.getElementById('new-quote');
  const authorInput = document.getElementById('new-author');

  const quoteValue = quoteInput.value.trim();
  const authorValue = authorInput.value.trim();

  if (!quoteValue || !authorValue) {
    alert('Please enter both a quote and an author.');
    return;
  }

  const newQuote = {
    id: nextId,
    author: authorValue,
    quote: quoteValue,
    likes: 0,
  };

  quotes.push(newQuote);
  nextId += 1;
  quoteInput.value = '';
  authorInput.value = '';
  renderQuote(newQuote);
  lastDisplayedId = newQuote.id;
  filteredQuotes = [];
  currentFilterIndex = 0;
});

document.getElementById('count-chars').addEventListener('click', () => {
  const activeQuote = getCurrentActiveQuote();
  if (!activeQuote) {
    statsOutput.textContent = 'No quote selected.';
    return;
  }

  statsOutput.textContent = `Characters (with spaces): ${countCharactersWithSpaces(activeQuote.quote)}`;
});

document.getElementById('count-no-spaces').addEventListener('click', () => {
  const activeQuote = getCurrentActiveQuote();
  if (!activeQuote) {
    statsOutput.textContent = 'No quote selected.';
    return;
  }

  statsOutput.textContent = `Characters (without spaces): ${countCharactersWithoutSpaces(activeQuote.quote)}`;
});

document.getElementById('count-words').addEventListener('click', () => {
  const activeQuote = getCurrentActiveQuote();
  if (!activeQuote) {
    statsOutput.textContent = 'No quote selected.';
    return;
  }

  statsOutput.textContent = `Words: ${countWords(activeQuote.quote)}`;
});

document.getElementById('like-quote').addEventListener('click', () => {
  const activeQuote = getCurrentActiveQuote();
  if (!activeQuote) {
    statsOutput.textContent = 'No quote selected.';
    return;
  }

  activeQuote.likes += 1;
  quoteLikes.textContent = `Likes: ${activeQuote.likes}`;
  statsOutput.textContent = `You liked this quote. Total likes: ${activeQuote.likes}`;
});

document.getElementById('filter-form').addEventListener('submit', (event) => {
  event.preventDefault();

  const authorFilterInput = document.getElementById('author-filter');
  const authorName = authorFilterInput.value.trim();

  if (!authorName) {
    filterOutput.textContent = 'Please enter an author name.';
    return;
  }

  filteredQuotes = quotes.filter(
    (quote) => quote.author.toLowerCase() === authorName.toLowerCase()
  );

  currentFilterIndex = 0;
  displayFilterResults();
});

document.getElementById('prev-quote').addEventListener('click', () => {
  if (filteredQuotes.length === 0) {
    filterOutput.textContent = 'Filter a quote first.';
    return;
  }

  currentFilterIndex = (currentFilterIndex - 1 + filteredQuotes.length) % filteredQuotes.length;
  displayFilterResults();
});

document.getElementById('next-quote').addEventListener('click', () => {
  if (filteredQuotes.length === 0) {
    filterOutput.textContent = 'Filter a quote first.';
    return;
  }

  currentFilterIndex = (currentFilterIndex + 1) % filteredQuotes.length;
  displayFilterResults();
});

renderQuote(quotes[0]);

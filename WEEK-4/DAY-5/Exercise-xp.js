// Exercise 1: Giphy API search
async function fetchHilariousGifs() {
  const url = 'https://api.giphy.com/v1/gifs/search?q=hilarious&rating=g&api_key=hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exercise 1 result:', data);
  } catch (error) {
    console.error('Error fetching hilarious gifs:', error);
  }
}

// Exercise 2: 10 gifs about "sun" starting from position 2
async function fetchSunGifs() {
  const url = 'https://api.giphy.com/v1/gifs/search?q=sun&limit=10&offset=2&rating=g&api_key=hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exercise 2 result:', data);
  } catch (error) {
    console.error('Error fetching sun gifs:', error);
  }
}

// Exercise 3: Async function with SWAPI
async function getStarship() {
  const url = 'https://www.swapi.tech/api/starships/9/';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exercise 3 result:', data.result);
  } catch (error) {
    console.error('Error fetching starship:', error);
  }
}

// Exercise 4: Analyze this code
function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

async function asyncCall() {
  console.log('calling');
  let result = await resolveAfter2Seconds();
  console.log(result);
}

asyncCall();

// Run all exercises
fetchHilariousGifs();
fetchSunGifs();
getStarship();

console.log('Exercise 4 explanation:');
console.log('The output will be:');
console.log('calling');
console.log('...wait 2 seconds...');
console.log('resolved');
console.log('This happens because await pauses the async function until the Promise resolves.');

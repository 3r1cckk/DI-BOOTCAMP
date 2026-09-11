// Exercise 1 : Giphy API #2
const API_KEY = 'hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My';

async function fetchRandomGif() {
  const query = 'funny';
  const url = `https://api.giphy.com/v1/gifs/search?q=${query}&limit=25&rating=g&api_key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const gifs = data.data;

    if (!gifs || gifs.length === 0) {
      throw new Error('No GIFs found');
    }

    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
    const gifUrl = randomGif.images?.original?.url || randomGif.images?.downsized?.url;

    if (!gifUrl) {
      throw new Error('No image URL found for this GIF');
    }

    if (typeof document !== 'undefined') {
      const img = document.createElement('img');
      img.src = gifUrl;
      img.alt = 'Random GIF';
      img.style.maxWidth = '400px';
      img.style.margin = '10px';
      document.body.appendChild(img);
    }

    console.log('Random GIF URL:', gifUrl);
  } catch (error) {
    console.error('Error fetching GIF:', error);
  }
}

fetchRandomGif();

// Exercise 2 : Analyze #2
/*
Outcome of sequentialStart():

==SEQUENTIAL START==
starting slow promise
slow promise is done
slow
starting fast promise
fast promise is done
fast

Explanation:
- The function waits for resolveAfter2Seconds() to finish before moving on.
- Then it waits for resolveAfter1Second() to finish.
- Because of await, each promise resolves one after the other.
*/

let resolveAfter2Seconds = function () {
  console.log('starting slow promise');
  return new Promise(resolve => {
    setTimeout(function () {
      resolve('slow');
      console.log('slow promise is done');
    }, 2000);
  });
};

let resolveAfter1Second = function () {
  console.log('starting fast promise');
  return new Promise(resolve => {
    setTimeout(function () {
      resolve('fast');
      console.log('fast promise is done');
    }, 1000);
  });
};

let sequentialStart = async function () {
  console.log('==SEQUENTIAL START==');
  const slow = await resolveAfter2Seconds();
  console.log(slow);
  const fast = await resolveAfter1Second();
  console.log(fast);
};

sequentialStart();

// Exercise 3 : Analyze #3
/*
Outcome of concurrentStart() after 4 seconds:

==CONCURRENT START with await==
starting slow promise
starting fast promise
fast promise is done
slow promise is done
slow
fast

Explanation:
- Both Promise creations start immediately.
- The slow promise resolves after 2 seconds, but the fast promise resolves after 1 second.
- The fast promise is still kept in memory and is awaited later, so its completion log appears before the final fast value is logged.
*/

let concurrentStart = async function () {
  console.log('==CONCURRENT START with await==');
  const slow = resolveAfter2Seconds();
  const fast = resolveAfter1Second();
  console.log(await slow);
  console.log(await fast);
};

setTimeout(concurrentStart, 4000);

// Exercise 4 : Modify fetch with Async/Await
const urls = [
  'https://jsonplaceholder.typicode.com/users',
  'https://jsonplaceholder.typicode.com/posts',
  'https://jsonplaceholder.typicode.com/albums'
];

const getData = async function () {
  try {
    const [users, posts, albums] = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
      })
    );

    console.log('users', users);
    console.log('posts', posts);
    console.log('albums', albums);
  } catch (error) {
    console.log('ooooooops');
    console.error(error);
  }
};

// To test the catch block, change one of the URLs to a broken one, for example:
// urls[1] = 'https://jsonplaceholder.typicode.com/does-not-exist';

getData();

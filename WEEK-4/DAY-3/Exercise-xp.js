// Exercise 1: HTML Form (GET)
// The data is sent in the URL query string.
// Example:
// ?name=Tom&message=Hello+world

const formGet = document.createElement('form');
formGet.method = 'GET';
formGet.action = window.location.href;

const nameInput = document.createElement('input');
nameInput.type = 'text';
nameInput.name = 'name';
nameInput.placeholder = 'Your name';

const messageInput = document.createElement('textarea');
messageInput.name = 'message';
messageInput.placeholder = 'Write your message here';

const submitButton = document.createElement('input');
submitButton.type = 'submit';
submitButton.value = 'Send';

formGet.appendChild(nameInput);
formGet.appendChild(messageInput);
formGet.appendChild(submitButton);

document.body.appendChild(formGet);

formGet.addEventListener('submit', (event) => {
  event.preventDefault();
  const params = new URLSearchParams(new FormData(formGet));
  console.log('GET data in URL:', params.toString());
  console.log('Visible in browser address bar after submit:', `${window.location.href}?${params.toString()}`);
});

// Exercise 2: HTML Form (POST)
// The data is sent in the request body, not in the URL.
// It can be inspected in the browser Network tab.

const formPost = document.createElement('form');
formPost.method = 'POST';
formPost.action = window.location.href;

const postName = document.createElement('input');
postName.type = 'text';
postName.name = 'name';
postName.placeholder = 'Name';

const postMessage = document.createElement('textarea');
postMessage.name = 'message';
postMessage.placeholder = 'Message';

const postSubmit = document.createElement('input');
postSubmit.type = 'submit';
postSubmit.value = 'Send';

formPost.appendChild(postName);
formPost.appendChild(postMessage);
formPost.appendChild(postSubmit);

document.body.appendChild(formPost);

formPost.addEventListener('submit', (event) => {
  event.preventDefault();
  const body = new FormData(formPost);
  console.log('POST body data:', Object.fromEntries(body.entries()));
  console.log('This data is sent in the request body and visible in the Network tab.');
});

// Exercise 3: JSON Mario
const marioGame = {
  detail: 'An amazing game!',
  characters: {
    mario: {
      description: 'Small and jumpy. Likes princesses.',
      height: 10,
      weight: 3,
      speed: 12,
    },
    bowser: {
      description: 'Big and green, Hates princesses.',
      height: 16,
      weight: 6,
      speed: 4,
    },
    princessPeach: {
      description: 'Beautiful princess.',
      height: 12,
      weight: 2,
      speed: 2,
    },
  },
};

// 1. Convert the JS object into JSON
const marioJson = JSON.stringify(marioGame);
console.log('JSON version:', marioJson);
console.log('Nested objects are preserved as nested JSON objects because they are still object values inside the main object.');

// 2. Pretty print JSON
const prettyMarioJson = JSON.stringify(marioGame, null, 2);
console.log('Pretty printed JSON:\n' + prettyMarioJson);

// 3. Breakpoint example for debugging
// Open the browser dev tools and place a breakpoint on the next line.
console.log('Debugger check: inspect marioJson and marioGame in the dev tools.');

// Optional: inspect the parsed object from JSON
const parsedMarioGame = JSON.parse(marioJson);
console.log('Parsed object:', parsedMarioGame);

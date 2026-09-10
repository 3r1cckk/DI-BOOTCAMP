// 1st daily challenge: Promises

function makeAllCaps(words) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(words) || words.some((word) => typeof word !== 'string')) {
      reject('Error: all items in the array must be strings');
      return;
    }

    resolve(words.map((word) => word.toUpperCase()));
  });
}

function sortWords(words) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(words) || words.length <= 4) {
      reject('Error: the array must contain more than 4 words');
      return;
    }

    resolve([...words].sort());
  });
}

// Test cases
makeAllCaps([1, 'pear', 'banana'])
  .then((arr) => sortWords(arr))
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

makeAllCaps(['apple', 'pear', 'banana'])
  .then((arr) => sortWords(arr))
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

makeAllCaps(['apple', 'pear', 'banana', 'melon', 'kiwi'])
  .then((arr) => sortWords(arr))
  .then((result) => console.log(result))
  .catch((error) => console.log(error));

// 2nd daily challenge: Morse code
const morse = `{
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  "a": ".-",
  "b": "-...",
  "c": "-.-.",
  "d": "-..",
  "e": ".",
  "f": "..-.",
  "g": "--.",
  "h": "....",
  "i": "..",
  "j": ".---",
  "k": "-.-",
  "l": ".-..",
  "m": "--",
  "n": "-.",
  "o": "---",
  "p": ".--.",
  "q": "--.-",
  "r": ".-.",
  "s": "...",
  "t": "-",
  "u": "..-",
  "v": "...-",
  "w": ".--",
  "x": "-..-",
  "y": "-.--",
  "z": "--..",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "-": "-....-",
  "/": "-..-.",
  "@": ".--.-.",
  "(": "-.--.",
  ")": "-.--.-"
}`;

function toJs() {
  return new Promise((resolve, reject) => {
    const morseJS = JSON.parse(morse);

    if (Object.keys(morseJS).length === 0) {
      reject('Error: Morse object is empty');
      return;
    }

    resolve(morseJS);
  });
}

function toMorse(morseJS) {
  return new Promise((resolve, reject) => {
    const userInput = prompt('Enter a word or sentence:');

    if (userInput === null || userInput === '') {
      reject('Error: no input provided');
      return;
    }

    const letters = userInput.toLowerCase().split('');
    const translation = [];

    for (const char of letters) {
      if (char === ' ') {
        continue;
      }

      if (!(char in morseJS)) {
        reject(`Error: the character "${char}" does not exist in the Morse object`);
        return;
      }

      translation.push(morseJS[char]);
    }

    resolve(translation);
  });
}

function joinWords(morseTranslation) {
  return new Promise((resolve) => {
    const output = morseTranslation.join('\n');

    if (typeof document !== 'undefined') {
      const result = document.getElementById('morse-output');
      if (result) {
        result.innerText = output;
      } else {
        console.log(output);
      }
    } else {
      console.log(output);
    }

    resolve(output);
  });
}

if (typeof prompt === 'function') {
  toJs()
    .then((morseJS) => toMorse(morseJS))
    .then((translation) => joinWords(translation))
    .catch((error) => console.log(error));
}

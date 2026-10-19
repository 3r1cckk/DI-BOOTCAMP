const { readFile, writeFile } = require('./fileManager');

const helloText = readFile('./Hello World.txt');
console.log('Read from Hello World.txt:');
console.log(helloText);

const result = writeFile('./Bye World.txt', 'Writing to the file');
console.log(result);

console.log('Updated Bye World.txt content:');
console.log(readFile('./Bye World.txt'));

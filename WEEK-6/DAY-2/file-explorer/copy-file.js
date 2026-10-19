const fs = require('fs');

const source = './source.txt';
const destination = './destination.txt';

const content = fs.readFileSync(source, 'utf8');
fs.writeFileSync(destination, content, 'utf8');

console.log(`Copied content from ${source} to ${destination}`);

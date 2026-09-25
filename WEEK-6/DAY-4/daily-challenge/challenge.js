const greet = require('./greeting');
const displayColorfulMessage = require('./colorful-message');
const readFileContent = require('./read-file');

function runChallenge() {
  console.log(greet('Alex'));
  displayColorfulMessage();
  readFileContent();
}

if (require.main === module) {
  runChallenge();
}

module.exports = runChallenge;
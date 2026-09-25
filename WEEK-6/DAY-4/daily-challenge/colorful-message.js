const chalk = require('chalk');

function displayColorfulMessage() {
  console.log(chalk.green.bold('Node.js modules make small programs powerful!'));
}

module.exports = displayColorfulMessage;
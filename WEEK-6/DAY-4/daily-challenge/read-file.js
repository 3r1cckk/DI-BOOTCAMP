const fs = require('fs');
const path = require('path');

function readFileContent() {
  const filePath = path.join(__dirname, 'files', 'file-data.txt');
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(content);
  return content;
}

module.exports = readFileContent;
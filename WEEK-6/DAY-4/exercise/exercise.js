const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk').default || require('chalk');

console.log('=== Exercise 1: Multiple Exports and Import using CommonJS ===');
const products = [
  { name: 'Laptop', price: 1200, category: 'Electronics' },
  { name: 'Headphones', price: 150, category: 'Electronics' },
  { name: 'Notebook', price: 10, category: 'Stationery' },
  { name: 'Backpack', price: 80, category: 'Accessories' }
];

function findProductByName(productName) {
  return products.find((product) => product.name.toLowerCase() === productName.toLowerCase());
}

['Laptop', 'Headphones', 'Notebook', 'Chair'].forEach((name) => {
  const product = findProductByName(name);
  console.log(product ? product : `No product found for: ${name}`);
});

console.log('\n=== Exercise 2: Average age using ES6-like import ===');
const people = [
  { name: 'Alice', age: 25, location: 'Paris' },
  { name: 'Bob', age: 30, location: 'Berlin' },
  { name: 'Charlie', age: 35, location: 'Rome' },
  { name: 'Diana', age: 28, location: 'Madrid' }
];

function averageAge(persons) {
  const totalAge = persons.reduce((sum, person) => sum + person.age, 0);
  return totalAge / persons.length;
}

console.log(`Average age: ${averageAge(people).toFixed(2)}`);

console.log('\n=== Exercise 3: File Management using CommonJS ===');
const helloFile = path.join(__dirname, 'Hello World.txt');
const byeFile = path.join(__dirname, 'Bye World.txt');

fs.writeFileSync(helloFile, 'Hello World !! \n', 'utf8');
const helloContent = fs.readFileSync(helloFile, 'utf8');
console.log('Hello file content:', helloContent.trim());

fs.writeFileSync(byeFile, 'Writing to the file', 'utf8');
const byeContent = fs.readFileSync(byeFile, 'utf8');
console.log('Bye file content:', byeContent);

console.log('\n=== Exercise 4: Todo List using ES6 class ===');
class TodoList {
  constructor() {
    this.tasks = [];
  }

  addTask(taskName) {
    this.tasks.push({ task: taskName, completed: false });
  }

  markTaskComplete(taskName) {
    const task = this.tasks.find((item) => item.task === taskName);
    if (task) task.completed = true;
  }

  listTasks() {
    return this.tasks;
  }
}

const todoList = new TodoList();
todoList.addTask('Learn Node.js');
todoList.addTask('Practice modules');
todoList.addTask('Review file system');
todoList.markTaskComplete('Practice modules');
console.log(todoList.listTasks());

console.log('\n=== Exercise 5: Custom module basics with lodash ===');
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

const numbers = [2, 4, 6, 8, 10];
console.log('Sum:', _.sum(numbers));
console.log('Average:', _.mean(numbers));
console.log('Add:', add(5, 7));
console.log('Multiply:', multiply(3, 9));

console.log('\n=== Exercise 6: chalk package ===');
console.log(chalk.blue.bold('Hello from chalk!'));
console.log(chalk.green('This is green text'));
console.log(chalk.red.bgYellow.bold('Colorful terminal output!'));

console.log('\n=== Exercise 7: Reading and Copying Files ===');
const sourcePath = path.join(__dirname, 'source.txt');
const destinationPath = path.join(__dirname, 'destination.txt');

fs.writeFileSync(sourcePath, 'This is the source file content.\n', 'utf8');
fs.copyFileSync(sourcePath, destinationPath);
console.log('Copied source.txt to destination.txt');

const directoryFiles = fs.readdirSync(__dirname);
console.log('Files in current directory:', directoryFiles);

const _ = require('lodash');
const { add, multiply } = require('./math');

const numbers = [2, 4, 6, 8, 10];
const total = _.sum(numbers);
const average = _.mean(numbers);

console.log('Sum:', total);
console.log('Average:', average);
console.log('Addition result:', add(5, 7));
console.log('Multiplication result:', multiply(3, 9));

import { people } from './data.js';

function averageAge(persons) {
  const totalAge = persons.reduce((sum, person) => sum + person.age, 0);
  return totalAge / persons.length;
}

const avg = averageAge(people);
console.log(`Average age: ${avg.toFixed(2)}`);

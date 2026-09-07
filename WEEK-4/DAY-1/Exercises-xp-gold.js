"use strict";

// Exercise 1: map returns a new array. Every item is a number, so each item is doubled.
// Output: [2, 4, 6]
const mappedNumbers = [1, 2, 3].map((num) => {
	if (typeof num === "number") return num * 2;
	return;
});
console.log("Exercise 1:", mappedNumbers);

// Exercise 2: reduce concatenates each current array onto the accumulator.
// Output: [1, 2, 0, 1, 2, 3]
const reducedNumbers = [[0, 1], [2, 3]].reduce(
	(accumulator, current) => accumulator.concat(current),
	[1, 2],
);
console.log("Exercise 2:", reducedNumbers);

// Exercise 3: i is the current element's zero-based index.
const arrayNum = [1, 2, 4, 5, 8, 9];
const doubledNumbers = arrayNum.map((num, index) => {
	console.log("Exercise 3:", { num, index });
	return num * 2;
});
console.log("Doubled numbers:", doubledNumbers);

// Exercise 4.1: flatten one level, while preserving [4] and [5].
const nestedNumbers = [[1], [2], [3], [[[4]]], [[[5]]]];
const flattenedNumbers = nestedNumbers.flat(3);
const requestedNumbers = [
	...flattenedNumbers.slice(0, 3),
	[flattenedNumbers[3]],
	[flattenedNumbers[4]],
];
console.log("Exercise 4.1:", requestedNumbers);

// Exercise 4.2: join each inner array into one phrase.
const greeting = [
	["Hello", "young", "grasshopper!"],
	["you", "are"],
	["learning", "fast!"],
];
const joinedGreeting = greeting.map((words) => words.join(" "));
console.log("Exercise 4.2:", joinedGreeting);

// Exercise 4.3: join the phrases into one sentence.
const greetingSentence = joinedGreeting.join(" ");
console.log("Exercise 4.3:", greetingSentence);

// Exercise 4.4: flat(Infinity) removes every level of nesting.
const trapped = [[[[[[[[[[[[[[[[[[[[[[[[[[3]]]]]]]]]]]]]]]]]]]]]]]]]];
const releasedNumber = trapped.flat(Infinity);
console.log("Exercise 4.4:", releasedNumber);

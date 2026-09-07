"use strict";

// Exercise 1: Dog age to human years
const data = [
	{ name: "Butters", age: 3, type: "dog" },
	{ name: "Cuty", age: 5, type: "rabbit" },
	{ name: "Lizzy", age: 6, type: "dog" },
	{ name: "Red", age: 1, type: "cat" },
	{ name: "Joey", age: 3, type: "dog" },
	{ name: "Rex", age: 10, type: "dog" },
];

let dogAgeTotal = 0;
for (const animal of data) {
	if (animal.type === "dog") {
		dogAgeTotal += animal.age * 7;
	}
}
console.log("Exercise 1, loop:", dogAgeTotal);

const dogAgeTotalWithReduce = data.reduce(
	(total, animal) => total + (animal.type === "dog" ? animal.age * 7 : 0),
	0,
);
console.log("Exercise 1, reduce:", dogAgeTotalWithReduce);

// Exercise 2: Email
const userEmail3 = " cannotfillemailformcorrectly@gmail.com ";
const cleanedEmail = userEmail3.trim();
console.log("Exercise 2:", cleanedEmail);

// Exercise 3: Employees #3
const users = [
	{ firstName: "Bradley", lastName: "Bouley", role: "Full Stack Resident" },
	{ firstName: "Chloe", lastName: "Alnaji", role: "Full Stack Resident" },
	{ firstName: "Jonathan", lastName: "Baughn", role: "Enterprise Instructor" },
	{ firstName: "Michael", lastName: "Herman", role: "Lead Instructor" },
	{ firstName: "Robert", lastName: "Hajek", role: "Full Stack Resident" },
	{ firstName: "Wes", lastName: "Reid", role: "Instructor" },
	{ firstName: "Zach", lastName: "Klabunde", role: "Instructor" },
];

const usersByFullName = {};
users.forEach(({ firstName, lastName, role }) => {
	usersByFullName[`${firstName} ${lastName}`] = role;
});
console.log("Exercise 3:", usersByFullName);

// Exercise 4: Array to Object
const letters = ["x", "y", "z", "z"];

const letterCountsWithLoop = {};
for (const letter of letters) {
	letterCountsWithLoop[letter] = (letterCountsWithLoop[letter] || 0) + 1;
}
console.log("Exercise 4, loop:", letterCountsWithLoop);

const letterCountsWithReduce = letters.reduce((counts, letter) => {
	counts[letter] = (counts[letter] || 0) + 1;
	return counts;
}, {});
console.log("Exercise 4, reduce:", letterCountsWithReduce);

// Exercise 1: Scope predictions
// #1: a changes from 5 to 3 inside funcOne, so it alerts 3.
// With const instead of let, assigning a = 3 throws TypeError because const cannot be reassigned.
function funcOne() {
	let a = 5;
	if (a > 1) a = 3;
	console.log(`inside the funcOne function ${a}`);
}

// #2: funcThree first alerts 0, then funcTwo changes the outer a to 5, so it alerts 5.
// With const instead of let, funcTwo throws TypeError when it tries to assign a = 5.
let scopeValue = 0;
function funcTwo() {
	scopeValue = 5;
}
function funcThree() {
	console.log(`inside the funcThree function ${scopeValue}`);
}

// #3: funcFour creates window.a, so funcFive can read and alert "hello" in a browser.
function funcFour() {
	window.a = "hello";
}
function funcFive() {
	console.log(`inside the funcFive function ${window.a}`);
}

// #4: the inner a shadows the outer variable, so funcSix alerts "test".
// With const instead of let, this still works because the inner const is never reassigned.
const outerValue = 1;
function funcSix() {
	const innerValue = "test";
	console.log(`inside the funcSix function ${innerValue}`);
}

// #5: block scope means the if block alerts 5 and the outside alert is 2.
// With const instead of let, this still works because the two const variables are in different scopes.
const blockValue = 2;
{
	const innerBlockValue = 5;
	console.log(`in the if block ${innerBlockValue}`);
}
console.log(`outside of the if block ${blockValue}`);

// Exercise 2: Ternary operator
const winBattle = () => true;
const experiencePoints = winBattle() ? 10 : 1;
console.log(experiencePoints);

// Exercise 3: Is it a string?
const isString = (value) => typeof value === "string";
console.log(isString("hello"));
console.log(isString([1, 2, 4, 0]));

// Exercise 4: Find the sum
const sum = (firstNumber, secondNumber) => firstNumber + secondNumber;

// Exercise 5: Kg and grams
function kilogramsToGrams(weight) {
	return weight * 1000;
}
console.log(kilogramsToGrams(2));

const kilogramsToGramsExpression = function (weight) {
	return weight * 1000;
};
console.log(kilogramsToGramsExpression(3));
// A declaration is hoisted and named directly; an expression is assigned to a variable and is not hoisted as a callable function.
const kilogramsToGramsArrow = (weight) => weight * 1000;
console.log(kilogramsToGramsArrow(4));

// Exercise 6: Fortune teller
(function (numberOfChildren, partnerName, geographicLocation, jobTitle) {
	document.querySelector("#fortune").textContent =
		`You will be a ${jobTitle} in ${geographicLocation}, and married to ${partnerName} with ${numberOfChildren} kids.`;
})(3, "Alex", "Paris", "web developer");

// Exercise 7: Welcome
(function (userName) {
	const welcome = document.createElement("div");
	welcome.className = "welcome-user";
	welcome.innerHTML = `<img src="https://i.pravatar.cc/64?img=12" alt="Profile picture"> <span>Welcome, ${userName}</span>`;
	document.querySelector("#navbar").appendChild(welcome);
})("John");

// Exercise 8: Juice bar, Part I
function makeJuice(size) {
	function addIngredients(firstIngredient, secondIngredient, thirdIngredient) {
		document.querySelector("#juice-part-one").textContent =
			`The client wants a ${size} juice, containing ${firstIngredient}, ${secondIngredient}, ${thirdIngredient}.`;
	}

	addIngredients("mango", "lime", "mint");
}
makeJuice("large");

// Exercise 8: Juice bar, Part II
function makeJuiceWithSixIngredients(size) {
	const ingredients = [];

	function addIngredients(firstIngredient, secondIngredient, thirdIngredient) {
		ingredients.push(firstIngredient, secondIngredient, thirdIngredient);
	}

	function displayJuice() {
		document.querySelector("#juice-part-two").textContent =
			`The client wants a ${size} juice, containing ${ingredients.join(", ")}.`;
	}

	addIngredients("apple", "ginger", "lemon");
	addIngredients("spinach", "cucumber", "celery");
	displayJuice();
}
makeJuiceWithSixIngredients("medium");

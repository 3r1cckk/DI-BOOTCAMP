// Exercise 1 prediction: flat(4) adds four underscores, mountain(4) adds /''''\\,
// and the final flat(4) adds four more underscores. The result is "____/''''\\____".
const landscape = () => {
	let result = "";
	const flat = (length) => {
		for (let count = 0; count < length; count += 1) result += "_";
	};
	const mountain = (height) => {
		result += "/";
		for (let count = 0; count < height; count += 1) result += "'";
		result += "\\";
	};

	flat(4);
	mountain(4);
	flat(4);
	return result;
};

const landscapeResult = landscape();

// Exercise 2 prediction: addTo(10) closes over x = 10, so addToTen(3) returns 13.
const addTo = (x) => (y) => x + y;
const addToTen = addTo(10);
const closureResult = addToTen(3);

// Exercise 3 prediction: curriedSum(30) returns a function waiting for b; (1) returns 31.
const curriedSum = (a) => (b) => a + b;
const curryingResultOne = curriedSum(30)(1);

// Exercise 4 prediction: add5 closes over 5, so add5(12) returns 17.
const add5 = curriedSum(5);
const curryingResultTwo = add5(12);

// Exercise 5 prediction: g runs first (10 + 5), then f adds 1, producing 16.
const compose = (f, g) => (value) => f(g(value));
const add1 = (number) => number + 1;
const addFive = (number) => number + 5;
const compositionResult = compose(add1, addFive)(10);

const results = [
	["Landscape", landscapeResult],
	["Closure", closureResult],
	["Currying 1", curryingResultOne],
	["Currying 2", curryingResultTwo],
	["Composition", compositionResult],
];

const resultsList = document.querySelector("#results");
results.forEach(([label, value]) => {
	const item = document.createElement("li");
	item.innerHTML = `<strong>${label}:</strong> <code>${value}</code>`;
	resultsList.appendChild(item);
});

console.log({ landscapeResult, closureResult, curryingResultOne, curryingResultTwo, compositionResult });

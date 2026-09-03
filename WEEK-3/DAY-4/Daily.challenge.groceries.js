let client = "John";

const groceries = {
	fruits: ["pear", "apple", "banana"],
	vegetables: ["tomatoes", "cucumber", "salad"],
	totalPrice: "20$",
	other: {
		paid: true,
		meansOfPayment: ["cash", "creditCard"],
	},
};

const displayGroceries = () => {
	groceries.fruits.forEach((fruit) => console.log(fruit));
};

const cloneGroceries = () => {
	const user = client;
	client = "Betty";

	const shopping = groceries;
	shopping.totalPrice = "35$";
	shopping.other.paid = false;

	const result = {
		user,
		client,
		shopping,
		primitiveExplanation: "user remains John because strings are copied by value.",
		objectExplanation: "shopping changes with groceries because objects are assigned by reference.",
	};

	console.log(result);
	return result;
};

displayGroceries();
const groceryResult = cloneGroceries();

document.querySelector("#fruits").textContent = groceries.fruits.join(", ");
document.querySelector("#client-result").textContent = `${groceryResult.user} -> ${groceryResult.client}`;
document.querySelector("#shopping-result").textContent =
	`${groceryResult.shopping.totalPrice}, paid: ${groceryResult.shopping.other.paid}`;

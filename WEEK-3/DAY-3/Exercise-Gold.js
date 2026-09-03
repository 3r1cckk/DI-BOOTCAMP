const root = document.querySelector("#root");

const musicSection = document.createElement("section");
const musicTitle = document.createElement("h1");
musicTitle.textContent = "Select a kind of Music";
const genres = document.createElement("select");
genres.id = "genres";

[
	["rock", "Rock"],
	["blues", "Blues"],
	["classic", "Classic"],
].forEach(([value, label]) => {
	const option = new Option(label, value);
	genres.add(option);
});
genres.value = "classic";

const selectedGenre = document.createElement("p");
function displaySelectedGenre() {
	selectedGenre.textContent = `Selected genre: ${genres.value}`;
}
genres.addEventListener("change", displaySelectedGenre);
displaySelectedGenre();
musicSection.append(musicTitle, genres, selectedGenre);

const colorSection = document.createElement("section");
const colorTitle = document.createElement("h1");
colorTitle.textContent = "Delete colors";
const colorForm = document.createElement("form");
const colorSelect = document.createElement("select");
colorSelect.id = "colorSelect";
["Red", "Green", "White", "Black"].forEach((color) => {
	colorSelect.add(new Option(color, color));
});
const removeButton = document.createElement("input");
removeButton.type = "button";
removeButton.value = "Select and Remove";
removeButton.addEventListener("click", removecolor);
colorForm.append(colorSelect, removeButton);
colorSection.append(colorTitle, colorForm);

let shoppingList = [];
const shoppingSection = document.createElement("section");
const shoppingTitle = document.createElement("h1");
shoppingTitle.textContent = "Shopping List";
const shoppingForm = document.createElement("form");
const itemInput = document.createElement("input");
itemInput.type = "text";
itemInput.placeholder = "Item to buy";
itemInput.required = true;
const addButton = document.createElement("button");
addButton.type = "submit";
addButton.textContent = "AddItem";
const clearAllButton = document.createElement("button");
clearAllButton.type = "button";
clearAllButton.textContent = "ClearAll";
const shoppingItems = document.createElement("ul");

function renderShoppingList() {
	shoppingItems.replaceChildren();
	shoppingList.forEach((item) => {
		const listItem = document.createElement("li");
		listItem.textContent = item;
		shoppingItems.appendChild(listItem);
	});
}

function addItem(event) {
	event.preventDefault();
	const item = itemInput.value.trim();
	if (!item) return;

	shoppingList.push(item);
	itemInput.value = "";
	renderShoppingList();
}

function clearAll() {
	shoppingList.length = 0;
	renderShoppingList();
}

function removecolor() {
	if (colorSelect.selectedIndex >= 0) {
		colorSelect.remove(colorSelect.selectedIndex);
	}
}

shoppingForm.addEventListener("submit", addItem);
clearAllButton.addEventListener("click", clearAll);
shoppingForm.append(itemInput, addButton, clearAllButton);
shoppingSection.append(shoppingTitle, shoppingForm, shoppingItems);
root.append(musicSection, colorSection, shoppingSection);

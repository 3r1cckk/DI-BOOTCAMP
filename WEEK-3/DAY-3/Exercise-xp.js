let allBoldItems = [];

document.addEventListener("DOMContentLoaded", () => {
	const article = document.querySelector("article");
	const heading = article.firstElementChild;
	const subheading = article.querySelector("h2");
	const historyHeading = article.querySelector("h3");
	const paragraphs = article.querySelectorAll("p");
	const boldParagraph = document.querySelector(".bold-paragraph");

	console.log(heading);
	article.removeChild(article.lastElementChild);

	subheading.addEventListener("click", () => {
		subheading.style.backgroundColor = "red";
	});

	historyHeading.addEventListener("click", () => {
		historyHeading.style.display = "none";
	});

	document.querySelector("#bold-button").addEventListener("click", () => {
		article.querySelectorAll("p").forEach((paragraph) => {
			paragraph.style.fontWeight = "bold";
		});
	});

	heading.addEventListener("mouseover", () => {
		heading.style.fontSize = `${Math.floor(Math.random() * 101)}px`;
	});

	paragraphs[1].addEventListener("mouseover", () => {
		paragraphs[1].classList.add("fade-out");
	});

	getBoldItems();
	boldParagraph.addEventListener("mouseover", highlight);
	boldParagraph.addEventListener("mouseout", returnItemsToDefault);

	const userForm = document.querySelector("#user-form");
	const usersAnswer = document.querySelector(".usersAnswer");

	console.log(userForm);
	console.log(document.querySelector("#fname"));
	console.log(document.querySelector("#lname"));
	console.log(userForm.elements.firstname);
	console.log(userForm.elements.lastname);

	userForm.addEventListener("submit", (event) => {
		event.preventDefault();
		usersAnswer.replaceChildren();

		[userForm.elements.firstname.value, userForm.elements.lastname.value]
			.map((value) => value.trim())
			.filter(Boolean)
			.forEach((value) => {
				const listItem = document.createElement("li");
				listItem.textContent = value;
				usersAnswer.appendChild(listItem);
			});
	});

	const sphereForm = document.querySelector("#MyForm");
	sphereForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const radius = Number(document.querySelector("#radius").value);
		const volume = (4 / 3) * Math.PI * radius ** 3;
		document.querySelector("#volume").value = volume.toFixed(2);
	});
});

function getBoldItems() {
	allBoldItems = document.querySelectorAll(".bold-paragraph strong");
}

function highlight() {
	allBoldItems.forEach((item) => {
		item.style.color = "blue";
	});
}

function returnItemsToDefault() {
	allBoldItems.forEach((item) => {
		item.style.color = "black";
	});
}

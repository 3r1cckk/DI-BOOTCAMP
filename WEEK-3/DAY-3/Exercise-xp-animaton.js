const alertButton = document.querySelector("#alert-button");
const paragraphButton = document.querySelector("#paragraph-button");
const clearButton = document.querySelector("#clear");
const timerContainer = document.querySelector("#container");
let paragraphInterval;

function showHelloWorldAlert() {
	alert("Hello World");
}

function addHelloWorldParagraph() {
	const paragraph = document.createElement("p");
	paragraph.textContent = "Hello World";
	timerContainer.appendChild(paragraph);
}

alertButton.addEventListener("click", () => {
	setTimeout(showHelloWorldAlert, 2000);
});

paragraphButton.addEventListener("click", () => {
	setTimeout(addHelloWorldParagraph, 2000);
});

function startParagraphInterval() {
	clearInterval(paragraphInterval);
	paragraphInterval = setInterval(() => {
		addHelloWorldParagraph();

		if (timerContainer.querySelectorAll("p").length >= 5) {
			clearInterval(paragraphInterval);
		}
	}, 2000);
}

clearButton.addEventListener("click", () => {
	clearInterval(paragraphInterval);
});

document.querySelector("#start-interval").addEventListener("click", startParagraphInterval);

function myMove() {
	const box = document.querySelector("#animate");
	const container = document.querySelector("#move-container");
	let position = 0;

	clearInterval(box.moveInterval);
	box.style.left = "0px";
	box.moveInterval = setInterval(() => {
		if (position >= container.clientWidth - box.offsetWidth) {
			clearInterval(box.moveInterval);
			return;
		}

		position += 1;
		box.style.left = `${position}px`;
	}, 1);
}

document.querySelector("#move-button").addEventListener("click", myMove);

const lettersInput = document.querySelector("#letters-only");
const inputMessage = document.querySelector("#input-message");

lettersInput.addEventListener("input", () => {
	const originalValue = lettersInput.value;
	lettersInput.value = originalValue.replace(/[^a-zA-Z]/g, "");

	inputMessage.textContent = originalValue === lettersInput.value
		? "Letters only"
		: "Numbers and special characters were removed.";
});

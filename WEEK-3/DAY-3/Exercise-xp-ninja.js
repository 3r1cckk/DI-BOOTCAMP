const tipForm = document.querySelector("#tip-form");
const totalTip = document.querySelector("#totalTip");
const eachLabel = document.querySelector("#each");

function calculateTip() {
	const billAmount = Number(document.querySelector("#billAmt").value);
	const serviceQuality = Number(document.querySelector("#serviceQual").value);
	let numberOfPeople = Number(document.querySelector("#numOfPeople").value);

	if (serviceQuality === 0 || !document.querySelector("#billAmt").value.trim()) {
		alert("Please enter the bill amount and service quality.");
		totalTip.style.display = "none";
		return;
	}

	if (!numberOfPeople || numberOfPeople < 1) {
		numberOfPeople = 1;
		eachLabel.style.display = "none";
	} else {
		eachLabel.style.display = "inline";
	}

	const total = ((billAmount * serviceQuality) / numberOfPeople).toFixed(2);
	document.querySelector("#tip").textContent = total;
	totalTip.style.display = "block";
}

document.querySelector("#calculate").onclick = calculateTip;
tipForm.addEventListener("submit", (event) => event.preventDefault());

function isValidEmailWithoutRegex(email) {
	const atIndex = email.indexOf("@");
	const dotIndex = email.lastIndexOf(".");
	return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < email.length - 1;
}

function isValidEmailWithRegex(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmail(event) {
	event.preventDefault();
	const emailInput = document.querySelector("#email");
	const email = emailInput.value.trim();
	const isValid = isValidEmailWithoutRegex(email) && isValidEmailWithRegex(email);
	const emailMessage = document.querySelector("#email-message");

	emailMessage.textContent = isValid ? "Valid email address." : "Please enter a valid email address.";
	emailMessage.style.color = isValid ? "green" : "crimson";
}

document.querySelector("#email-form").addEventListener("submit", validateEmail);

function showLocation(position) {
	document.querySelector("#location-output").textContent =
		`Latitude: ${position.coords.latitude}\nLongitude: ${position.coords.longitude}`;
}

function showLocationError() {
	document.querySelector("#location-output").textContent = "Location could not be retrieved.";
}

document.querySelector("#location-button").addEventListener("click", () => {
	const output = document.querySelector("#location-output");
	if (!navigator.geolocation) {
		output.textContent = "Geolocation is not supported by this browser.";
		return;
	}

	output.textContent = "Requesting location...";
	navigator.geolocation.getCurrentPosition(showLocation, showLocationError);
});

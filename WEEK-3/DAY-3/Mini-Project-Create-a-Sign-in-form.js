const root = document.querySelector("#root");
const app = document.createElement("main");
app.className = "auth-card";

const brand = document.createElement("p");
brand.className = "brand";
brand.textContent = "Email";

const title = document.createElement("h1");
const prompt = document.createElement("p");
prompt.className = "prompt";
const form = document.createElement("form");
const emailLabel = document.createElement("label");
const emailInput = document.createElement("input");
const passwordLabel = document.createElement("label");
const passwordInput = document.createElement("input");
const submitButton = document.createElement("button");
const message = document.createElement("p");
message.className = "message";
const switchText = document.createElement("p");
switchText.className = "switch-text";
const switchButton = document.createElement("button");
switchButton.type = "button";
switchButton.className = "link-button";

emailLabel.htmlFor = "email";
emailLabel.textContent = "Email address";
emailInput.id = "email";
emailInput.type = "email";
emailInput.autocomplete = "email";
emailInput.required = true;

passwordLabel.htmlFor = "password";
passwordLabel.textContent = "Password";
passwordInput.id = "password";
passwordInput.type = "password";
passwordInput.autocomplete = "current-password";
passwordInput.minLength = 6;
passwordInput.required = true;

form.append(emailLabel, emailInput, passwordLabel, passwordInput, submitButton);
app.append(brand, title, prompt, form, message, switchText);
root.appendChild(app);

let mode = "signup";

function renderMode() {
	const isSignup = mode === "signup";
	title.textContent = isSignup ? "Sign Up" : "Log In";
	prompt.textContent = isSignup ? "Create Account" : "Please, Log In";
	submitButton.textContent = isSignup ? "Create Account" : "Log In";
	switchText.textContent = isSignup ? "Already have an account?" : "New here?";
	switchText.appendChild(switchButton);
	switchButton.textContent = isSignup ? "Log In" : "Sign Up";
	passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
	message.textContent = "";
}

form.addEventListener("submit", (event) => {
	event.preventDefault();
	const action = mode === "signup" ? "Account created" : "Welcome back";
	message.textContent = `${action}. We sent a confirmation to ${emailInput.value}.`;
	message.className = "message success";
});

switchButton.addEventListener("click", () => {
	mode = mode === "signup" ? "login" : "signup";
	form.reset();
	renderMode();
});

renderMode();

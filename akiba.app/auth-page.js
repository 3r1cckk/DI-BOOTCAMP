const form = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const nameField = document.getElementById("nameField");
const confirmField = document.getElementById("confirmField");
const passwordHint = document.getElementById("passwordHint");
const message = document.getElementById("authMessage");
const submitButton = document.getElementById("submitButton");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
let mode = "login";

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";
  document.getElementById("formTitle").textContent = registering ? "Create your account" : "Welcome back";
  document.getElementById("formSubtitle").textContent = registering
    ? "Start making your chama's plans easier to manage."
    : "Sign in to pick up where your group left off.";
  loginTab.classList.toggle("active", !registering);
  loginTab.setAttribute("aria-selected", String(!registering));
  registerTab.classList.toggle("active", registering);
  registerTab.setAttribute("aria-selected", String(registering));
  nameField.hidden = !registering;
  confirmField.hidden = !registering;
  passwordHint.hidden = !registering;
  document.getElementById("name").required = registering;
  confirmPasswordInput.required = registering;
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  submitButton.querySelector("span").textContent = registering ? "Create account" : "Log in";
  document.getElementById("switchCopy").innerHTML = registering
    ? 'Already have an account? <button type="button" data-switch-mode="login">Log in</button>'
    : 'New to Akiba? <button type="button" data-switch-mode="register">Create an account</button>';
  clearMessage();
}

function showMessage(text, kind = "error") {
  message.textContent = text;
  message.className = `auth-message ${kind}`;
  message.hidden = false;
}

function clearMessage() {
  message.textContent = "";
  message.hidden = true;
  message.className = "auth-message";
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));
document.getElementById("switchCopy").addEventListener("click", (event) => {
  const button = event.target.closest("[data-switch-mode]");
  if (button) setMode(button.dataset.switchMode);
});

document.querySelector(".password-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const showPassword = passwordInput.type === "password";
  passwordInput.type = showPassword ? "text" : "password";
  button.setAttribute("aria-pressed", String(showPassword));
  button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
  button.innerHTML = `<i class="fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}" aria-hidden="true"></i>`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  if (!form.reportValidity()) return;

  const fields = new FormData(form);
  const password = fields.get("password");
  if (mode === "register" && password !== fields.get("confirmPassword")) {
    showMessage("Those passwords do not match.");
    confirmPasswordInput.focus();
    return;
  }
  if (mode === "register" && (!/[a-zA-Z]/.test(password) || !/\d/.test(password))) {
    showMessage("Include at least one letter and one number in your password.");
    passwordInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = mode === "register" ? "Creating account…" : "Signing in…";
  try {
    const response = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: fields.get("name"),
        email: fields.get("email"),
        password
      })
    });
    const result = await readApiResponse(response);
    if (!response.ok) {
      showMessage(result.error || "We couldn't complete that request. Please try again.");
      return;
    }
    window.location.replace("/dashboard.html");
  } catch (error) {
    showMessage(error.message || "Akiba's server is not responding. Start it with `npm start` and open http://localhost:3000/login.html.");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = mode === "register" ? "Create account" : "Log in";
  }
});

fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
  .then(async (response) => {
    await readApiResponse(response);
    if (response.ok) window.location.replace("/dashboard.html");
  })
  .catch((error) => showMessage(
    error.message || "Akiba's server is not responding. Start it with `npm start` and open http://localhost:3000/login.html."
  ));

async function readApiResponse(response) {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("This page is not connected to Akiba's account server. Start it with `npm start` and open http://localhost:3000/login.html.");
  }
  return response.json();
}

const authDialog = document.getElementById("authDialog");
const authForm = document.getElementById("landingAuthForm");
const authMessage = document.getElementById("landingAuthMessage");
const authSubmit = document.getElementById("landingAuthSubmit");
const authPassword = document.getElementById("authPassword");
const authConfirmPassword = document.getElementById("authConfirmPassword");
let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  document.getElementById("authTitle").textContent = registering ? "Create your account" : "Welcome back";
  document.getElementById("authSubtitle").textContent = registering
    ? "Start making your chama's plans easier to manage."
    : "Sign in to pick up where your group left off.";
  document.getElementById("authLoginTab").classList.toggle("active", !registering);
  document.getElementById("authLoginTab").setAttribute("aria-selected", String(!registering));
  document.getElementById("authRegisterTab").classList.toggle("active", registering);
  document.getElementById("authRegisterTab").setAttribute("aria-selected", String(registering));
  document.getElementById("authNameField").hidden = !registering;
  document.getElementById("authConfirmField").hidden = !registering;
  document.getElementById("authPasswordHint").hidden = !registering;
  document.getElementById("authName").required = registering;
  authConfirmPassword.required = registering;
  authPassword.autocomplete = registering ? "new-password" : "current-password";
  authSubmit.innerHTML = `${registering ? "Create account" : "Log in"} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
  document.getElementById("landingAuthSwitch").innerHTML = registering
    ? 'Already have an account? <button type="button" data-auth-mode="login">Log in</button>'
    : 'New to Akiba? <button type="button" data-auth-mode="register">Create an account</button>';
  clearAuthMessage();
}

function showAuthMessage(text, type = "error") {
  authMessage.textContent = text;
  authMessage.className = `landing-auth-message ${type}`;
  authMessage.hidden = false;
}

function clearAuthMessage() {
  authMessage.textContent = "";
  authMessage.hidden = true;
  authMessage.className = "landing-auth-message";
}

function openAuthDialog(mode = "login") {
  setAuthMode(mode);
  if (!authDialog.open) authDialog.showModal();
  window.setTimeout(() => {
    const firstInput = authDialog.querySelector("#authNameField:not([hidden]) input") ||
      authDialog.querySelector("#authEmail");
    firstInput?.focus();
  }, 0);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-auth]");
  if (trigger) {
    event.preventDefault();
    openAuthDialog(trigger.dataset.openAuth || "login");
    return;
  }

  const authLink = event.target.closest('a[href="dashboard.html"], a[href="login.html"]');
  if (authLink) {
    event.preventDefault();
    openAuthDialog("login");
    return;
  }

  const modeButton = event.target.closest("[data-auth-mode]");
  if (modeButton) setAuthMode(modeButton.dataset.authMode);
});

document.getElementById("closeAuth").addEventListener("click", () => authDialog.close());
authDialog.addEventListener("click", (event) => {
  if (event.target === authDialog) authDialog.close();
});
document.getElementById("authLoginTab").addEventListener("click", () => setAuthMode("login"));
document.getElementById("authRegisterTab").addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthMessage();
  if (!authForm.reportValidity()) return;

  const fields = new FormData(authForm);
  const password = fields.get("password");
  if (authMode === "register" && password !== fields.get("confirmPassword")) {
    showAuthMessage("Those passwords do not match.");
    authConfirmPassword.focus();
    return;
  }
  if (authMode === "register" && (!/[a-zA-Z]/.test(password) || !/\d/.test(password))) {
    showAuthMessage("Include at least one letter and one number in your password.");
    authPassword.focus();
    return;
  }

  authSubmit.disabled = true;
  authSubmit.textContent = authMode === "register" ? "Creating account…" : "Signing in…";
  try {
    const response = await fetch(`/api/auth/${authMode === "register" ? "register" : "login"}`, {
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
      showAuthMessage(result.error || "We couldn't complete that request. Please try again.");
      return;
    }
    window.location.assign("/dashboard.html");
  } catch (error) {
    showAuthMessage(error.message || "Akiba's server is not responding. Start it with `npm start` and open http://localhost:3000/.");
  } finally {
    authSubmit.disabled = false;
    authSubmit.innerHTML = `${authMode === "register" ? "Create account" : "Log in"} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
  }
});

async function readApiResponse(response) {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("This page is not connected to Akiba's account server. Start it with `npm start` and open http://localhost:3000/.");
  }
  return response.json();
}

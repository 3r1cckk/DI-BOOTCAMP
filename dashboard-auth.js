const signOutButton = document.getElementById("signOutButton");
const profileName = document.querySelector("#profileButton span:not(.avatar)");
const welcomeHeading = document.querySelector(".welcome-row h1");
const toast = document.getElementById("toast");
let signOutMessageTimer;

fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
  .then(async (response) => {
    if (!response.ok) {
      window.location.replace("/login.html");
      return;
    }
    const { user } = await response.json();
    if (profileName) profileName.textContent = user.name;
    if (welcomeHeading) {
      welcomeHeading.replaceChildren(
        document.createTextNode(`Welcome back, ${user.name}! `),
        Object.assign(document.createElement("span"), { textContent: "👋" })
      );
    }
  })
  .catch(() => window.location.replace("/login.html"));

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  signOutButton.setAttribute("aria-busy", "true");
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      let message = `Sign out failed (HTTP ${response.status}). Please try again.`;
      try {
        const result = await response.json();
        if (typeof result.error === "string" && result.error) message = result.error;
      } catch {
        // Keep the HTTP status message when the server does not return JSON.
      }
      throw new Error(message);
    }
    window.location.replace("/login.html");
  } catch (error) {
    console.error("Akiba sign out failed:", error);
    signOutButton.disabled = false;
    signOutButton.removeAttribute("aria-busy");
    signOutButton.querySelector("span").textContent = "Try again";
    if (toast) {
      toast.textContent = error.message || "Could not sign out. Please try again.";
      toast.classList.add("show");
      clearTimeout(signOutMessageTimer);
      signOutMessageTimer = window.setTimeout(() => {
        toast.classList.remove("show");
      }, 5000);
    }
  }
});

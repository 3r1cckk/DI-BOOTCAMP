const signOutButton = document.getElementById("signOutButton");
const profileName = document.querySelector("#profileButton span:not(.avatar)");
const welcomeHeading = document.querySelector(".welcome-row h1");

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
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
    if (!response.ok) throw new Error("Sign out failed.");
    window.location.replace("/login.html");
  } catch {
    signOutButton.disabled = false;
    signOutButton.querySelector("span").textContent = "Try again";
  }
});

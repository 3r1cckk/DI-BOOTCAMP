import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyD8K9wdUx1P5xNx1ngQFGPWG0h33rzbSwg",
  authDomain: "akiba-chama.firebaseapp.com",
  projectId: "akiba-chama",
  storageBucket: "akiba-chama.firebasestorage.app",
  messagingSenderId: "823670255004",
  appId: "1:823670255004:web:1189ca5fcbb51f1bec6c59",
  measurementId: "G-1VX1VWEJN1"
};


// Start Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// Get elements from index.html
const authForm = document.getElementById("authForm");
const registerBtn = document.getElementById("registerBtn");
const authMessage = document.getElementById("authMessage");
const authBtn = document.getElementById("authBtn");

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const logoutBtn = document.getElementById("logoutBtn");


// LOGIN
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  authMessage.textContent = "Signing in...";
  authBtn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    authMessage.textContent = "Login successful!";

  } catch (error) {
    console.error(error);

    authMessage.textContent = "Login failed: " + error.message;

  } finally {
    authBtn.disabled = false;
  }
});


// CREATE ACCOUNT
registerBtn.addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    authMessage.textContent =
      "Enter an email and password first.";

    return;
  }

  authMessage.textContent = "Creating account...";

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    authMessage.textContent =
      "Account created successfully!";

  } catch (error) {

    console.error(error);

    authMessage.textContent =
      "Could not create account: " + error.message;
  }
});


// CHECK LOGIN STATUS
onAuthStateChanged(auth, (user) => {

  if (user) {

    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");

  } else {

    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");

  }

});


// LOG OUT
logoutBtn.addEventListener("click", async () => {

  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }

});
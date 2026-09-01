// ========== EXERCISE 6: Change the navbar ==========

// 1. Change the id attribute from navBar to socialNetworkNavigation using setAttribute
const navBar = document.getElementById("navBar");
navBar.setAttribute("id", "socialNetworkNavigation");

// 2. Add a new <li> to the <ul>
// First, create a new <li> tag
const newLi = document.createElement("li");

// Create a new text node with "Logout"
const logoutText = document.createTextNode("Logout");

// Append the text node to the newly created list node
newLi.appendChild(logoutText);

// Finally, append this updated list node to the unordered list
const ul = document.querySelector("ul");
ul.appendChild(newLi);

// 3. Use firstElementChild and lastElementChild properties to retrieve the first and last <li> elements
const firstLi = ul.firstElementChild;
const lastLi = ul.lastElementChild;

// Display the text of each link using textContent
console.log("First link text: " + firstLi.textContent);
console.log("Last link text: " + lastLi.textContent);

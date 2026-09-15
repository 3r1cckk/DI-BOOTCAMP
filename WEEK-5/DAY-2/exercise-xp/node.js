"use strict";
/* ============================================================
   TypeScript Exercises 1–9
   Compile:  tsc exercises.ts
   Run:      node exercises.js
   ============================================================ */
/* ------------------------------------------------------------
   Exercise 1: Hello, World!
   ------------------------------------------------------------ */
const message = "Hello, World!";
console.log(message);
/* ------------------------------------------------------------
   Exercise 2: Type Annotations
   A variable's type is written after the colon. TypeScript will
   then refuse any value that doesn't match that type.
   ------------------------------------------------------------ */
const age = 25;
const personName = "Alice";
console.log(age); // 25
console.log(personName); // Alice
/* ------------------------------------------------------------
   Exercise 3: Union Types
   The | symbol means "either one type or the other".
   ------------------------------------------------------------ */
let id;
id = 101; // valid — it's a number
console.log(id);
id = "AB-101"; // also valid — it's a string
console.log(id);
/* ------------------------------------------------------------
   Exercise 4: Control Flow with if...else
   ------------------------------------------------------------ */
function checkNumber(value) {
    if (value > 0) {
        return "The number is positive";
    }
    else if (value < 0) {
        return "The number is negative";
    }
    else {
        return "The number is zero";
    }
}
console.log(checkNumber(10)); // The number is positive
console.log(checkNumber(-5)); // The number is negative
console.log(checkNumber(0)); // The number is zero
/* ------------------------------------------------------------
   Exercise 5: Tuple Types
   A tuple is an array with a FIXED length where each position
   has its own type: [string, number, string]
   ------------------------------------------------------------ */
function getDetails(name, age) {
    const greeting = `Hello, ${name}! You are ${age} years old.`;
    return [name, age, greeting];
}
const details = getDetails("Alice", 25);
console.log(details);
function createPerson(name, age) {
    return {
        name: name,
        age: age
    };
}
const person = createPerson("Bob", 30);
console.log(person); // { name: 'Bob', age: 30 }
/* ------------------------------------------------------------
   Exercise 7: Type Assertions
   document.getElementById() returns HTMLElement | null, which has
   no .value property. The "as" keyword tells TypeScript the more
   specific type so .value becomes available.

   NOTE: this only runs in a browser — see exercise7.html.
   The typeof check keeps it from crashing under plain Node.
   ------------------------------------------------------------ */
function setInputValue() {
    if (typeof document === "undefined") {
        console.log("Exercise 7 skipped: no DOM available (run it in the browser).");
        return;
    }
    // Type assertion: cast the generic element to an input element
    const inputElement = document.getElementById("username");
    inputElement.value = "Alice";
    console.log(inputElement.value); // Alice
}
setInputValue();
/* ------------------------------------------------------------
   Exercise 8: switch Statement
   Multiple case labels stacked together share one block, which
   is how you handle "complex" / grouped conditions.
   ------------------------------------------------------------ */
function getAction(role) {
    switch (role) {
        case "admin":
            return "Manage users and settings";
        case "editor":
            return "Edit content";
        case "viewer":
            return "View content";
        case "guest":
            return "Limited access";
        default:
            return "Invalid role";
    }
}
console.log(getAction("admin")); // Manage users and settings
console.log(getAction("editor")); // Edit content
console.log(getAction("viewer")); // View content
console.log(getAction("guest")); // Limited access
console.log(getAction("unknown")); // Invalid role
function greet(name = "Guest") {
    return `Hello, ${name}!`;
}
console.log(greet()); // Hello, Guest!
console.log(greet("Alice")); // Hello, Alice!
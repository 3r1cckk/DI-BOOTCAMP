// ===== EXERCISE 1: Divisible by three =====

let numbers = [123, 8409, 100053, 333333333, 7];

console.log("--- Exercise 1: Divisible by three ---");

// Loop through the array and check if each number is divisible by 3
for (let i = 0; i < numbers.length; i++) {
    console.log(numbers[i] % 3 === 0);
}

// ===== EXERCISE 2: Attendance =====

let guestList = {
    randy: "Germany",
    karla: "France",
    wendy: "Japan",
    norman: "England",
    sam: "Argentina",
};

console.log("\n--- Exercise 2: Attendance ---");

// 1. Prompt the student for their name
let studentName = prompt("What is your name?");

// 2 & 3. Check if name is in the object and console.log accordingly
if (studentName in guestList) {
    console.log(`"Hi! I'm ${studentName}, and I'm from ${guestList[studentName]}."`);
} else {
    console.log(`"Hi! I'm a guest."`);
}

// ===== EXERCISE 3: Playing with numbers =====

let age = [20, 5, 12, 43, 98, 55];

console.log("\n--- Exercise 3: Playing with numbers ---");

// 1. Console.log the sum of all numbers in the age array
let sum = 0;
for (let i = 0; i < age.length; i++) {
    sum += age[i];
}
console.log("Sum of all ages:", sum);

// 2. Console.log the highest age in the array
let highestAge = age[0]; // Start with the first element
for (let i = 1; i < age.length; i++) {
    if (age[i] > highestAge) {
        highestAge = age[i];
    }
}
console.log("Highest age:", highestAge);

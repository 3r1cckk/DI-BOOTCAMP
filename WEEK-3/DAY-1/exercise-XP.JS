// ===== EXERCISE 1: List of people =====

const people = ["Greg", "Mary", "Devon", "James"];

// Part I - Review about arrays

// 1. Remove "Greg" from the people array
people.shift();
console.log("After removing Greg:", people);

// 2. Replace "James" with "Jason"
people[people.length - 1] = "Jason";
console.log("After replacing James with Jason:", people);

// 3. Add your name to the end of the people array
people.push("YourName");
console.log("After adding YourName:", people);

// 4. Console.log Mary's index
console.log("Mary's index:", people.indexOf("Mary"));

// 5. Make a copy of the people array using slice (without Mary or YourName)
// people array should be: ["Mary", "Devon", "Jason", "YourName"]
// So we slice from index 1 to index 3
const peopleCopy = people.slice(1, 3);
console.log("Copy of people (without Mary and YourName):", peopleCopy);

// 6. Give the index of "Foo" - will return -1 because "Foo" is not in the array
console.log("Index of 'Foo':", people.indexOf("Foo"));
console.log("Why -1? Because 'Foo' is not found in the array");

// 7. Create a variable called 'last' which value is the last element of the array
const last = people[people.length - 1];
console.log("Last element:", last);

// Part II - Loops

// 1. Using a loop, iterate through the people array and console.log each person
console.log("\n--- Iterating through people array ---");
for (let i = 0; i < people.length; i++) {
    console.log(people[i]);
}

// 2. Using a loop, iterate through the people array and exit after logging "Devon"
console.log("\n--- Iterating until Devon ---");
for (let i = 0; i < people.length; i++) {
    console.log(people[i]);
    if (people[i] === "Devon") {
        break;
    }
}

// ===== EXERCISE 2: Your favorite colors =====

// 1. Create an array called colors with five favorite colors
const colors = ["blue", "red", "green", "purple", "orange"];

// 2. Loop through the array and console.log: "My #1 choice is blue", etc.
console.log("\n--- Exercise 2: Colors ---");
for (let i = 0; i < colors.length; i++) {
    console.log(`My #${i + 1} choice is ${colors[i]}`);
}

// 3. Bonus: Change to "My 1st choice", "My 2nd choice", etc.
console.log("\n--- Bonus: Colors with suffixes ---");
const suffixes = ["st", "nd", "rd", "th", "th"];
for (let i = 0; i < colors.length; i++) {
    console.log(`My ${i + 1}${suffixes[i]} choice is ${colors[i]}`);
}

// ===== EXERCISE 3: Repeat the question =====

console.log("\n--- Exercise 3: Repeat the question ---");
// 1. Prompt the user for a number
let userNumber = prompt("Enter a number:");
console.log("Type of input:", typeof userNumber);

// 2. While the number is smaller than 10, continue asking for a new number
// Using do...while loop (more relevant because we ask at least once)
do {
    userNumber = Number(userNumber);
    if (userNumber < 10) {
        userNumber = prompt("The number is smaller than 10. Enter a new number:");
    }
} while (Number(userNumber) < 10);

console.log("Final number:", userNumber);

// ===== EXERCISE 4: Building Management =====

const building = {
    numberOfFloors: 4,
    numberOfAptByFloor: {
        firstFloor: 3,
        secondFloor: 4,
        thirdFloor: 9,
        fourthFloor: 2,
    },
    nameOfTenants: ["Sarah", "Dan", "David"],
    numberOfRoomsAndRent: {
        sarah: [3, 990],
        dan: [4, 1000],
        david: [1, 500],
    },
};

console.log("\n--- Exercise 4: Building Management ---");

// 1. Copy and paste the above object (done above)

// 2. Console.log the number of floors in the building
console.log("Number of floors:", building.numberOfFloors);

// 3. Console.log how many apartments are on floors 1 and 3
console.log(
    "Apartments on floor 1 and 3:",
    building.numberOfAptByFloor.firstFloor + building.numberOfAptByFloor.thirdFloor
);

// 4. Console.log the name of the second tenant and the number of rooms
const secondTenant = building.nameOfTenants[1]; // Dan
const secondTenantRooms = building.numberOfRoomsAndRent[secondTenant.toLowerCase()][0];
console.log(
    `${secondTenant} has ${secondTenantRooms} rooms`
);

// 5. Check if sum of Sarah's and David's rent is bigger than Dan's rent
const sarahRent = building.numberOfRoomsAndRent.sarah[1]; // 990
const davidRent = building.numberOfRoomsAndRent.david[1]; // 500
const danRent = building.numberOfRoomsAndRent.dan[1]; // 1000
const sumSarahDavid = sarahRent + davidRent;

console.log(`Sarah's rent: $${sarahRent}, David's rent: $${davidRent}`);
console.log(`Sum of Sarah and David's rent: $${sumSarahDavid}`);
console.log(`Dan's rent: $${danRent}`);

if (sumSarahDavid > danRent) {
    building.numberOfRoomsAndRent.dan[1] = 1200;
    console.log("Sum is bigger! Dan's rent increased to $1200");
} else {
    console.log("Sum is not bigger than Dan's rent");
}

// ===== EXERCISE 5: Family =====

const family = {
    name: "Smith",
    mother: "Jane",
    father: "John",
    sister: "Emma",
    brother: "Michael",
};

console.log("\n--- Exercise 5: Family ---");

// 2. Using a for in loop, console.log the keys
console.log("Keys:");
for (let key in family) {
    console.log(key);
}

// 3. Using a for in loop, console.log the values
console.log("Values:");
for (let key in family) {
    console.log(family[key]);
}

// ===== EXERCISE 6: Rudolf =====

const details = {
    my: "name",
    is: "Rudolf",
    the: "reindeer",
};

console.log("\n--- Exercise 6: Rudolf ---");

// Using a for loop, console.log "my name is Rudolf the reindeer"
let sentence = "";
const keys = Object.keys(details);
for (let i = 0; i < keys.length; i++) {
    sentence += keys[i] + " " + details[keys[i]] + " ";
}
console.log(sentence.trim());

// ===== EXERCISE 7: Secret Group =====

const names = ["Jack", "Philip", "Sarah", "Amanda", "Bernard", "Kyle"];

console.log("\n--- Exercise 7: Secret Group ---");

// 1. Get first letter of each name and sort alphabetically
let secretSociety = names
    .map((name) => name[0]) // Get first letter
    .sort() // Sort alphabetically
    .join(""); // Join into a string

// 2. Console.log the name of their secret society
console.log("Secret Society Name:", secretSociety.toUpperCase());
// Output should be: ABJKPS

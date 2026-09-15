export {};
// ==========================================
// EXERCISE 1: Hello, World!
// ==========================================

console.log("Hello, World!");


// ==========================================
// EXERCISE 2: Type Annotations
// ==========================================

let age: number = 25;
let name: string = "Alice";

console.log(age);
console.log(name);


// ==========================================
// EXERCISE 3: Union Types
// ==========================================

let id: string | number;

id = "ABC123";
console.log(id);

id = 12345;
console.log(id);


// ==========================================
// EXERCISE 4: Control Flow with if...else
// ==========================================

function checkNumber(num: number): string {
  if (num > 0) {
    return "Positive";
  } else if (num < 0) {
    return "Negative";
  } else {
    return "Zero";
  }
}

console.log(checkNumber(10));
console.log(checkNumber(-5));
console.log(checkNumber(0));


// ==========================================
// EXERCISE 5: Tuple Types
// ==========================================

function getDetails(
  name: string,
  age: number
): [string, number, string] {
  const greeting = `Hello, ${name}! You are ${age} years old.`;

  return [name, age, greeting];
}

const details = getDetails("Alice", 25);

console.log(details);


// ==========================================
// EXERCISE 6: Object Type Annotations
// ==========================================

type Person = {
  name: string;
  age: number;
};

function createPerson(
  name: string,
  age: number
): Person {
  return {
    name: name,
    age: age
  };
}

const person = createPerson("Alice", 25);

console.log(person);


// ==========================================
// EXERCISE 7: Type Assertions
// ==========================================

const input = document.getElementById(
  "myInput"
) as HTMLInputElement;

if (input) {
  input.value = "Hello, TypeScript!";

  console.log(input.value);
}


// ==========================================
// EXERCISE 8: switch Statement
// ==========================================

function getAction(role: string): string {
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

console.log(getAction("admin"));
console.log(getAction("editor"));
console.log(getAction("viewer"));
console.log(getAction("guest"));
console.log(getAction("unknown"));


// ==========================================
// EXERCISE 9: Function Overloading
// ==========================================

function greet(): string;
function greet(name: string): string;

function greet(name: string = "Guest"): string {
  return `Hello, ${name}!`;
}

console.log(greet("Alice"));
console.log(greet());
// ==========================================
// EXERCISE 1: INTERSECTION TYPES + TYPE GUARDS
// ==========================================

interface User {
  name: string;
  email: string;
}

interface Admin {
  adminLevel: number;
}

// Combine User and Admin
type AdminUser = User & Admin;

// Function to get a property
function getProperty(
  obj: AdminUser,
  property: string
): unknown {
  if (property in obj) {
    return obj[property as keyof AdminUser];
  }

  return undefined;
}

// Test
const adminUser: AdminUser = {
  name: "John",
  email: "john@example.com",
  adminLevel: 5,
};

console.log("Exercise 1:");
console.log(getProperty(adminUser, "name"));
console.log(getProperty(adminUser, "email"));
console.log(getProperty(adminUser, "adminLevel"));
console.log(getProperty(adminUser, "age"));


// ==========================================
// EXERCISE 2: TYPE CASTING WITH GENERICS
// ==========================================

function castToType<T>(
  value: unknown,
  constructor: (value: unknown) => T
): T {
  return constructor(value);
}

// Cast string to number
const numberValue = castToType("123", Number);

// Cast string to boolean
const booleanValue = castToType("true", Boolean);

console.log("\nExercise 2:");
console.log(numberValue);
console.log(typeof numberValue);

console.log(booleanValue);
console.log(typeof booleanValue);


// ==========================================
// EXERCISE 3: TYPE ASSERTIONS + GENERIC CONSTRAINTS
// ==========================================

function getArrayLength<T extends number | string>(
  arr: T[]
): number {
  return arr.length;
}

// Test with number array
const numbers: number[] = [1, 2, 3, 4, 5];

// Test with string array
const strings: string[] = [
  "Hello",
  "TypeScript",
  "Generics",
];

console.log("\nExercise 3:");
console.log(getArrayLength(numbers));
console.log(getArrayLength(strings));


// ==========================================
// EXERCISE 4: GENERIC INTERFACES + CLASSES
// ==========================================

// Rename Storage to MyStorage
interface MyStorage<T> {
  add(item: T): void;
  get(index: number): T | undefined;
}

// Implement MyStorage interface
class Box<T> implements MyStorage<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }
}

// Box with numbers
const numberBox = new Box<number>();

numberBox.add(10);
numberBox.add(20);
numberBox.add(30);

// Box with strings
const stringBox = new Box<string>();

stringBox.add("Apple");
stringBox.add("Banana");
stringBox.add("Orange");

console.log("\nExercise 4:");

console.log(numberBox.get(0));
console.log(numberBox.get(1));

console.log(stringBox.get(0));
console.log(stringBox.get(2));
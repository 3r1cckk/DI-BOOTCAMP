// ==========================================
// EXERCISE 1: INTERSECTION TYPES
// ==========================================

type Person = {
  name: string;
  age: number;
};

type Address = {
  street: string;
  city: string;
};

type PersonWithAddress = Person & Address;

const person: PersonWithAddress = {
  name: "John",
  age: 25,
  street: "Moi Avenue",
  city: "Nairobi",
};

console.log("Exercise 1:", person);


// ==========================================
// EXERCISE 2: TYPE GUARDS WITH UNION TYPES
// ==========================================

function describeValue(value: number | string): string {
  if (typeof value === "number") {
    return "This is a number";
  } else {
    return "This is a string";
  }
}

console.log("Exercise 2:", describeValue(42));
console.log("Exercise 2:", describeValue("Hello"));


// ==========================================
// EXERCISE 3: TYPE CASTING
// ==========================================

let someValue: any = "Hello TypeScript";

let stringValue = someValue as string;

console.log("Exercise 3:", stringValue.toUpperCase());
console.log("Exercise 3:", stringValue.length);


// ==========================================
// EXERCISE 4: TYPE ASSERTIONS WITH UNION TYPES
// ==========================================

function getFirstElement(
  arr: (number | string)[]
): string {
  return arr[0] as string;
}

console.log(
  "Exercise 4:",
  getFirstElement(["Hello", 42, "World"])
);

console.log(
  "Exercise 4:",
  getFirstElement(["TypeScript", 100])
);


// ==========================================
// EXERCISE 5: GENERIC CONSTRAINTS
// ==========================================

function logLength<T extends { length: number }>(
  value: T
): void {
  console.log("Length:", value.length);
}

console.log("Exercise 5:");
logLength("Hello");
logLength([1, 2, 3, 4]);
logLength(["A", "B"]);


// ==========================================
// EXERCISE 6: INTERSECTION TYPES AND TYPE GUARDS
// ==========================================

type Manager = {
  position: "Manager";
  department: string;
};

type Developer = {
  position: "Developer";
  department: string;
};

type Job = Manager | Developer;

type Employee = Person & Job;

function describeEmployee(employee: Employee): string {
  if (employee.position === "Manager") {
    return `${employee.name} is a Manager in the ${employee.department} department.`;
  } else {
    return `${employee.name} is a Developer in the ${employee.department} department.`;
  }
}

const manager: Employee = {
  name: "Alice",
  age: 30,
  position: "Manager",
  department: "Human Resources",
};

const developer: Employee = {
  name: "Bob",
  age: 25,
  position: "Developer",
  department: "IT",
};

console.log("Exercise 6:", describeEmployee(manager));
console.log("Exercise 6:", describeEmployee(developer));


// ==========================================
// EXERCISE 7: TYPE ASSERTIONS AND GENERIC CONSTRAINTS
// ==========================================

function formatInput<T extends { toString(): string }>(
  input: T
): string {
  const stringValue = input.toString() as string;

  return `Formatted: ${stringValue}`;
}

console.log("Exercise 7:", formatInput("Hello"));
console.log("Exercise 7:", formatInput(123));
console.log("Exercise 7:", formatInput(true));
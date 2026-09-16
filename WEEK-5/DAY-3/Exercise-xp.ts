// ==========================================
// EXERCISE 1: Class with Access Modifiers
// ==========================================

class Employee {
  private name: string;
  private salary: number;
  public position: string;
  protected department: string;

  constructor(
    name: string,
    salary: number,
    position: string,
    department: string
  ) {
    this.name = name;
    this.salary = salary;
    this.position = position;
    this.department = department;
  }

  public getEmployeeInfo(): string {
    return `Name: ${this.name}, Position: ${this.position}`;
  }
}

// Create an Employee instance
const employee = new Employee(
  "John",
  50000,
  "Software Developer",
  "IT"
);

console.log(employee.getEmployeeInfo());
console.log(employee.position);

// Cannot access private or protected properties outside the class
// console.log(employee.name);       // Error
// console.log(employee.salary);     // Error
// console.log(employee.department); // Error


// ==========================================
// EXERCISE 2: Readonly Properties in a Class
// ==========================================

class Product {
  readonly id: number;
  public name: string;
  public price: number;

  constructor(
    id: number,
    name: string,
    price: number
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
  }

  public getProductInfo(): string {
    return `Product: ${this.name}, Price: ${this.price}`;
  }
}

// Create a Product instance
const product = new Product(1, "Laptop", 75000);

console.log(product.getProductInfo());

// Modify the name and price
product.name = "Gaming Laptop";
product.price = 85000;

console.log(product.getProductInfo());

// Readonly property cannot be modified after initialization
// product.id = 2; // Error: Cannot assign to 'id' because it is a read-only property.


// ==========================================
// EXERCISE 3: Class Inheritance
// ==========================================

class Animal {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public makeSound(): string {
    return "Animal makes a sound";
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name);
  }

  public override makeSound(): string {
    return "Bark";
  }
}

// Create a Dog instance
const dog = new Dog("Buddy");

console.log(`Dog's name: ${dog.name}`);
console.log(dog.makeSound());


// ==========================================
// EXERCISE 4: Static Properties and Methods
// ==========================================

class Calculator {
  public static add(a: number, b: number): number {
    return a + b;
  }

  public static subtract(a: number, b: number): number {
    return a - b;
  }
}

// Call static methods without creating an instance
console.log("Addition:", Calculator.add(10, 5));
console.log("Subtraction:", Calculator.subtract(10, 5));


// ==========================================
// EXERCISE 5: Interfaces with Optional and Readonly Properties
// ==========================================

interface User {
  readonly id: number;
  name: string;
  email: string;
}

interface PremiumUser extends User {
  membershipLevel?: string;
}

function printUserDetails(user: PremiumUser): void {
  console.log("User ID:", user.id);
  console.log("Name:", user.name);
  console.log("Email:", user.email);
  console.log("Membership Level:", user.membershipLevel ?? "Not specified");
}

// Create a PremiumUser object
const premiumUser: PremiumUser = {
  id: 101,
  name: "Alice",
  email: "alice@example.com",
  membershipLevel: "Gold"
};

// Call the function
printUserDetails(premiumUser);

// Readonly property cannot be changed
// premiumUser.id = 102; // Error
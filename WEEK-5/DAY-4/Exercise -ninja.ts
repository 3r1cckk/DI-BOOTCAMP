export {};
/* ==========================================
   EXERCISE 1: GENERICS + INTERSECTION TYPES
   ========================================== */

// Define two types
type Product = {
  id: number;
  name: string;
};

type Price = {
  amount: number;
  currency: string;
};

// Combine types using intersection
type ProductWithPrice = Product & Price;

// Generic Container class
class Container<T extends Product & Price> {
  private items: T[] = [];

  // Add item
  add(item: T): void {
    this.items.push(item);
  }

  // Remove item by ID
  remove(id: number): T | undefined {
    const index = this.items.findIndex(
      item => item.id === id
    );

    if (index === -1) {
      return undefined;
    }

    return this.items.splice(index, 1)[0];
  }

  // List all items
  list(): T[] {
    return [...this.items];
  }
}

// Test Exercise 1
const productContainer =
  new Container<ProductWithPrice>();

productContainer.add({
  id: 1,
  name: "Laptop",
  amount: 75000,
  currency: "KES"
});

productContainer.add({
  id: 2,
  name: "Phone",
  amount: 30000,
  currency: "KES"
});

console.log("Exercise 1 - All items:");
console.log(productContainer.list());

console.log("Exercise 1 - Removed:");
console.log(productContainer.remove(1));

console.log("Exercise 1 - Remaining:");
console.log(productContainer.list());


// ==========================================
// EXERCISE 2: GENERIC INTERFACES + CASTING
// ==========================================

// Generic API Response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Function to parse response
function parseResponse<T>(
  response: ApiResponse<unknown>
): T {
  return response.data as T;
}

// Test with a User type
type User = {
  id: number;
  name: string;
  email: string;
};

const userResponse: ApiResponse<unknown> = {
  success: true,
  data: {
    id: 1,
    name: "John",
    email: "john@example.com"
  },
  message: "User fetched successfully"
};

// Cast data to User
const user = parseResponse<User>(userResponse);

console.log("Exercise 2 - User:");
console.log(user);
console.log(user.name);
console.log(user.email);


// Test with Product
const productResponse: ApiResponse<unknown> = {
  success: true,
  data: {
    id: 10,
    name: "Laptop",
    amount: 75000
  },
  message: "Product fetched successfully"
};

type SimpleProduct = {
  id: number;
  name: string;
  amount: number;
};

const product =
  parseResponse<SimpleProduct>(productResponse);

console.log("Exercise 2 - Product:");
console.log(product);


// ==========================================
// EXERCISE 3: GENERIC CLASSES + ASSERTIONS
// ==========================================

// Generic Repository
class Repository<T> {
  private items: T[] = [];

  // Add item
  add(item: T): void {
    this.items.push(item);
  }

  // Retrieve item by index
  get(index: number): T | undefined {
    return this.items[index] as T | undefined;
  }

  // List all items
  list(): T[] {
    return [...this.items];
  }
}

// Test with numbers
const numberRepository = new Repository<number>();

numberRepository.add(10);
numberRepository.add(20);
numberRepository.add(30);

console.log("Exercise 3 - Numbers:");
console.log(numberRepository.get(0));
console.log(numberRepository.get(1));
console.log(numberRepository.list());


// Test with strings
const stringRepository = new Repository<string>();

stringRepository.add("Hello");
stringRepository.add("TypeScript");
stringRepository.add("Generics");

console.log("Exercise 3 - Strings:");
console.log(stringRepository.get(0));
console.log(stringRepository.get(1));
console.log(stringRepository.list());


// Test with objects
const userRepository = new Repository<User>();

userRepository.add({
  id: 1,
  name: "Alice",
  email: "alice@example.com"
});

userRepository.add({
  id: 2,
  name: "Bob",
  email: "bob@example.com"
});

console.log("Exercise 3 - Users:");
console.log(userRepository.get(0));
console.log(userRepository.list());
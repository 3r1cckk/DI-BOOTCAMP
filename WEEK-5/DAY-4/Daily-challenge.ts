export {};
/* ==========================================
   DAILY CHALLENGE: TYPE GUARD WITH UNION TYPES
   ========================================== */

// 1. Define the types

type User = {
  type: "user";
  name: string;
  age: number;
};

type Product = {
  type: "product";
  id: number;
  price: number;
};

type Order = {
  type: "order";
  orderId: string;
  amount: number;
};

// Union type
type Data = User | Product | Order;


// ==========================================
// 2. TYPE GUARDS
// ==========================================

// Check if data is a User
function isUser(data: Data): data is User {
  return data.type === "user";
}

// Check if data is a Product
function isProduct(data: Data): data is Product {
  return data.type === "product";
}

// Check if data is an Order
function isOrder(data: Data): data is Order {
  return data.type === "order";
}


// ==========================================
// 3. HANDLE DATA FUNCTION
// ==========================================

function handleData(data: Data[]): string[] {
  return data.map(item => {

    // Handle User
    if (isUser(item)) {
      return `Hello ${item.name}, you are ${item.age} years old.`;
    }

    // Handle Product
    if (isProduct(item)) {
      return `Product ID: ${item.id}, Price: ${item.price}`;
    }

    // Handle Order
    if (isOrder(item)) {
      return `Order ID: ${item.orderId}, Amount: ${item.amount}`;
    }

    // Unexpected case
    return "Unknown data type";
  });
}


// ==========================================
// 4. TEST THE FUNCTION
// ==========================================

const data: Data[] = [
  {
    type: "user",
    name: "John",
    age: 25
  },

  {
    type: "product",
    id: 101,
    price: 5000
  },

  {
    type: "order",
    orderId: "ORD001",
    amount: 15000
  },

  {
    type: "user",
    name: "Alice",
    age: 22
  },

  {
    type: "product",
    id: 102,
    price: 7500
  }
];

console.log(handleData(data));
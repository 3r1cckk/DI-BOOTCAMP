// ==========================================
// DAILY CHALLENGE: UNION TYPE VALIDATOR
// ==========================================

// Create a function to validate union types

function validateUnionType(
  value: any,
  allowedTypes: string[]
): boolean {

  // Loop through the allowed types
  for (let type of allowedTypes) {

    // Check if the value matches one of the allowed types
    if (typeof value === type) {
      return true;
    }
  }

  // Return false if no type matches
  return false;
}


// ==========================================
// TEST THE FUNCTION
// ==========================================

// Example 1: String
const value1 = "Hello";

console.log(
  validateUnionType(value1, ["string", "number"])
);
// Output: true


// Example 2: Number
const value2 = 25;

console.log(
  validateUnionType(value2, ["string", "number"])
);
// Output: true


// Example 3: Boolean
const value3 = true;

console.log(
  validateUnionType(value3, ["string", "number"])
);
// Output: false


// Example 4: Array
const value4 = [1, 2, 3];

console.log(
  validateUnionType(value4, ["object"])
);
// Output: true


// Example 5: Undefined
const value5 = undefined;

console.log(
  validateUnionType(value5, ["string", "number"])
);
// Output: false
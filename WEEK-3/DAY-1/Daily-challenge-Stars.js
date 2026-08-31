// ===== DAILY CHALLENGE: STARS PATTERN =====

console.log("--- Method 1: Single Loop ---\n");

// Approach 1: Using ONE loop
for (let i = 1; i <= 6; i++) {
    let stars = "";
    for (let j = 0; j < i; j++) {
        stars += "* ";
    }
    console.log(stars);
}

console.log("\n--- Method 2: Nested For Loops (Explicit) ---\n");

// Approach 2: Using TWO nested for loops (more explicit)
for (let row = 1; row <= 6; row++) {
    let line = "";
    for (let star = 0; star < row; star++) {
        line += "* ";
    }
    console.log(line);
}

console.log("\n--- Alternative: Nested Loops with Direct Console Log ---\n");

// Alternative approach: Using nested loops with direct console.log
for (let i = 1; i <= 6; i++) {
    let output = "";
    for (let j = 1; j <= i; j++) {
        output += "*";
        if (j < i) {
            output += " ";
        }
    }
    console.log(output);
}

console.log("\n--- Bonus: Using String Methods ---\n");

// Bonus approach: Using repeat() method
for (let i = 1; i <= 6; i++) {
    console.log("* ".repeat(i).trim());
}

console.log("\n--- Bonus: Configurable Pattern ---\n");

// Bonus: Make it configurable
function drawStarPattern(rows) {
    for (let row = 1; row <= rows; row++) {
        let pattern = "";
        for (let star = 0; star < row; star++) {
            pattern += "* ";
        }
        console.log(pattern);
    }
}

// Test with different number of rows
console.log("Pattern with 4 rows:");
drawStarPattern(4);

console.log("\nPattern with 8 rows:");
drawStarPattern(8);

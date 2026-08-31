// ===== EXERCISE 1: Checking the BMI =====

console.log("--- Exercise 1: Checking the BMI ---\n");

// Create first person object
const person1 = {
    fullName: "John Doe",
    mass: 75, // in kg
    height: 1.80, // in meters
    
    // Method to calculate BMI
    calculateBMI: function() {
        return this.mass / (this.height * this.height);
    }
};

// Create second person object
const person2 = {
    fullName: "Jane Smith",
    mass: 65, // in kg
    height: 1.65, // in meters
    
    // Method to calculate BMI
    calculateBMI: function() {
        return this.mass / (this.height * this.height);
    }
};

// Function to compare BMI of both persons
function compareBMI(person1, person2) {
    const bmi1 = person1.calculateBMI();
    const bmi2 = person2.calculateBMI();
    
    console.log(`${person1.fullName}'s BMI: ${bmi1.toFixed(2)}`);
    console.log(`${person2.fullName}'s BMI: ${bmi2.toFixed(2)}`);
    
    if (bmi1 > bmi2) {
        console.log(`\n${person1.fullName} has the largest BMI.`);
        return person1.fullName;
    } else if (bmi2 > bmi1) {
        console.log(`\n${person2.fullName} has the largest BMI.`);
        return person2.fullName;
    } else {
        console.log("\nBoth have the same BMI.");
        return "Same";
    }
}

// Call the comparison function
compareBMI(person1, person2);

// ===== EXERCISE 2: Grade Average =====

console.log("\n--- Exercise 2: Grade Average ---\n");

// Bonus solution: Two separate functions

// Function 1: Calculate the average
function calculateAverage(gradesList) {
    let sum = 0;
    for (let i = 0; i < gradesList.length; i++) {
        sum += gradesList[i];
    }
    return sum / gradesList.length;
}

// Function 2: Check if passed and display result
function checkGrade(average) {
    if (average > 65) {
        console.log(`Average: ${average.toFixed(2)} - You passed!`);
    } else {
        console.log(`Average: ${average.toFixed(2)} - You failed and must repeat the course.`);
    }
}

// Function that calls the other two (combines parts 1-4)
function findAvg(gradesList) {
    const average = calculateAverage(gradesList);
    checkGrade(average);
}

// Test the function
const studentGrades = [70, 60, 55, 80, 75];
findAvg(studentGrades);

const failingGrades = [45, 50, 55, 48];
findAvg(failingGrades);

// Alternative: Single function version (without bonus)
console.log("\n--- Alternative: Single function version ---\n");

function findAvgSingle(gradesList) {
    let sum = 0;
    for (let i = 0; i < gradesList.length; i++) {
        sum += gradesList[i];
    }
    
    const average = sum / gradesList.length;
    console.log(`Average: ${average.toFixed(2)}`);
    
    if (average > 65) {
        console.log("You passed!");
    } else {
        console.log("You failed and must repeat the course.");
    }
}

const grades1 = [85, 90, 75, 88];
findAvgSingle(grades1);

const grades2 = [50, 55, 45, 48];
findAvgSingle(grades2);

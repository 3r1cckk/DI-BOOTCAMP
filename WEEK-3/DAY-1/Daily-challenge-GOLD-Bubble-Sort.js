// ===== DAILY CHALLENGE GOLD: BUBBLE SORT =====

console.log("--- Bubble Sort Implementation ---\n");

// ===== BASIC BUBBLE SORT =====

function bubbleSort(arr) {
    // Create a copy to avoid modifying the original array
    const array = [...arr];
    const n = array.length;
    
    // Outer loop for each pass
    for (let i = 0; i < n - 1; i++) {
        // Inner loop for comparing adjacent elements
        for (let j = 0; j < n - i - 1; j++) {
            // If the current element is greater than the next element, swap them
            if (array[j] > array[j + 1]) {
                // Swap elements
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }
    }
    
    return array;
}

// Test the basic bubble sort
const testArray1 = [64, 34, 25, 12, 22, 11, 90];
console.log("Original array:", testArray1);
console.log("Sorted array:", bubbleSort(testArray1));
console.log();

// ===== BUBBLE SORT WITH OPTIMIZATION (Early Exit) =====

function bubbleSortOptimized(arr) {
    const array = [...arr];
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        
        for (let j = 0; j < n - i - 1; j++) {
            if (array[j] > array[j + 1]) {
                // Swap elements
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                swapped = true;
            }
        }
        
        // If no swaps occurred, array is already sorted
        if (!swapped) {
            console.log(`Array sorted after ${i + 1} passes`);
            break;
        }
    }
    
    return array;
}

console.log("--- Optimized Bubble Sort (Early Exit) ---\n");
const testArray2 = [5, 2, 8, 1, 9];
console.log("Original array:", testArray2);
console.log("Sorted array:", bubbleSortOptimized(testArray2));
console.log();

// ===== BUBBLE SORT WITH STEP-BY-STEP VISUALIZATION =====

function bubbleSortVisualized(arr) {
    const array = [...arr];
    const n = array.length;
    
    console.log("Initial array:", array.join(", "));
    console.log();
    
    for (let i = 0; i < n - 1; i++) {
        console.log(`--- Pass ${i + 1} ---`);
        
        for (let j = 0; j < n - i - 1; j++) {
            if (array[j] > array[j + 1]) {
                // Swap
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                console.log(`Swapped: Array is now [${array.join(", ")}]`);
            }
        }
        console.log();
    }
    
    return array;
}

console.log("--- Bubble Sort with Visualization ---\n");
const testArray3 = [5, 2, 8, 1];
console.log("Final sorted array:", bubbleSortVisualized(testArray3));
console.log();

// ===== BUBBLE SORT FOR STRINGS =====

function bubbleSortStrings(arr) {
    const array = [...arr];
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Compare strings alphabetically
            if (array[j] > array[j + 1]) {
                // Swap
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }
    }
    
    return array;
}

console.log("--- Bubble Sort with Strings ---\n");
const fruits = ["banana", "apple", "orange", "mango", "cherry"];
console.log("Original:", fruits);
console.log("Sorted:", bubbleSortStrings(fruits));
console.log();

// ===== BUBBLE SORT DESCENDING (LARGEST TO SMALLEST) =====

function bubbleSortDescending(arr) {
    const array = [...arr];
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Change > to < for descending order
            if (array[j] < array[j + 1]) {
                // Swap
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }
    }
    
    return array;
}

console.log("--- Bubble Sort Descending ---\n");
const testArray4 = [64, 34, 25, 12, 22, 11, 90];
console.log("Original:", testArray4);
console.log("Sorted (Descending):", bubbleSortDescending(testArray4));
console.log();

// ===== TIME COMPLEXITY =====
/*
Best Case: O(n) - when array is already sorted (with optimization)
Average Case: O(n²)
Worst Case: O(n²) - when array is sorted in reverse order

Space Complexity: O(1) - only uses constant extra space
*/

console.log("--- More Test Cases ---\n");
console.log("Empty array:", bubbleSort([]));
console.log("Single element:", bubbleSort([5]));
console.log("Already sorted:", bubbleSort([1, 2, 3, 4, 5]));
console.log("Reverse sorted:", bubbleSort([5, 4, 3, 2, 1]));
console.log("Duplicates:", bubbleSort([3, 1, 3, 1, 3]));

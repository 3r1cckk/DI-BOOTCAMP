// ========== EXERCISE 1: Random Number ==========
function randomNumberAndEvens() {
    // Get a random number between 1 and 100
    const randomNum = Math.floor(Math.random() * 100) + 1;
    console.log("Random number: " + randomNum);
    
    // Console.log all even numbers from 0 to the random number
    console.log("Even numbers from 0 to " + randomNum + ":");
    for (let i = 0; i <= randomNum; i++) {
        if (i % 2 === 0) {
            console.log(i);
        }
    }
}

// Test Exercise 1
randomNumberAndEvens();


// ========== EXERCISE 2: Capitalized letters ==========
function capitalize(str) {
    let evenCapitalized = '';
    let oddCapitalized = '';
    
    // Loop through each character
    for (let i = 0; i < str.length; i++) {
        // Even indexes capitalized
        if (i % 2 === 0) {
            evenCapitalized += str[i].toUpperCase();
        } else {
            evenCapitalized += str[i];
        }
        
        // Odd indexes capitalized
        if (i % 2 === 1) {
            oddCapitalized += str[i].toUpperCase();
        } else {
            oddCapitalized += str[i];
        }
    }
    
    return [evenCapitalized, oddCapitalized];
}

// Test Exercise 2
console.log(capitalize("abcdef")); // --> ['AbCdEf', 'aBcDeF']


// ========== EXERCISE 3: Is palindrome? ==========
function isPalindrome(str) {
    // Remove spaces and convert to lowercase
    const cleanStr = str.toLowerCase().replace(/\s/g, '');
    
    // Reverse the string
    const reversedStr = cleanStr.split('').reverse().join('');
    
    // Check if the string is equal to its reverse
    return cleanStr === reversedStr;
}

// Test Exercise 3
console.log(isPalindrome("madam")); // --> true
console.log(isPalindrome("bob")); // --> true
console.log(isPalindrome("kayak")); // --> true
console.log(isPalindrome("hello")); // --> false
console.log(isPalindrome("A man a plan a canal Panama")); // --> true


// ========== EXERCISE 4: Biggest Number ==========
function biggestNumberInArray(arrayNumber) {
    let biggest = 0;
    
    for (let i = 0; i < arrayNumber.length; i++) {
        // Check if the element is a number
        if (typeof arrayNumber[i] === 'number') {
            if (arrayNumber[i] > biggest) {
                biggest = arrayNumber[i];
            }
        }
    }
    
    return biggest;
}

// Test Exercise 4
const array = [-1, 0, 3, 100, 99, 2, 99]; // should return 100
const array2 = ['a', 3, 4, 2]; // should return 4
const array3 = []; // should return 0

console.log(biggestNumberInArray(array)); // --> 100
console.log(biggestNumberInArray(array2)); // --> 4
console.log(biggestNumberInArray(array3)); // --> 0


// ========== EXERCISE 5: Unique Elements ==========
function getUnique(arr) {
    const uniqueArray = [];
    
    for (let i = 0; i < arr.length; i++) {
        // Check if the element is not already in the unique array
        if (!uniqueArray.includes(arr[i])) {
            uniqueArray.push(arr[i]);
        }
    }
    
    return uniqueArray;
}

// Alternative using Set (more efficient)
function getUniqueWithSet(arr) {
    return [...new Set(arr)];
}

// Test Exercise 5
console.log(getUnique([1, 2, 3, 3, 3, 3, 4, 5])); // --> [1, 2, 3, 4, 5]
console.log(getUnique([1, 1, 1, 1, 2, 2, 3])); // --> [1, 2, 3]
console.log(getUniqueWithSet([1, 2, 3, 3, 3, 3, 4, 5])); // --> [1, 2, 3, 4, 5]


// ========== EXERCISE 6: Calendar ==========
function createCalendar(year, month) {
    // Create a table element
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    
    // Create header row with day names
    const headerRow = document.createElement('tr');
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < dayNames.length; i++) {
        const th = document.createElement('th');
        th.textContent = dayNames[i];
        th.style.border = '1px solid black';
        th.style.padding = '5px 10px';
        th.style.backgroundColor = '#e0e0e0';
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);
    
    // Get the first day of the month
    const date = new Date(year, month - 1, 1);
    const firstDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Adjust so that Monday is 0
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Get the number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Create rows for the calendar
    let dayCounter = 1;
    let currentRow = document.createElement('tr');
    
    // Add empty cells before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
        const td = document.createElement('td');
        td.style.border = '1px solid black';
        td.style.padding = '5px 10px';
        td.style.width = '40px';
        td.style.height = '40px';
        td.style.textAlign = 'center';
        currentRow.appendChild(td);
    }
    
    // Add days of the month
    for (let i = adjustedFirstDay; i < 7 && dayCounter <= daysInMonth; i++) {
        const td = document.createElement('td');
        td.textContent = dayCounter;
        td.style.border = '1px solid black';
        td.style.padding = '5px 10px';
        td.style.width = '40px';
        td.style.height = '40px';
        td.style.textAlign = 'center';
        currentRow.appendChild(td);
        dayCounter++;
    }
    table.appendChild(currentRow);
    
    // Continue adding weeks
    while (dayCounter <= daysInMonth) {
        currentRow = document.createElement('tr');
        for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
            const td = document.createElement('td');
            td.textContent = dayCounter;
            td.style.border = '1px solid black';
            td.style.padding = '5px 10px';
            td.style.width = '40px';
            td.style.height = '40px';
            td.style.textAlign = 'center';
            currentRow.appendChild(td);
            dayCounter++;
        }
        table.appendChild(currentRow);
    }
    
    // Append the table to the body
    document.body.appendChild(table);
    
    return table;
}

// Uncomment to test Exercise 6 (requires HTML document with body)
// createCalendar(2012, 9);
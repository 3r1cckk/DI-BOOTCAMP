// ========== EXERCISE 1: is_Blank ==========
function isBlank(str) {
    return str === '';
}

// Test Exercise 1
console.log(isBlank('')); // --> true
console.log(isBlank('abc')); // --> false


// ========== EXERCISE 2: Abbrev_name ==========
function abbrevName(name) {
    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts[1];
    return firstName + ' ' + lastName[0].toUpperCase() + '.';
}

// Test Exercise 2
console.log(abbrevName("Robin Singh")); // --> "Robin S."


// ========== EXERCISE 3: SwapCase ==========
function swapCase(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === char.toUpperCase()) {
            result += char.toLowerCase();
        } else {
            result += char.toUpperCase();
        }
    }
    return result;
}

// Test Exercise 3
console.log(swapCase('The Quick Brown Fox')); // --> 'tHE qUICK bROWN fOX'


// ========== EXERCISE 4: Omnipresent value ==========
function isOmnipresent(arr, value) {
    for (let i = 0; i < arr.length; i++) {
        let found = false;
        for (let j = 0; j < arr[i].length; j++) {
            if (arr[i][j] === value) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
}

// Test Exercise 4
console.log(isOmnipresent([[1, 1], [1, 3], [5, 1], [6, 1]], 1)); // ➞ true
console.log(isOmnipresent([[1, 1], [1, 3], [5, 1], [6, 1]], 6)); // ➞ false
console.log(isOmnipresent([[3, 4], [8, 3, 2], [3], [9, 3], [5, 3], [4, 3]], 3)); // ➞ true


// ========== EXERCISE 5: Red table ==========
// HTML NEEDED (see below for complete HTML structure):
// <table>
//   <tr>
//     <td>1:1</td>
//     <td>2:1</td>
//     ...
//   </tr>
//   ...
// </table>

function setupRedTable() {
    let table = document.body.firstElementChild;
    
    // Get all rows in the table
    const rows = table.getElementsByTagName('tr');
    
    // Loop through each row
    for (let i = 0; i < rows.length; i++) {
        // Get all cells in the current row
        const cells = rows[i].getElementsByTagName('td');
        
        // Loop through each cell
        for (let j = 0; j < cells.length; j++) {
            // Color diagonal cells in red
            // Diagonal means row index === cell index
            if (i === j) {
                cells[j].style.backgroundColor = 'red';
            }
        }
    }
}

// Uncomment to test Exercise 5 (requires the table HTML to be present)
// setupRedTable();

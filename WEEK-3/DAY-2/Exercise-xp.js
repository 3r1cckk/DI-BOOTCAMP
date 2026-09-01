// ========== EXERCISE 1: Find the numbers divisible by 23 ==========
function displayNumbersDivisible(divisor = 23) {
    let sum = 0;
    let numbers = [];
    
    for (let i = 0; i <= 500; i++) {
        if (i % divisor === 0) {
            numbers.push(i);
            sum += i;
        }
    }
    
    console.log(numbers.join(" "));
    console.log("Sum: " + sum);
}

// Test Exercise 1
displayNumbersDivisible();
displayNumbersDivisible(3);
displayNumbersDivisible(45);


// ========== EXERCISE 2: Shopping List ==========
const stock = {
    "banana": 6,
    "apple": 0,
    "pear": 12,
    "orange": 32,
    "blueberry": 1
};

const prices = {
    "banana": 4,
    "apple": 2,
    "pear": 1,
    "orange": 1.5,
    "blueberry": 10
};

const shoppingList = ["banana", "orange", "apple"];

function myBill() {
    let total = 0;
    
    for (let i = 0; i < shoppingList.length; i++) {
        let item = shoppingList[i];
        
        // Check if item is in stock
        if (item in stock && stock[item] > 0) {
            total += prices[item];
            // Bonus: decrease stock by 1
            stock[item]--;
        }
    }
    
    return total;
}

// Test Exercise 2
console.log("Shopping Bill: $" + myBill());
console.log("Updated Stock:", stock);


// ========== EXERCISE 3: What's in my wallet? ==========
function changeEnough(itemPrice, amountOfChange) {
    // Coin values: quarters, dimes, nickels, pennies
    const coinValues = [0.25, 0.10, 0.05, 0.01];
    let totalChange = 0;
    
    // Calculate total change
    for (let i = 0; i < amountOfChange.length; i++) {
        totalChange += amountOfChange[i] * coinValues[i];
    }
    
    // Round to 2 decimal places to avoid floating point issues
    totalChange = Math.round(totalChange * 100) / 100;
    
    return totalChange >= itemPrice;
}

// Test Exercise 3
console.log(changeEnough(4.25, [25, 20, 5, 0])); // true
console.log(changeEnough(14.11, [2, 100, 0, 0])); // false
console.log(changeEnough(0.75, [0, 0, 20, 5])); // true


// ========== EXERCISE 4: Vacations Costs ==========
function hotelCost() {
    let nights;
    while (true) {
        nights = prompt("How many nights would you like to stay in the hotel?");
        if (nights && !isNaN(nights) && nights > 0) {
            return nights * 140;
        }
        alert("Please enter a valid number of nights.");
    }
}

function planeRideCost() {
    let destination;
    while (true) {
        destination = prompt("What is your destination?");
        if (destination && typeof destination === "string" && destination.trim().length > 0) {
            break;
        }
        alert("Please enter a valid destination.");
    }
    
    switch (destination.toLowerCase()) {
        case "london":
            return 183;
        case "paris":
            return 220;
        default:
            return 300;
    }
}

function rentalCarCost() {
    let days;
    while (true) {
        days = prompt("How many days would you like to rent the car?");
        if (days && !isNaN(days) && days > 0) {
            break;
        }
        alert("Please enter a valid number of days.");
    }
    
    days = parseInt(days);
    let cost = days * 40;
    
    // Apply 5% discount if renting for more than 10 days
    if (days > 10) {
        cost *= 0.95;
    }
    
    return cost;
}

function totalVacationCost() {
    const hotelPrice = hotelCost();
    const planePrice = planeRideCost();
    const carPrice = rentalCarCost();
    
    const total = hotelPrice + planePrice + carPrice;
    
    console.log("The car cost: $" + carPrice.toFixed(2));
    console.log("The hotel cost: $" + hotelPrice.toFixed(2));
    console.log("The plane tickets cost: $" + planePrice.toFixed(2));
    console.log("Total vacation cost: $" + total.toFixed(2));
    
    return total;
}

// Uncomment to test Exercise 4 (requires user input)
// totalVacationCost();


// ========== EXERCISE 5: Users ==========
// HTML NEEDED:
// <div id="container">Users:</div>
// <ul class="list">
//     <li>John</li>
//     <li>Pete</li>
// </ul>
// <ul class="list">
//     <li>David</li>
//     <li>Sarah</li>
//     <li>Dan</li>
// </ul>

function setupExercise5() {
    // 1. Retrieve the div and console.log it
    const container = document.getElementById("container");
    console.log(container);

    // 2. Change the name "Pete" to "Richard"
    const allLis = document.querySelectorAll("li");
    for (let i = 0; i < allLis.length; i++) {
        if (allLis[i].textContent === "Pete") {
            allLis[i].textContent = "Richard";
        }
    }

    // 3. Delete the second <li> of the second <ul>
    const allUls = document.querySelectorAll("ul.list");
    const secondUl = allUls[1];
    const secondLiOfSecondUl = secondUl.children[1];
    secondLiOfSecondUl.remove();

    // 4. Change the name of the first <li> of each <ul> to your name
    for (let i = 0; i < allUls.length; i++) {
        const firstLi = allUls[i].firstElementChild;
        firstLi.textContent = "YourName";
    }

    // 5. Add a class called student_list to both of the <ul>'s
    for (let i = 0; i < allUls.length; i++) {
        allUls[i].classList.add("student_list");
    }

    // 6. Add the classes university and attendance to the first <ul>
    allUls[0].classList.add("university", "attendance");

    // 7. Add a "light blue" background color and some padding to the <div>
    container.style.backgroundColor = "lightblue";
    container.style.padding = "20px";

    // 8. Do not display the <li> that contains the text node "Dan"
    const allLisAgain = document.querySelectorAll("li");
    for (let i = 0; i < allLisAgain.length; i++) {
        if (allLisAgain[i].textContent === "Dan") {
            allLisAgain[i].style.display = "none";
        }
    }

    // 9. Add a border to the <li> that contains the text node "Richard"
    for (let i = 0; i < allLisAgain.length; i++) {
        if (allLisAgain[i].textContent === "Richard") {
            allLisAgain[i].style.border = "2px solid black";
        }
    }

    // 10. Change the font size of the whole body
    document.body.style.fontSize = "18px";

    // Bonus: If the background color of the div is "light blue", alert "Hello x and y"
    if (container.style.backgroundColor === "lightblue") {
        const firstUlNames = allUls[0].querySelectorAll("li");
        const names = [];
        firstUlNames.forEach(li => {
            if (li.style.display !== "none") {
                names.push(li.textContent);
            }
        });
        alert("Hello " + names.join(" and "));
    }
}

// Uncomment to test Exercise 5
// setupExercise5();


// ========== EXERCISE 6: Change the navbar ==========
// HTML NEEDED:
// <div id="navBar">
//     <ul>
//         <li><a href="#">Profile</a></li>
//         <li><a href="#">Home</a></li>
//         <li><a href="#">My Friends</a></li>
//         <li><a href="#">Messenger</a></li>
//         <li><a href="#">My Pics</a></li>
//     </ul>
// </div>

function setupExercise6() {
    // 1. Change the id attribute from navBar to socialNetworkNavigation using setAttribute
    const navBar = document.getElementById("navBar");
    navBar.setAttribute("id", "socialNetworkNavigation");

    // 2. Add a new <li> to the <ul>
    // First, create a new <li> tag
    const newLi = document.createElement("li");

    // Create a new text node with "Logout"
    const logoutText = document.createTextNode("Logout");

    // Append the text node to the newly created list node
    newLi.appendChild(logoutText);

    // Finally, append this updated list node to the unordered list
    const ul = document.querySelector("ul");
    ul.appendChild(newLi);

    // 3. Use firstElementChild and lastElementChild properties to retrieve the first and last <li> elements
    const firstLi = ul.firstElementChild;
    const lastLi = ul.lastElementChild;

    // Display the text of each link using textContent
    console.log("First link text: " + firstLi.textContent);
    console.log("Last link text: " + lastLi.textContent);
}

// Uncomment to test Exercise 6
// setupExercise6();


// ========== EXERCISE 7: My Book List ==========
// HTML NEEDED:
// <section class="listBooks"></section>

// CSS NEEDED (optional):
// .book {
//     border: 1px solid #ccc;
//     padding: 10px;
//     margin: 10px 0;
//     border-radius: 5px;
// }
// .book img {
//     width: 100px;
//     margin-right: 10px;
// }
// .alreadyRead {
//     color: red;
// }

function setupExercise7() {
    // Create an array of book objects
    const allBooks = [
        {
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            image: "https://images-na.ssl-images-amazon.com/images/P/0547928270.01.L.jpg",
            alreadyRead: true
        },
        {
            title: "Harry Potter and the Sorcerer's Stone",
            author: "J.K. Rowling",
            image: "https://images-na.ssl-images-amazon.com/images/P/0590353403.01.L.jpg",
            alreadyRead: false
        }
    ];

    // Get the section where we'll render the books
    const listBooksSection = document.querySelector(".listBooks");

    // Loop through each book and render it
    allBooks.forEach(book => {
        // Create a div for the book
        const bookDiv = document.createElement("div");
        bookDiv.classList.add("book");
        
        // Create and add the image
        const bookImage = document.createElement("img");
        bookImage.src = book.image;
        bookImage.alt = book.title;
        bookDiv.appendChild(bookImage);
        
        // Create and add the book details (title and author)
        const bookDetails = document.createElement("p");
        bookDetails.textContent = book.title + " written by " + book.author;
        
        // If the book is already read, set the color to red
        if (book.alreadyRead) {
            bookDetails.classList.add("alreadyRead");
        }
        
        bookDiv.appendChild(bookDetails);
        
        // Append the book div to the section
        listBooksSection.appendChild(bookDiv);
    });
}

// Uncomment to test Exercise 7
// setupExercise7();

// ========== EXERCISE 7: My Book List ==========

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

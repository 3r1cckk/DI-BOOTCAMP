
export {};

// ==========================================
// INTERFACE: Book
// ==========================================

interface Book {
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  genre?: string;
}


// ==========================================
// CLASS: Library
// ==========================================

class Library {
  private books: Book[] = [];

  // Add a new book
  public addBook(book: Book): void {
    this.books.push(book);
  }

  // Get book details using ISBN
  public getBookDetails(isbn: string): string {
    const book = this.books.find(
      (book) => book.isbn === isbn
    );

    if (!book) {
      return "Book not found";
    }

    return `
Title: ${book.title}
Author: ${book.author}
ISBN: ${book.isbn}
Published Year: ${book.publishedYear}
Genre: ${book.genre ?? "Not specified"}
`;
  }
}


// ==========================================
// CLASS: DigitalLibrary
// ==========================================

class DigitalLibrary extends Library {
  public readonly website: string;

  constructor(website: string) {
    super();
    this.website = website;
  }

  // List all book titles
  public listBooks(): string[] {
    // We cannot access private books directly.
    // Instead, we use a separate list to track titles.
    return [];
  }
}


// ==========================================
// IMPROVED DIGITAL LIBRARY
// ==========================================

class OnlineLibrary extends Library {
  public readonly website: string;

  private digitalBooks: Book[] = [];

  constructor(website: string) {
    super();
    this.website = website;
  }

  public override addBook(book: Book): void {
    super.addBook(book);
    this.digitalBooks.push(book);
  }

  public listBooks(): string[] {
    return this.digitalBooks.map(
      (book) => book.title
    );
  }
}


// ==========================================
// CREATE DIGITAL LIBRARY INSTANCE
// ==========================================

const digitalLibrary = new OnlineLibrary(
  "https://mylibrary.com"
);


// ==========================================
// ADD BOOKS
// ==========================================

digitalLibrary.addBook({
  title: "Things Fall Apart",
  author: "Chinua Achebe",
  isbn: "9780385474542",
  publishedYear: 1958,
  genre: "Historical Fiction"
});

digitalLibrary.addBook({
  title: "The Alchemist",
  author: "Paulo Coelho",
  isbn: "9780061122415",
  publishedYear: 1988,
  genre: "Adventure"
});

digitalLibrary.addBook({
  title: "Atomic Habits",
  author: "James Clear",
  isbn: "9780735211292",
  publishedYear: 2018
});


// ==========================================
// PRINT BOOK DETAILS
// ==========================================

console.log("================================");
console.log("DIGITAL LIBRARY");
console.log("================================");

console.log("Website:", digitalLibrary.website);

console.log("\nBOOK 1");
console.log(
  digitalLibrary.getBookDetails("9780385474542")
);

console.log("\nBOOK 2");
console.log(
  digitalLibrary.getBookDetails("9780061122415")
);

console.log("\nBOOK 3");
console.log(
  digitalLibrary.getBookDetails("9780735211292")
);


// ==========================================
// PRINT ALL BOOK TITLES
// ==========================================

console.log("\nALL BOOK TITLES");

console.log(
  digitalLibrary.listBooks()
);
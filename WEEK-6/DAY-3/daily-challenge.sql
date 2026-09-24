-- ==========================================
-- PART I: ONE-TO-ONE RELATIONSHIP
-- ==========================================

-- 1. Create Tables
CREATE TABLE Customer (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

CREATE TABLE Customer_Profile (
    id SERIAL PRIMARY KEY,
    isLoggedIn BOOLEAN DEFAULT false,
    customer_id INTEGER UNIQUE REFERENCES Customer(id) ON DELETE CASCADE
);

-- 2. Insert Data
INSERT INTO Customer (first_name, last_name) VALUES 
('John', 'Doe'),
('Jerome', 'Lalu'),
('Lea', 'Rive');

INSERT INTO Customer_Profile (isLoggedIn, customer_id) 
VALUES 
(true, (SELECT id FROM Customer WHERE first_name = 'John')),
(false, (SELECT id FROM Customer WHERE first_name = 'Jerome'));

-- 3. Queries
-- The first_name of the LoggedIn customers
SELECT c.first_name 
FROM Customer c
JOIN Customer_Profile cp ON c.id = cp.customer_id
WHERE cp.isLoggedIn = true;

-- All customers first_name and isLoggedIn columns
SELECT c.first_name, cp.isLoggedIn
FROM Customer c
LEFT JOIN Customer_Profile cp ON c.id = cp.customer_id;

-- The number of customers that are not LoggedIn
SELECT COUNT(*) 
FROM Customer c
LEFT JOIN Customer_Profile cp ON c.id = cp.customer_id
WHERE cp.isLoggedIn IS NOT TRUE;


-- ==========================================
-- PART II: MANY-TO-MANY RELATIONSHIP
-- ==========================================

-- 1. Create Tables
CREATE TABLE Book (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL
);

CREATE TABLE Student (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    age INTEGER CHECK (age <= 15)
);

CREATE TABLE Library (
    book_fk_id INTEGER REFERENCES Book(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    student_fk_id INTEGER REFERENCES Student(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    borrowed_date DATE,
    PRIMARY KEY (book_fk_id, student_fk_id)
);

-- 2. Insert Data
INSERT INTO Book (title, author) VALUES 
('Alice In Wonderland', 'Lewis Carroll'),
('Harry Potter', 'J.K Rowling'),
('To kill a mockingbird', 'Harper Lee');

INSERT INTO Student (name, age) VALUES 
('John', 12),
('Lera', 11),
('Patrick', 10),
('Bob', 14);

-- Insert into Junction Table using Subqueries
INSERT INTO Library (student_fk_id, book_fk_id, borrowed_date) VALUES 
((SELECT student_id FROM Student WHERE name = 'John'), (SELECT book_id FROM Book WHERE title = 'Alice In Wonderland'), '2022-02-15'),
((SELECT student_id FROM Student WHERE name = 'Bob'), (SELECT book_id FROM Book WHERE title = 'To kill a mockingbird'), '2021-03-03'),
((SELECT student_id FROM Student WHERE name = 'Lera'), (SELECT book_id FROM Book WHERE title = 'Alice In Wonderland'), '2021-05-23'),
((SELECT student_id FROM Student WHERE name = 'Bob'), (SELECT book_id FROM Book WHERE title = 'Harry Potter'), '2021-08-12');

-- 3. Display Data
-- Select all columns from the junction table
SELECT * FROM Library;

-- Select the name of the student and the title of the borrowed books
SELECT s.name, b.title
FROM Library l
JOIN Student s ON l.student_fk_id = s.student_id
JOIN Book b ON l.book_fk_id = b.book_id;

-- Select the average age of the children that borrowed 'Alice In Wonderland'
SELECT AVG(s.age) 
FROM Student s
JOIN Library l ON s.student_id = l.student_fk_id
JOIN Book b ON l.book_fk_id = b.book_id
WHERE b.title = 'Alice In Wonderland';

-- 4. Testing Cascading Delete
DELETE FROM Student WHERE name = 'John';

-- Verification (John's records in Library will be gone automatically)
SELECT * FROM Library;
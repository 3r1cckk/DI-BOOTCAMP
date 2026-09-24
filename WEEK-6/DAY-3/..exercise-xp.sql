-- DVD Rental Database Exercises
-- Exercises 1 & 2 combined

-- These tables are created by this exercise, so remove old copies before rerunning.
DROP TABLE IF EXISTS customer_review;
DROP TABLE IF EXISTS new_film CASCADE;

-----------------------------------------------------------
-- 🌟 Exercise 1: Table Creation and Relationships
-----------------------------------------------------------

-- 1. Get all languages
SELECT * FROM language;

-- 2. Films joined with languages (Title, Description, Language Name)
SELECT f.title, f.description, l.name AS language_name
FROM film f
INNER JOIN language l ON f.language_id = l.language_id;

-- 3. All languages including those without films (Left Join)
SELECT f.title, f.description, l.name AS language_name
FROM language l
LEFT JOIN film f ON l.language_id = f.language_id;

-- 4. Create new_film table
CREATE TABLE new_film (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Populate new_film
INSERT INTO new_film (name) 
VALUES ('Inception'), ('The Matrix'), ('Interstellar');

-- 5. Create customer_review table
-- Includes ON DELETE CASCADE to satisfy the deletion constraint
CREATE TABLE customer_review (
    review_id SERIAL PRIMARY KEY,
    film_id INTEGER NOT NULL REFERENCES new_film(id) ON DELETE CASCADE,
    language_id INTEGER NOT NULL REFERENCES language(language_id),
    title VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    review_text TEXT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add movie reviews (linking to valid IDs)
INSERT INTO customer_review (film_id, language_id, title, score, review_text)
VALUES 
(1, 1, 'Masterpiece', 10, 'A mind-bending journey through dreams.'),
(2, 1, 'Groundbreaking', 9, 'Changed the way we look at action cinema.');

-- 7. Demonstrate Deletion Constraint
-- When 'Inception' (ID 1) is deleted, the associated review is also removed automatically.
DELETE FROM new_film WHERE name = 'Inception';


-----------------------------------------------------------
-- 🌟 Exercise 2: Updates and Complex Queries
-----------------------------------------------------------

-- 1. Update language of specific films
UPDATE film 
SET language_id = 2 
WHERE film_id BETWEEN 10 AND 15;

-- 2. Drop the review table (Easy since it's a child table)
DROP TABLE IF EXISTS customer_review;

-- 3. Outstanding rentals (Not yet returned)
SELECT COUNT(*) AS outstanding_rentals
FROM rental 
WHERE return_date IS NULL;

-- 4. 30 most expensive outstanding movies
SELECT f.title, f.replacement_cost
FROM film f
JOIN inventory i ON f.film_id = i.film_id
JOIN rental r ON i.inventory_id = r.inventory_id
WHERE r.return_date IS NULL
ORDER BY f.replacement_cost DESC
LIMIT 30;

-- 5. Find specific movies based on descriptions:

-- First: Sumo wrestler + Penelope Monroe
SELECT f.title 
FROM film f
JOIN film_actor fa ON f.film_id = fa.film_id
JOIN actor a ON fa.actor_id = a.actor_id
WHERE f.description ILIKE '%sumo wrestler%'
AND a.first_name = 'Penelope' AND a.last_name = 'Monroe';

-- Second: Short R-rated documentary (< 1hr)
SELECT f.title 
FROM film f
JOIN film_category fc ON f.film_id = fc.film_id
JOIN category c ON fc.category_id = c.category_id
WHERE f.length < 60 
AND f.rating = 'R' 
AND c.name = 'Documentary';

-- Third: Matthew Mahan, Price > $4, Returned late July/Early Aug 2005
SELECT f.title
FROM film f
JOIN inventory i ON f.film_id = i.film_id
JOIN rental r ON i.inventory_id = r.inventory_id
JOIN customer c ON r.customer_id = c.customer_id
JOIN payment p ON r.rental_id = p.rental_id
WHERE c.first_name = 'Matthew' AND c.last_name = 'Mahan'
AND p.amount > 4.00
AND r.return_date BETWEEN '2005-07-28 00:00:00' AND '2005-08-01 23:59:59';

-- Fourth: Matthew Mahan, "boat" in description, expensive replacement
SELECT f.title, f.replacement_cost
FROM film f
JOIN inventory i ON f.film_id = i.film_id
JOIN rental r ON i.inventory_id = r.inventory_id
JOIN customer c ON r.customer_id = c.customer_id
WHERE c.first_name = 'Matthew' AND c.last_name = 'Mahan'
AND f.title ILIKE '%boat%' OR f.description ILIKE '%boat%'
ORDER BY f.replacement_cost DESC
LIMIT 1;


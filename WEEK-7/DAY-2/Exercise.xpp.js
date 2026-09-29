const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

// --- MOCK DATABASE (Representing your two tables) ---
const db = {
    users: [],    // Table: id, email, username, first_name, last_name
    hashpwd: []   // Table: id, username, password
};

// --- ROUTES ---

/**
 * POST /register
 * Requirement: Use transaction to add a user to two tables
 */
app.post('/register', async (req, res) => {
    const { email, username, first_name, last_name, password } = req.body;

    try {
        // 1. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Simulate a Transaction
        const userId = db.users.length + 1;

        // Atomic Operation: Both must succeed
        const newUser = { id: userId, email, username, first_name, last_name };
        const newHash = { id: userId, username, password: hashedPassword };

        db.users.push(newUser);
        db.hashpwd.push(newHash);

        res.status(201).json({ message: "User registered in both tables", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
});

/**
 * POST /login
 * Requirement: Compare hashed password from hashpwd table
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find the hash entry for this username
    const userHashEntry = db.hashpwd.find(u => u.username === username);

    if (!userHashEntry) {
        return res.status(404).json({ error: "User not found" });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, userHashEntry.password);

    if (isMatch) {
        res.status(200).json({ message: `Welcome, ${username}!` });
    } else {
        res.status(401).json({ error: "Incorrect password" });
    }
});

/**
 * GET /users
 * Requirement: Retrieve all users
 */
app.get('/users', (req, res) => {
    res.json(db.users);
});

/**
 * GET /users/:id
 * Requirement: Retrieve specific user by ID
 */
app.get('/users/:id', (req, res) => {
    const user = db.users.find(u => u.id === parseInt(req.params.id));
    user ? res.json(user) : res.status(404).json({ error: "User not found" });
});

/**
 * PUT /users/:id
 * Requirement: Update user info
 */
app.put('/users/:id', (req, res) => {
    const index = db.users.findIndex(u => u.id === parseInt(req.params.id));
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...req.body };
        res.json({ message: "User updated", user: db.users[index] });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

// --- SERVER START ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
    ✅ API is running on http://localhost:${PORT}
    🚀 Challenge Routes:
    - POST /register
    - POST /login
    - GET  /users
    - GET  /users/:id
    - PUT  /users/:id
    `);
});

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Get the current folder path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow JSON requests
app.use(express.json());

// Serve index.html, style.css, and app.js
app.use(express.static(__dirname));

// Dashboard API
app.get("/api/dashboard", (req, res) => {
  res.json({
    totalMembers: 0,
    totalContributions: 0,
    totalExpenses: 0,
    availableBalance: 0
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Akiba is running at http://localhost:${PORT}`);
});

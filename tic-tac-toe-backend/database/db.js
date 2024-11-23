const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Database setup
const dbPath = path.join(__dirname, "tic_tac_toe.db");

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Create database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, ""); // Create empty file
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  console.log("Connected to SQLite database.");
});

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_key TEXT UNIQUE,
    player1 TEXT,
    player2 TEXT,
    status TEXT DEFAULT 'waiting',
    board TEXT DEFAULT '---------',
    turn TEXT DEFAULT ''
  )
`);

module.exports = db;

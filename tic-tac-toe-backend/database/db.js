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

// Helper function to add a column if it doesn't exist
const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
  const sql = `PRAGMA table_info(${tableName})`;
  db.all(sql, (err, columns) => {
    if (err) {
      console.error(`Error fetching table info for ${tableName}:`, err.message);
      return;
    }
    const columnExists = columns.some((col) => col.name === columnName);
    if (!columnExists) {
      db.run(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
        (err) => {
          if (err) {
            console.error(
              `Error adding column '${columnName}' to '${tableName}':`,
              err.message
            );
          } else {
            console.log(`Column '${columnName}' added to '${tableName}'.`);
          }
        }
      );
    }
  });
};

// Create users table
db.run(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
  `,
  (err) => {
    if (err) console.error("Error creating 'users' table:", err.message);
  }
);

// Create games table
db.run(
  `
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_key TEXT UNIQUE,
    player1 TEXT,
    player2 TEXT,
    status TEXT DEFAULT 'waiting',
    board TEXT DEFAULT '---------', -- Ensure 9 empty slots for the game board
    turn TEXT DEFAULT '',
    moves TEXT DEFAULT '' -- Optional for move history
  )
  `,
  (err) => {
    if (err) console.error("Error creating 'games' table:", err.message);
    else {
      // Ensure the 'moves' column exists
      addColumnIfNotExists("games", "moves", "TEXT DEFAULT ''");
    }
  }
);

// Create replay table for move history
db.run(
  `
  CREATE TABLE IF NOT EXISTS replay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_key TEXT,
    move_index INTEGER,
    player TEXT,
    board_state TEXT
  )
  `,
  (err) => {
    if (err) console.error("Error creating 'replay' table:", err.message);
  }
);

module.exports = db;

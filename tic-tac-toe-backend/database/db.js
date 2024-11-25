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
  fs.writeFileSync(dbPath, ""); // Create an empty file
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  console.log("Connected to SQLite database.");
});

// Helper function to check if a column exists and recreate the table if needed
const recreateTableIfMissingColumn = (tableName, columns) => {
  const sql = `PRAGMA table_info(${tableName})`;
  db.all(sql, (err, existingColumns) => {
    if (err) {
      console.error(`Error fetching table info for ${tableName}:`, err.message);
      return;
    }

    const missingColumns = columns.filter(
      (col) =>
        !existingColumns.some((existingCol) => existingCol.name === col.name)
    );

    if (missingColumns.length > 0) {
      console.log(
        `Recreating table '${tableName}' to add missing columns:`,
        missingColumns.map((col) => col.name).join(", ")
      );

      // Backup and drop the table
      db.serialize(() => {
        db.run(
          `ALTER TABLE ${tableName} RENAME TO ${tableName}_backup`,
          (err) => {
            if (err)
              console.error(
                `Error renaming table '${tableName}':`,
                err.message
              );
          }
        );

        // Recreate the table with the correct schema
        const createSQL = `
          CREATE TABLE ${tableName} (
            ${columns.map((col) => `${col.name} ${col.definition}`).join(",\n")}
          )
        `;
        db.run(createSQL, (err) => {
          if (err)
            console.error(
              `Error recreating table '${tableName}':`,
              err.message
            );
          else console.log(`Recreated table '${tableName}'.`);
        });

        // Copy data back from backup (excluding missing columns)
        const existingColumnNames = existingColumns
          .map((col) => col.name)
          .join(", ");
        const columnNames = columns.map((col) => col.name).join(", ");
        db.run(
          `INSERT INTO ${tableName} (${existingColumnNames}) SELECT ${existingColumnNames} FROM ${tableName}_backup`,
          (err) => {
            if (err)
              console.error(
                `Error copying data back to '${tableName}':`,
                err.message
              );
          }
        );

        // Drop the backup table
        db.run(`DROP TABLE ${tableName}_backup`, (err) => {
          if (err)
            console.error(
              `Error dropping backup table '${tableName}_backup':`,
              err.message
            );
        });
      });
    }
  });
};

// Define the expected schema for the users table
const usersTableSchema = [
  { name: "id", definition: "INTEGER PRIMARY KEY AUTOINCREMENT" },
  { name: "username", definition: "TEXT UNIQUE" },
  { name: "email", definition: "TEXT UNIQUE" },
  { name: "password", definition: "TEXT" },
];

// Recreate the users table if necessary
recreateTableIfMissingColumn("users", usersTableSchema);

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
    moves TEXT DEFAULT '',
    is_ai_game BOOLEAN DEFAULT 0,
    board_size INTEGER DEFAULT 3 -- Default to 3x3 board
  )
  `,
  (err) => {
    if (err) console.error("Error creating 'games' table:", err.message);
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

// Create game_logs table
db.run(
  `
  CREATE TABLE IF NOT EXISTS game_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_key TEXT NOT NULL,
    player TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `,
  (err) => {
    if (err) console.error("Error creating 'game_logs' table:", err.message);
  }
);

// Create chat table for chat feature with private chat support
db.run(
  `
  CREATE TABLE IF NOT EXISTS chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_key TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    chat_type TEXT DEFAULT 'public', -- public or private
    target_user TEXT, -- for private messages, target user is stored
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `,
  (err) => {
    if (err) console.error("Error creating 'chat' table:", err.message);
  }
);

module.exports = db;

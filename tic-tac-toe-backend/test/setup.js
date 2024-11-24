import db from "../database/db.js";

export const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create tables
    db.serialize(() => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT
        )
      `,
        (err) => {
          if (err) reject(err);
        }
      );

      db.run(
        `
        CREATE TABLE IF NOT EXISTS games (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          game_key TEXT UNIQUE,
          player1 TEXT,
          player2 TEXT,
          status TEXT DEFAULT 'waiting',
          board TEXT DEFAULT '---------',
          turn TEXT DEFAULT '',
          moves TEXT DEFAULT ''
        )
      `,
        (err) => {
          if (err) reject(err);
        }
      );

      resolve();
    });
  });
};

export const teardownDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DROP TABLE IF EXISTS users", (err) => {
        if (err) reject(err);
      });

      db.run("DROP TABLE IF EXISTS games", (err) => {
        if (err) reject(err);
      });

      resolve();
    });
  });
};

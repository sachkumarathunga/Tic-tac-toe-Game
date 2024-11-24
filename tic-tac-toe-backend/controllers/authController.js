const db = require("../database/db");

const register = (req, res) => {
  const { username, password } = req.body;

  // Regular expression to allow only alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  if (!usernameRegex.test(username)) {
    return res
      .status(400)
      .json({
        error: "Username can only contain letters, numbers, and underscores.",
      });
  }

  const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
  db.run(sql, [username, password], (err) => {
    if (err) {
      return res.status(400).json({ error: "User already exists." });
    }
    res.json({ message: "Registration successful." });
  });
};

const login = (req, res) => {
  const { username, password } = req.body;

  // Regular expression to allow only alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: "Invalid username format." });
  }

  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(sql, [username, password], (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    res.json({ message: "Login successful.", username: row.username });
  });
};

module.exports = { register, login };

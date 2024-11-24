const db = require("../database/db");

const register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
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
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(sql, [username, password], (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    res.json({ message: "Login successful.", username: row.username });
  });
};

module.exports = { register, login }; // Export the functions

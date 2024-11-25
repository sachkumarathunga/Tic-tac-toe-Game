const db = require("../database/db");
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

// Register function
const register = async (req, res) => {
  const { username, email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email, and password are required." });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error: "Username can only contain letters, numbers, and underscores.",
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [username, email, hashedPassword], (err) => {
      if (err) {
        return res.status(400).json({ error: "User already exists." });
      }
      res.json({ message: "Registration successful." });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Login function
const login = (req, res) => {
  const { username, password } = req.body;

  const usernameRegex = /^[a-zA-Z0-9_]+$/;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: "Invalid username format." });
  }

  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username], async (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    try {
      // Compare the hashed password with the user's input
      const isPasswordMatch = await bcrypt.compare(password, row.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      res.json({ message: "Login successful.", username: row.username });
    } catch (error) {
      console.error("Error comparing passwords:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });
};

module.exports = { register, login };

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();

// Security: Set HTTP headers
app.use(helmet());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

// 404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});




module.exports = app;

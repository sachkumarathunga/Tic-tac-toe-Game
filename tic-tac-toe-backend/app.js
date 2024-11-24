const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan"); // Logging middleware
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();

// Security: Set HTTP headers
app.use(helmet());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow more requests to support larger user base
});
app.use(limiter);

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Logging middleware for better debugging
app.use(morgan("combined"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy." });
});

// Analytics Middleware (for tracking API usage)
app.use((req, res, next) => {
  console.log(
    `API accessed: ${req.method} ${req.url} at ${new Date().toISOString()}`
  );
  next();
});

// 404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Enhanced Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message} at ${req.method} ${req.url}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("Server is shutting down gracefully...");
  process.exit(0);
});

module.exports = app;

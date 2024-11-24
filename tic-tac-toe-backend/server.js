const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
const PORT = process.env.PORT || 4000; // Allow dynamic port for deployment

// Security: Set HTTP headers
app.use(helmet());

// Enable CORS for cross-origin requests
app.use(cors());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Adjust for higher traffic if needed
});
app.use(limiter);

// Parse JSON request bodies
app.use(express.json());

// Logging middleware
app.use(morgan("combined"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Server is running smoothly." });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown for better production management
process.on("SIGINT", () => {
  console.log("Shutting down server gracefully...");
  process.exit(0);
});

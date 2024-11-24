const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const http = require("http");
const db = require("./database/db"); // Ensure this matches your database setup
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
  max: 1000, // Adjust for higher traffic if needed
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

// Database Keep-Alive (Ping every 30 seconds)
setInterval(() => {
  db.run("SELECT 1", [], (err) => {
    if (err) {
      console.error("[Database Error]:", err.message);
    }
  });
}, 30000);

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

// Start the server with Keep-Alive settings
const server = http.createServer(app);
server.keepAliveTimeout = 60 * 1000; // Keep connections alive for 60 seconds
server.headersTimeout = 65 * 1000; // Allow headers timeout slightly longer
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown for better production management
process.on("SIGINT", () => {
  console.log("Shutting down server gracefully...");
  server.close(() => {
    console.log("Server shut down.");
    process.exit(0);
  });
});

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Apply routes
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

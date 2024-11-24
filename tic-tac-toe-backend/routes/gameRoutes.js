const express = require("express");
const {
  createGame,
  createAIGame,
  enrollGame,
  addSpectator,
  makeMove,
  getGameStatus,
} = require("../controllers/gameController");

const router = express.Router();

router.post("/create-game", createGame);
router.post("/create-ai-game", createAIGame); // AI Game Route
router.post("/enroll-game", enrollGame);
router.post("/spectate-game", addSpectator); // Spectator Route
router.post("/make-move", makeMove);
router.get("/game-status/:gameKey", getGameStatus);

module.exports = router;

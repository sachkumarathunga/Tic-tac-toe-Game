const express = require("express");
const {
  createGame,
  createAIGame,
  enrollGame,
  addSpectator,
  makeMove,
  getGameStatus,
  addChatMessage,
  getChatMessages,
} = require("../controllers/gameController");

const router = express.Router();

router.post("/create-game", createGame);
router.post("/create-ai-game", createAIGame);
router.post("/enroll-game", enrollGame);
router.post("/spectate-game", addSpectator);
router.post("/make-move", makeMove);
router.get("/game-status/:gameKey", getGameStatus);
router.post("/add-chat-message", addChatMessage); // Fix here
router.get("/get-chat-messages/:gameKey", getChatMessages); // Fix here

module.exports = router;

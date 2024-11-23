const express = require("express");
const {
  createGame,
  enrollGame,
  makeMove,
  getGameStatus,
} = require("../controllers/gameController");
const router = express.Router();

router.post("/create-game", createGame);
router.post("/enroll-game", enrollGame);
router.post("/make-move", makeMove);
router.get("/game-status/:gameKey", getGameStatus);

module.exports = router;

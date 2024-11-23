const db = require("../database/db");
const { checkWinner } = require("../helpers/gameLogic");

const createGame = (req, res) => {
  const { username } = req.body;
  const gameKey = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sql = `INSERT INTO games (game_key, player1, turn) VALUES (?, ?, ?)`;
  db.run(sql, [gameKey, username, username], (err) => {
    if (err) {
      console.error("Error creating game:", err.message);
      return res
        .status(400)
        .json({ error: `Game creation failed: ${err.message}` });
    }
    res.json({ message: "Game created.", gameKey });
  });
};

const enrollGame = (req, res) => {
  const { gameKey, username } = req.body;
  const sql = `UPDATE games SET player2 = ?, status = 'ready' WHERE game_key = ? AND player2 IS NULL`;
  db.run(sql, [username, gameKey], function (err) {
    if (err || this.changes === 0)
      return res.status(400).json({ error: "Enrollment failed or game full." });
    res.json({ message: "Enrollment successful." });
  });
};

const makeMove = (req, res) => {
  const { gameKey, username, index } = req.body;
  const sqlGet = `SELECT * FROM games WHERE game_key = ?`;
  db.get(sqlGet, [gameKey], (err, game) => {
    if (err || !game) return res.status(404).json({ error: "Game not found." });

    if (game.status !== "ready") {
      return res.status(400).json({ error: "Game is not ready." });
    }

    if (game.turn !== username) {
      return res.status(403).json({ error: "Not your turn." });
    }

    const board = game.board.split("");
    if (board[index] !== "-") {
      return res.status(400).json({ error: "Invalid move." });
    }

    board[index] = game.player1 === username ? "X" : "O";
    const winnerMark = checkWinner(board);
    let winnerName = null;

    if (winnerMark === "X") {
      winnerName = game.player1;
    } else if (winnerMark === "O") {
      winnerName = game.player2;
    }

    const nextTurn = winnerMark
      ? ""
      : game.turn === game.player1
      ? game.player2
      : game.player1;
    const status = winnerMark
      ? winnerMark === "draw"
        ? "draw"
        : `${winnerName} wins`
      : "ready";

    const sqlUpdate = `UPDATE games SET board = ?, status = ?, turn = ? WHERE game_key = ?`;
    db.run(sqlUpdate, [board.join(""), status, nextTurn, gameKey], (err) => {
      if (err) return res.status(400).json({ error: "Failed to update game." });
      res.json({
        board: board.join(""),
        status,
        winner: winnerName || null,
        turn: nextTurn,
      });
    });
  });
};

const getGameStatus = (req, res) => {
  const { gameKey } = req.params;
  const sql = `SELECT * FROM games WHERE game_key = ?`;
  db.get(sql, [gameKey], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Game not found." });
    res.json(row);
  });
};

module.exports = { createGame, enrollGame, makeMove, getGameStatus };

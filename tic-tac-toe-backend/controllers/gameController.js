const db = require("../database/db");
const { checkWinner } = require("../helpers/gameLogic");

// Create a new game
const createGame = (req, res) => {
  const { username } = req.body;
  const gameKey = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sql = `INSERT INTO games (game_key, player1, turn, moves) VALUES (?, ?, ?, ?)`;
  db.run(sql, [gameKey, username, username, JSON.stringify([])], (err) => {
    if (err) {
      console.error("Error creating game:", err.message);
      return res
        .status(400)
        .json({ error: `Game creation failed: ${err.message}` });
    }
    res.json({ message: "Game created.", gameKey });
  });
};

// Enroll a player in an existing game
const enrollGame = (req, res) => {
  const { gameKey, username } = req.body;
  const sql = `UPDATE games SET player2 = ?, status = 'ready' WHERE game_key = ? AND player2 IS NULL`;
  db.run(sql, [username, gameKey], function (err) {
    if (err || this.changes === 0) {
      return res
        .status(400)
        .json({ error: "Enrollment failed or game is full." });
    }
    res.json({ message: "Enrollment successful." });
  });
};

// Backend: createAIGame function
const createAIGame = (req, res) => {
  const { username } = req.body;
  const gameKey = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sql = `INSERT INTO games (game_key, player1, player2, turn, status, board, moves, is_ai_game) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    sql,
    [
      gameKey,
      username,
      "AI",
      username,
      "ready",
      "---------",
      JSON.stringify([]),
      1, // is_ai_game flag
    ],
    (err) => {
      if (err) {
        console.error("Error creating AI game:", err.message);
        return res.status(400).json({ error: `AI Game creation failed.` });
      }
      res.json({ message: "AI Game created.", gameKey }); // Ensure gameKey is sent
    }
  );
};


// Add a spectator to the game
const addSpectator = (req, res) => {
  const { gameKey, username } = req.body;
  const sql = `SELECT * FROM games WHERE game_key = ?`;
  db.get(sql, [gameKey], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Game not found." });
    }
    const sqlLog = `INSERT INTO game_logs (game_key, player, action) VALUES (?, ?, ?)`;
    db.run(sqlLog, [gameKey, username, "spectate"], (err) => {
      if (err) {
        console.error("Failed to log spectator:", err.message);
        return res.status(500).json({ error: "Failed to add spectator." });
      }
      res.json({ message: "Spectator added.", board: row.board });
    });
  });
};

// Handle a player's move
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

    const mark = game.player1 === username ? "X" : "O";
    board[index] = mark;

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

    const moveHistory = game.moves ? JSON.parse(game.moves) : [];
    moveHistory.push({ player: username, mark, index });

    const sqlUpdate = `UPDATE games SET board = ?, status = ?, turn = ?, moves = ? WHERE game_key = ?`;
    db.run(
      sqlUpdate,
      [board.join(""), status, nextTurn, JSON.stringify(moveHistory), gameKey],
      (err) => {
        if (err)
          return res.status(400).json({ error: "Failed to update game." });

        if (game.is_ai_game && !winnerMark) {
          // AI Move Logic
          const aiIndex = board.findIndex((cell) => cell === "-");
          board[aiIndex] = "O";

          const aiWinnerMark = checkWinner(board);
          const aiWinnerName = aiWinnerMark === "O" ? "AI" : null;

          const aiStatus = aiWinnerMark
            ? aiWinnerMark === "draw"
              ? "draw"
              : `${aiWinnerName} wins`
            : "ready";

          moveHistory.push({ player: "AI", mark: "O", index: aiIndex });

          db.run(
            sqlUpdate,
            [
              board.join(""),
              aiStatus,
              game.player1,
              JSON.stringify(moveHistory),
              gameKey,
            ],
            (err) => {
              if (err)
                return res
                  .status(400)
                  .json({ error: "Failed to update AI move." });
              res.json({
                board: board.join(""),
                status: aiStatus,
                winner: aiWinnerName || null,
                turn: game.player1,
                moves: moveHistory,
              });
            }
          );
        } else {
          res.json({
            board: board.join(""),
            status,
            winner: winnerName || null,
            turn: nextTurn,
            moves: moveHistory,
          });
        }
      }
    );
  });
};

// Get the current game status
const getGameStatus = (req, res) => {
  const { gameKey } = req.params;
  const sql = `SELECT * FROM games WHERE game_key = ?`;
  db.get(sql, [gameKey], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: "Game not found." });
    }
    res.json(row);
  });
};

module.exports = {
  createGame,
  enrollGame,
  createAIGame,
  addSpectator, // Added for spectator mode
  makeMove,
  getGameStatus,
};

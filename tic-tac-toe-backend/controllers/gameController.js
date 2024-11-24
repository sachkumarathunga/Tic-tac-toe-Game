const db = require("../database/db");
const { checkWinner } = require("../helpers/gameLogic");

// Create a new game with board size
const createGame = (req, res) => {
  const { username, boardSize = 3 } = req.body;
  const gameKey = Math.random().toString(36).substring(2, 8).toUpperCase();
  const emptyBoard = "-".repeat(boardSize * boardSize);

  const sql = `INSERT INTO games (game_key, player1, turn, moves, board, board_size, status) VALUES (?, ?, ?, ?, ?, ?, 'waiting')`;
  db.run(
    sql,
    [gameKey, username, username, JSON.stringify([]), emptyBoard, boardSize],
    (err) => {
      if (err) {
        console.error("Error creating game:", err.message);
        return res
          .status(400)
          .json({ error: `Game creation failed: ${err.message}` });
      }
      res.json({ message: "Game created.", gameKey, boardSize });
    }
  );
};

// Enroll in an existing game
const enrollGame = (req, res) => {
  const { gameKey, username } = req.body;
  const sql = `SELECT board_size, player1, player2, status FROM games WHERE game_key = ?`;

  db.get(sql, [gameKey], (err, row) => {
    if (err) {
      console.error("Error fetching game details:", err.message);
      return res.status(500).json({ error: "Internal server error." });
    }

    if (!row) {
      return res.status(404).json({ error: "Game not found." });
    }

    if (row.player2) {
      return res.status(400).json({ error: "Game is already full." });
    }

    if (row.status !== "waiting") {
      return res
        .status(400)
        .json({ error: "Game is not in a valid state for enrollment." });
    }

    const boardSize = row.board_size;

    const updateSql = `UPDATE games SET player2 = ?, status = 'ready' WHERE game_key = ? AND player2 IS NULL`;
    db.run(updateSql, [username, gameKey], function (err) {
      if (err) {
        console.error("Error updating game details:", err.message);
        return res.status(500).json({ error: "Enrollment failed." });
      }

      if (this.changes === 0) {
        return res
          .status(400)
          .json({ error: "Enrollment failed. Game may already be full." });
      }

      res.json({
        message: "Enrollment successful.",
        boardSize,
        gameKey,
        status: "ready",
      });
    });
  });
};

// Create a game against AI
const createAIGame = (req, res) => {
  const { username, boardSize = 3 } = req.body;
  const gameKey = Math.random().toString(36).substring(2, 8).toUpperCase();
  const emptyBoard = "-".repeat(boardSize * boardSize);

  const sql = `INSERT INTO games (game_key, player1, player2, turn, status, board, moves, is_ai_game, board_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    sql,
    [
      gameKey,
      username,
      "AI",
      username,
      "ready",
      emptyBoard,
      JSON.stringify([]),
      1,
      boardSize,
    ],
    (err) => {
      if (err) {
        console.error("Error creating AI game:", err.message);
        return res.status(400).json({ error: `AI Game creation failed.` });
      }
      res.json({ message: "AI Game created.", gameKey, boardSize });
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
    res.json({ message: "Spectator added.", board: row.board });
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

    const winnerMark = checkWinner(board, game.board_size);
    let winnerName = null;

    if (winnerMark === "X") {
      winnerName = game.player1;
    } else if (winnerMark === "O") {
      winnerName = game.player2;
    }

    let nextTurn = winnerMark
      ? null
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

    if (game.is_ai_game && !winnerMark && nextTurn === "AI") {
      const aiMove = getBestAIMove(board, "O", game.board_size);
      if (aiMove !== null) {
        board[aiMove] = "O";
        moveHistory.push({ player: "AI", mark: "O", index: aiMove });

        const aiWinnerMark = checkWinner(board, game.board_size);
        if (aiWinnerMark) {
          winnerName = aiWinnerMark === "X" ? game.player1 : "AI";
          nextTurn = null;
        } else {
          nextTurn = game.player1;
        }
      }
    }

    const sqlUpdate = `UPDATE games SET board = ?, status = ?, turn = ?, moves = ? WHERE game_key = ?`;
    db.run(
      sqlUpdate,
      [board.join(""), status, nextTurn, JSON.stringify(moveHistory), gameKey],
      (err) => {
        if (err)
          return res.status(400).json({ error: "Failed to update game." });

        res.json({
          board: board.join(""),
          status,
          winner: winnerName || null,
          turn: nextTurn,
          moves: moveHistory,
        });
      }
    );
  });
};

// AI move helper function
const getBestAIMove = (board, aiMark, boardSize) => {
  const playerMark = aiMark === "X" ? "O" : "X";
  const emptyCells = board
    .map((cell, index) => (cell === "-" ? index : null))
    .filter((cell) => cell !== null);

  for (const cell of emptyCells) {
    board[cell] = aiMark;
    if (checkWinner(board, boardSize) === aiMark) {
      board[cell] = "-";
      return cell;
    }
    board[cell] = "-";
  }

  for (const cell of emptyCells) {
    board[cell] = playerMark;
    if (checkWinner(board, boardSize) === playerMark) {
      board[cell] = "-";
      return cell;
    }
    board[cell] = "-";
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)] || null;
};

// Get the current game status
const getGameStatus = (req, res) => {
  const { gameKey } = req.params;
  const sql = `SELECT * FROM games WHERE game_key = ?`;

  db.get(sql, [gameKey], (err, row) => {
    if (err) {
      console.error("Error fetching game:", err.message);
      return res.status(500).json({ error: "Internal server error." });
    }

    if (!row) {
      return res.status(404).json({ error: "Game not found." });
    }

    res.json({
      gameKey: row.game_key,
      board: row.board,
      boardSize: row.board_size,
      turn: row.turn,
      status: row.status,
      moves: row.moves,
    });
  });
};

// Send a chat message
const sendMessage = (req, res) => {
  const { gameKey, username, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const sql = `INSERT INTO chat (game_key, username, message) VALUES (?, ?, ?)`;
  db.run(sql, [gameKey, username, message.trim()], (err) => {
    if (err) {
      console.error("Failed to save chat message:", err.message);
      return res.status(500).json({ error: "Failed to send message." });
    }
    res.json({ message: "Message sent successfully." });
  });
};

// Get chat messages
const getMessages = (req, res) => {
  const { gameKey } = req.params;

  const sql = `SELECT username, message, timestamp FROM chat WHERE game_key = ? ORDER BY id ASC`;
  db.all(sql, [gameKey], (err, rows) => {
    if (err) {
      console.error("Failed to fetch chat messages:", err.message);
      return res.status(500).json({ error: "Failed to get messages." });
    }
    res.json(rows);
  });
};

// Export these functions
module.exports = {
  createGame,
  enrollGame,
  createAIGame,
  addSpectator,
  makeMove,
  getGameStatus,
  addChatMessage: sendMessage,
  getChatMessages: getMessages,
};

const checkWinner = (board, boardSize) => {
  const winStreak = boardSize;

  // Helper function to check if all cells in a line are the same and not empty
  const isWinningLine = (line) =>
    line.length === winStreak &&
    line.every((cell) => cell === line[0] && cell !== "-");

  // Check rows
  for (let row = 0; row < boardSize; row++) {
    for (let start = 0; start <= boardSize - winStreak; start++) {
      const rowSlice = board.slice(
        row * boardSize + start,
        row * boardSize + start + winStreak
      );
      if (isWinningLine(rowSlice)) {
        return rowSlice[0];
      }
    }
  }

  // Check columns
  for (let col = 0; col < boardSize; col++) {
    for (let start = 0; start <= boardSize - winStreak; start++) {
      const colSlice = [];
      for (let k = 0; k < winStreak; k++) {
        colSlice.push(board[(start + k) * boardSize + col]);
      }
      if (isWinningLine(colSlice)) {
        return colSlice[0];
      }
    }
  }

  // Check main diagonals (top-left to bottom-right)
  for (let row = 0; row <= boardSize - winStreak; row++) {
    for (let col = 0; col <= boardSize - winStreak; col++) {
      const diag1Slice = [];
      for (let k = 0; k < winStreak; k++) {
        diag1Slice.push(board[(row + k) * boardSize + (col + k)]);
      }
      if (isWinningLine(diag1Slice)) {
        return diag1Slice[0];
      }
    }
  }

  // Check anti-diagonals (top-right to bottom-left)
  for (let row = 0; row <= boardSize - winStreak; row++) {
    for (let col = winStreak - 1; col < boardSize; col++) {
      const diag2Slice = [];
      for (let k = 0; k < winStreak; k++) {
        diag2Slice.push(board[(row + k) * boardSize + (col - k)]);
      }
      if (isWinningLine(diag2Slice)) {
        return diag2Slice[0];
      }
    }
  }

  // Check for draw
  if (!board.includes("-")) {
    return "draw";
  }

  return null; // Game is still ongoing
};

module.exports = { checkWinner };

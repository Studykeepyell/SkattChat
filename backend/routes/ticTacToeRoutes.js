// ticTacToe.js
let waitingPlayer = null;
const games = {};

module.exports = (io) => {
  const router = require('express').Router();
  const {handlePlayerMatching, handleMove} = require('backend\controllers\ticTacToeController.js');

  io.on('connection',(socket)=>{socket.on('findTictactoeOpponent', handlePlayerMatching(socket,io));

    socket.on('findTictactoeOpponent', handlePlayerMatching(socket, io));
    socket.on('makeMove', handleMove(socket, io));

  });
    return router;

};
/*
  io.on('connection', (socket) => {
    console.log('A user connected to Tic-Tac-Toe:', socket.id);

    // Handle player looking for an opponent
    socket.on('findTictactoeOpponent', () => {
      if (waitingPlayer) {
        const roomID = `game-${waitingPlayer.id}-${socket.id}`;
        const firstPlayer = Math.random() < 0.5 ? waitingPlayer : socket;
        const secondPlayer = firstPlayer === waitingPlayer ? socket : waitingPlayer;
        games[roomID] = {
          board: Array(3).fill(null).map(() => Array(3).fill(null)),
          currentPlayer: 'X',
        };

        socket.join(roomID);
        waitingPlayer.join(roomID);

        io.to(firstPlayer.id).emit('startTictactoeGame', { roomID, playerSymbol: 'X', isFirstTurn: true });
        io.to(secondPlayer.id).emit('startTictactoeGame', { roomID, playerSymbol: 'O', isFirstTurn: false });
        waitingPlayer = null;
      } else {
        waitingPlayer = socket;
        console.log(`User ${socket.id} is waiting for an opponent.`);
      }
    });

    socket.on('makeMove', ({ row, col, roomID, player }) => {
      const game = games[roomID];
      if (game && game.board[row][col] === null && game.currentPlayer === player) {
        game.board[row][col] = player;
        io.to(roomID).emit('moveMade', { row, col, player });
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      }
    });

    socket.on('disconnect', () => {
      if (waitingPlayer === socket) waitingPlayer = null;
      for (const roomID in games) {
        if (roomID.includes(socket.id)) {
          io.to(roomID).emit('opponentDisconnected');
          delete games[roomID];
          break;
        }
      }
    });
  });
};

function checkWin(board, player) {
    for (let i = 0; i < 3; i++) {
        if (board[i].every(cell => cell === player) || board.every(row => row[i] === player)) return true;
    }
    return (board[0][0] === player && board[1][1] === player && board[2][2] === player) ||
           (board[0][2] === player && board[1][1] === player && board[2][0] === player);
}

function isBoardFull(board) {
    return board.every(row => row.every(cell => cell !== null));
}
*/
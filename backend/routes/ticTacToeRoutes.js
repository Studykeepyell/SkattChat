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

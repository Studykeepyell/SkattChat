const socket = io();

    // Add Tic-Tac-Toe button event listener
    const playTictactoeButton = document.getElementById('playTictactoe');
    if (playTictactoeButton) {
        playTictactoeButton.addEventListener('click', () => {
            playTictactoeButton.disabled = true;
            playTictactoeButton.textContent = 'Waiting for an opponent...';
            socket.emit('findTictactoeOpponent'); // Emit event to find an opponent
        });
    }

    socket.on('startTictactoeGame', (data) => {
        roomID = data.roomID;
        const playerSymbol = data.playerSymbol;     // Extract playerSymbol
        const isFirstTurn = data.isFirstTurn;       // Extract isFirstTurn
    
        playTictactoeButton.disabled = false;
        playTictactoeButton.textContent = 'Play Tic-Tac-Toe';
    
        // Open the Tic-Tac-Toe game in a new window and initialize it with correct parameters
        const ticTacToeWindow = window.open('tictactoe.html', 'Tic-Tac-Toe Game', 'width=400,height=400');
        ticTacToeWindow.onload = () => {
            // Pass socket, roomID, playerSymbol, and isFirstTurn to initGame
            ticTacToeWindow.initGame(socket, roomID, playerSymbol, isFirstTurn);
        };
    });
    

    socket.on('moveMade', ({ row, col, player }) => {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) cell.textContent = player;
    });


    // Handle no opponent found (timeout)
    socket.on('tictactoeWaitTimeout', () => {
        playTictactoeButton.disabled = false;
        playTictactoeButton.textContent = 'Play Tic-Tac-Toe';
        alert('No opponents found. Try again later.');
    });


    socket.on('opponentDisconnected', () => {
        alert("Your opponent disconnected. Game over.");
    });
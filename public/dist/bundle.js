const socket = io();

document.addEventListener('DOMContentLoaded', () => {

    function addChatMessage(data) {
        console.log('Adding chat message:', data);

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        const userInfoContainer = document.createElement('div');
        userInfoContainer.className = 'user-info-container';

        const username = document.createElement('h2');
        username.className = 'username';
        username.textContent = data.username;

        const timeText = document.createElement('h4');
        timeText.className = 'timestamp';
        timeText.textContent = formatTimestamp(data.timestamp);

        userInfoContainer.appendChild(username);
        userInfoContainer.appendChild(timeText);

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = data.message;

        messageContainer.appendChild(userInfoContainer);
        messageContainer.appendChild(messageContent);

        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.appendChild(messageContainer);
            console.log('Message successfully appended to messages list');
        } else {
            console.warn('Messages container not found.');
        }
    }

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

    // Utility function to format the timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (isNaN(date)) {
            return 'Invalid Date';
        }
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString(undefined, options);
    }

    // Event listeners and socket.io handling code go here
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('messageForm');
    const deleteAllMessagesButton = document.getElementById('deleteAllMessages');
    const messagesList = document.getElementById('messages');

    if (chatForm) {
        chatForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
                socket.emit('chat message', {
                    username: localStorage.getItem('username'),
                    message: message,
                    timestamp: Date.now()
                });
                messageInput.value = '';
            }
        });
    }

    if (deleteAllMessagesButton) {
        deleteAllMessagesButton.addEventListener('click', function() {
            if (messagesList) {
                messagesList.innerHTML = '';
                socket.emit('clear messages');
            }
        });
    }

    socket.on('chat message', function(data) {
        addChatMessage(data);
    });

    socket.on('clear messages', function() {
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    });

    socket.on('chat history', function(messages) {
        if (messagesList) {
            messagesList.innerHTML = '';
            messages.forEach((msg) => {
                addChatMessage(msg);
            });
        }
    });
});

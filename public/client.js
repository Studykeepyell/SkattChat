const socket = io();

document.addEventListener('DOMContentLoaded', () => {
  

    // Function to add a new chat message to the messages container
    function addChatMessage(data) {
        console.log('Adding chat message:', data);

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
    
        const actionButton = document.createElement('button');
        actionButton.className = 'action-button';
        actionButton.textContent = '🖥️';
        actionButton.style.marginRight = '10px';
        
        // Fetch ChatGPT's opinion when button is clicked
        actionButton.addEventListener('click', async () => {
            try {
                console.log("Making request to:", '/api/get-opinion');
                const response = await fetch('/api/get-opinion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: data.message })
                });
                const result = await response.json();
                // Add AI response as a new message
                addChatMessage({
                    username: "AttyAI",
                    message: `response to ${data.username}: "${data.message}" - ${result.opinion}`,
                    timestamp: Date.now()
                }, true);
            } catch (error) {
                console.error('Error fetching ChatGPT opinion:', error);
            }
        });

        // Character picture placeholder
        const characterPicture = document.createElement('div');
        characterPicture.className = 'character-picture';

        // Bubble wrapper
        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'bubble-wrapper';

        // Speech bubble
        const speechBubble = document.createElement('div');
        speechBubble.className = 'speech-bubble';

        // Message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message';
        messageContent.textContent = `${data.username}: ${data.message}`;

        // Lower text (timestamp)
        const lowerText = document.createElement('div');
        lowerText.className = 'lower-text';
        lowerText.textContent = formatTimestamp(data.timestamp);

        // Append the elements together
        speechBubble.appendChild(messageContent);
        bubbleWrapper.appendChild(speechBubble);
        messageContainer.appendChild(actionButton); // Append the button first
        messageContainer.appendChild(characterPicture);
        messageContainer.appendChild(bubbleWrapper);
        messageContainer.appendChild(lowerText);

        // Append messageContainer to messages list
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
        const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options) + ', ' + date.toLocaleTimeString(undefined, options);
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

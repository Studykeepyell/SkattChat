document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Function to add a new chat message to the messages container (existing code)
    function addChatMessage(data) {
        console.log('Adding chat message:', data); 

        // Create the main message container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Create character picture, bubble wrapper, speech bubble, etc.
        const characterPicture = document.createElement('div');
        characterPicture.className = 'character-picture';

        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'buble-wrapper';

        const speechBubble = document.createElement('div');
        speechBubble.className = 'speech-bubble';

        const messageContent = document.createElement('div');
        messageContent.className = 'message';
        messageContent.textContent = `${data.username}: ${data.message}`;

        const lowerText = document.createElement('div');
        lowerText.className = 'lower-tex';
        lowerText.textContent = formatTimestamp(data.timestamp);

        speechBubble.appendChild(messageContent);
        bubbleWrapper.appendChild(speechBubble);
        messageContainer.appendChild(characterPicture);
        messageContainer.appendChild(bubbleWrapper);
        messageContainer.appendChild(lowerText);

        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.appendChild(messageContainer);
            console.log('Message successfully appended to messages list');
        } else {
            console.warn('Messages container not found.');
        }
    }

    // Add Gomoku button event listener
    const playTictactoeButton = document.getElementById('playTictactoe');
    if (playTictactoeButton) {
        playTictactoeButton.addEventListener('click', () => {
            playTictactoeButton.disabled = true;
            playTictactoeButton.textContent = 'Waiting for an opponent...';
            socket.emit('findTictactoeOpponent'); // Emit event to find an opponent
        });
    }

    // Handle server's response to start Gomoku game
    socket.on('startTictactoeGame', (gameData) => {
        playGomokuButton.disabled = false;
        playGomokuButton.textContent = 'Play TicTacToe';

        console.log('Starting TictacToe game with data:', gameData);
        // (Initialize the Gomoku game here if needed)

        const ticTacToeWindow = window.open('tic_tac_toe.html', 'Tic-Tac-Toe Game', 'width=400,height=400');
        ticTacToeWindow.focus();
    });

    // Handle no opponent found (timeout)
    socket.on('gomokuWaitTimeout', () => {
        playGomokuButton.disabled = false;
        playGomokuButton.textContent = 'Play TicTacToe';
        alert('No opponents found. Try again later.');
    });

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


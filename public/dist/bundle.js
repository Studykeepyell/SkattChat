const socket = io();

document.addEventListener('DOMContentLoaded', () => {

    let lastMessageDate = '';

    // Function to add a new chat message to the messages container
    function addChatMessage(data) {
        console.log('Adding chat message:', data);

        const messageDate = formatMessageDate(data.timestamp);

        if (messageDate !== lastMessageDate) {
            // Create a new date header when the date changes
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = messageDate;
            messagesList.appendChild(dateHeader); // Append date header to messages list
            lastMessageDate = messageDate; // Update the last message date
        }

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        const userInfoContainer = document.createElement('div');
        userInfoContainer.className = 'user-info-container';

        const characterPicture = document.createElement('div');
        characterPicture.className = 'character-picture';

        const username = document.createElement('h2');
        username.className = 'username';
        username.textContent = data.username;

        const timeText = document.createElement('h4');
        timeText.className = 'timestamp';
        timeText.textContent = formatTimestamp(data.timestamp);

        // Append the user information
        userInfoContainer.appendChild(characterPicture);
        userInfoContainer.appendChild(username);
        userInfoContainer.appendChild(timeText);

        // Create the message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = data.message;

        // Append message content and user info to the message container
        messageContainer.appendChild(userInfoContainer);
        messageContainer.appendChild(messageContent);

        // Only create and append the action button if the username is not "AttyAI"
        if (data.username !== 'AttyAI') {
            const actionButton = document.createElement('button');
            actionButton.className = 'action-button';
            actionButton.textContent = 'Get Opinion';
            actionButton.style.marginTop = '10px'; // Add space between content and button
            actionButton.style.backgroundColor = '#1bbbff'; // Match the background color of the message container
            actionButton.style.color = 'white';
            actionButton.style.padding = '5px 10px';
            actionButton.style.border = 'none';
            actionButton.style.borderRadius = '5px';
            actionButton.style.cursor = 'pointer';

            // Hover effect for the button
            actionButton.addEventListener('mouseover', () => {
                actionButton.style.backgroundColor = '#168bb1'; // Darker blue on hover
            });

            actionButton.addEventListener('mouseout', () => {
                actionButton.style.backgroundColor = '#1bbbff'; // Revert back to the original color
            });

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

            // Append the action button to the message container
            messageContainer.appendChild(actionButton);
        }

        // Finally, append the message container to the messages list
        messagesList.appendChild(messageContainer);
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
        const roomID = data.roomID;
        const playerSymbol = data.playerSymbol;
        const isFirstTurn = data.isFirstTurn;

        playTictactoeButton.disabled = false;
        playTictactoeButton.textContent = 'Play Tic-Tac-Toe';

        // Open the Tic-Tac-Toe game in a new window and initialize it with correct parameters
        const ticTacToeWindow = window.open('tictactoe.html', 'Tic-Tac-Toe Game', 'width=400,height=400');
        ticTacToeWindow.onload = () => {
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

    // Utility function to format message date
    function formatMessageDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    }

    // Event listeners and socket.io handling code
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
            lastMessageDate = ''; // Reset last message date to avoid duplicate headers
            messages.forEach((msg) => {
                addChatMessage(msg);
            });
        }
    });
});
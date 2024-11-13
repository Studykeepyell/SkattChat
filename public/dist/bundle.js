// bundle.js
const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    let currentRoom = 'general';
    const userId = localStorage.getItem('userId');

    if (userId) {


        socket.emit('registerUser', userId);
        console.log(`Emitted registerUser event for userId: ${userId}`);
        // Fetch the user's private chat rooms
        fetch(`/api/users/getUserRooms/${userId}`)
            .then(response => response.json())
            .then(rooms => {
                rooms.forEach(room => {
                    addRoomOption(room.roomId); // Adds room to the dropdown
                });
            });
    }

    // Function to send a chat message
    function sendMessage() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput.value) return;

        const messageData = {
            room: currentRoom,
            username: localStorage.getItem('username'),
            userId: localStorage.getItem('userId'), // Include userId in the message data
            message: messageInput.value,
            timestamp: new Date().toISOString()
        };

        console.log('Sending message:', messageData);
        socket.emit('chat message', messageData); // Emit message with userId
        messageInput.value = '';
    }


       // Attach event listener to the form submission to send the message
       const messageForm = document.getElementById('message-form');
       if (messageForm) {
           messageForm.addEventListener('submit', (event) => {
               event.preventDefault();
               sendMessage();
           });
       }
   
       const messageInput = document.getElementById('message-input');
       if (messageInput) {
           messageInput.addEventListener('keydown', (event) => {
               if (event.key === 'Enter') {
                   event.preventDefault();
                   sendMessage();
               }
           });
       }


    function addChatMessage(data) {
        console.log('Adding chat message:', data);

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        const characterPicture = document.createElement('div');
        characterPicture.className = 'character-picture';

        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'bubble-wrapper';

        const speechBubble = document.createElement('div');
        speechBubble.className = 'speech-bubble';

        const messageContent = document.createElement('div');
        messageContent.className = 'message';
        messageContent.textContent = `${data.username}: ${data.message || data.content}`;

        const lowerText = document.createElement('div');
        lowerText.className = 'lower-text';
        lowerText.textContent = formatTimestamp(data.timestamp);

        speechBubble.appendChild(messageContent);
        bubbleWrapper.appendChild(speechBubble);
        messageContainer.appendChild(characterPicture);
        messageContainer.appendChild(bubbleWrapper);
        messageContainer.appendChild(lowerText);

        // Add "Send Friend Request" button
        if (data.userId && data.userId !== localStorage.getItem('userId')) { // Check userId and prevent self-request
            const friendRequestButton = document.createElement('button');
            friendRequestButton.className = 'friend-request-button';
            friendRequestButton.textContent = 'Add Friend';
            friendRequestButton.onclick = () => sendFriendRequest(data.userId); // Pass data.userId as recipientId
            messageContainer.appendChild(friendRequestButton);
        }

        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.appendChild(messageContainer);
            console.log('Message successfully appended to messages list');
        } else {
            console.warn('Messages container not found.');
        }
    }


    const friendRequestList = document.getElementById('friendRequestList');

   


   // Function to accept a friend request
   function acceptFriendRequest(friendId, listItem) {
    fetch('/api/acceptFriendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localStorage.getItem('userId'), friendId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (listItem) listItem.remove(); // Remove the request from the UI
        addFriendToList(friendId); // Add to friends list if accepted
        joinRoom(data.roomId); // Switch to the new private chat room
    });
}



function declineFriendRequest(friendId, listItem) {
    console.log(`Attempting to decline friend request from ${friendId}`); // Log action
    fetch('/api/declineFriendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: localStorage.getItem('userId'), friendId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Response from declineFriendRequest:", data); // Log server response
        alert(data.message);
        if (listItem) listItem.remove(); // Remove request from UI after action
    })
    .catch(error => console.error("Error in declineFriendRequest:", error));
}


    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (isNaN(date)) {
            return 'Invalid Date';
        }
        const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options) + ', ' + date.toLocaleTimeString(undefined, options);
    }



    // Handle new chat room creation
    socket.on('newChatRoom', (data) => {
        const { roomId, friendId } = data;
        console.log(`New chat room created: ${roomId} with user ${friendId}`);
        joinRoom(roomId); // Join the new room
    });
    function sendFriendRequest(friendId) {
        const senderId = localStorage.getItem('userId');
        console.log(`Attempting to send friend request from ${senderId} to ${friendId}`);
        
        if (!senderId || !friendId) {
            console.error("Error: Missing senderId or recipientId.");
            return; // Early exit if IDs are missing
        }

        fetch('/api/sendFriendRequest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, recipientId: friendId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to send friend request.");
            }
            return response.json();
        })
        .then(data => alert(data.message))
        .catch(error => console.error("Error sending friend request:", error));
    }

    
  


    function acceptFriendRequest(friendId, listItem) {
        console.log(`Attempting to accept friend request from ${friendId}`); // Log action
        fetch('/api/acceptFriendRequest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: localStorage.getItem('userId'), friendId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Response from acceptFriendRequest:", data); // Log server response
            alert(data.message);
            if (listItem) listItem.remove(); // Remove the request from the UI
            addFriendToList(friendId); // Add to friends list if accepted
            joinRoom(data.roomId); // Switch to the new private chat room
        })
        .catch(error => console.error("Error in acceptFriendRequest:", error));
    }

    socket.on('friendRequestReceived', (data) => {
        console.log("Friend request received from:", data.senderId); // Log request
        displayFriendRequest(data.senderId);
    });

    function displayFriendRequest(senderId) {
        const friendRequestList = document.getElementById('friendRequestList');
        if (!friendRequestList) {
            console.error("Error: friendRequestList element not found");
            return;
        }
    
        // Check if this friend request is already displayed
        const existingRequest = Array.from(friendRequestList.children).find(item => item.dataset.senderId === senderId);
        if (existingRequest) {
            console.log("Friend request already displayed for:", senderId);
            return; // Avoid duplicate display
        }
    
        const listItem = document.createElement('li');
        listItem.dataset.senderId = senderId; // Store senderId to prevent duplicates
        listItem.textContent = `Friend request from User ${senderId}`;
    
        const acceptButton = document.createElement('button');
        acceptButton.textContent = 'Accept';
        acceptButton.onclick = () => acceptFriendRequest(senderId, listItem);
    
        const declineButton = document.createElement('button');
        declineButton.textContent = 'Decline';
        declineButton.onclick = () => declineFriendRequest(senderId, listItem);
    
        listItem.appendChild(acceptButton);
        listItem.appendChild(declineButton);
        friendRequestList.appendChild(listItem);
        console.log("Displayed friend request with Accept/Decline buttons for:", senderId); // Log display confirmation
    }
    


// Listen for the new chat room creation event from the server
socket.on('newChatRoom', ({ roomId }) => {
    addRoomOption(roomId); // Add new room to the dropdown
    joinRoom(roomId); // Automatically join the new private chat room
    console.log(`Switched to new private room: ${roomId}`);
});

// Function to add a new room option to the dropdown
function addRoomOption(roomId) {
    const roomSelect = document.getElementById('room-select');
    const optionExists = Array.from(roomSelect.options).some(option => option.value === roomId);

    if (!optionExists) {
        const newOption = document.createElement('option');
        newOption.value = roomId;
        newOption.textContent = `Private Room with ID ${roomId}`; // Display a meaningful label
        roomSelect.appendChild(newOption);
    }
    
    // Set the new room as the selected option
    roomSelect.value = roomId;
}

// Function to join a room and clear/load chat history
function joinRoom(room) {
    currentRoom = room;
    socket.emit('joinRoom', room);
    console.log(`Joined room: ${room}`);

    const messagesList = document.getElementById('messages');
    if (messagesList) {
        messagesList.innerHTML = ''; // Clear previous messages
    }
    
    // Request chat history for the new room
    socket.emit('requestChatHistory', room);
}

// Event listener to switch rooms when selecting from the dropdown
document.getElementById('room-select').addEventListener('change', (event) => {
    joinRoom(event.target.value);
});


    const deleteAllMessagesButton = document.getElementById('deleteAllMessages');
    if (deleteAllMessagesButton) {
        deleteAllMessagesButton.addEventListener('click', function() {
            const messagesList = document.getElementById('messages');
            if (messagesList) {
                messagesList.innerHTML = '';
                socket.emit('clear messages', currentRoom);
            }
        });
    }

    socket.on('chat message', function(data) {
        if (data.room === currentRoom) {
            addChatMessage(data);
        }
    });
    

    // Listen for clear messages event
    socket.on('clear messages', function() {
        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    });

    // Load chat history when joining a room
    socket.on('chat history', function(messages) {
        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.innerHTML = '';
            messages.forEach((msg) => addChatMessage(msg));
        }
    });

    // Tic-Tac-Toe functionality
    const playTictactoeButton = document.getElementById('playTictactoe');
    if (playTictactoeButton) {
        playTictactoeButton.addEventListener('click', () => {
            playTictactoeButton.disabled = true;
            playTictactoeButton.textContent = 'Waiting for an opponent...';
            socket.emit('findTictactoeOpponent');
        });
    }

    socket.on('startTictactoeGame', (data) => {
        roomID = data.roomID;
        const playerSymbol = data.playerSymbol;
        const isFirstTurn = data.isFirstTurn;

        playTictactoeButton.disabled = false;
        playTictactoeButton.textContent = 'Play Tic-Tac-Toe';

        const ticTacToeWindow = window.open('tictactoe.html', 'Tic-Tac-Toe Game', 'width=400,height=400');
        ticTacToeWindow.onload = () => {
            ticTacToeWindow.initGame(socket, roomID, playerSymbol, isFirstTurn);
        };
    });

    socket.on('moveMade', ({ row, col, player }) => {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) cell.textContent = player;
    });

    socket.on('tictactoeWaitTimeout', () => {
        playTictactoeButton.disabled = false;
        playTictactoeButton.textContent = 'Play Tic-Tac-Toe';
        alert('No opponents found. Try again later.');
    });

    socket.on('opponentDisconnected', () => {
        alert("Your opponent disconnected. Game over.");
    });

    joinRoom(currentRoom); // Join the default room on load
});

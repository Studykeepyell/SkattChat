const socket = io();

document.addEventListener('DOMContentLoaded', () => {

    let lastMessageDate = '';
    let currentRoom = null;
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


 // Add "Send Friend Request" button
 if (data.userId && data.userId !== localStorage.getItem('userId')) { // Check userId and prevent self-request
    const friendRequestButton = document.createElement('button');
    friendRequestButton.className = 'friend-request-button';
    friendRequestButton.textContent = 'Add Friend';
    friendRequestButton.onclick = () => sendFriendRequest(data.userId); // Pass data.userId as recipientId
    messageContainer.appendChild(friendRequestButton);
}


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

async function loadFriends(username) {
    try {
        const response = await fetch(`/api/friends/${username}`);
        const friends = await response.json();

        const friendsListDiv = document.getElementById('friendsList');
        friendsListDiv.innerHTML = ''; // Clear existing friends

        // Create a list of friends
        friends.forEach(friend => {
            const friendDiv = document.createElement('div');
            friendDiv.classList.add('friend');
            friendDiv.textContent = friend.username; // Display friend's name or username
            friendsListDiv.appendChild(friendDiv);
        });
    } catch (err) {
        console.error('Error loading friends:', err);
    }
}
const username = localStorage.getItem('username');
    if (userId) {
        loadFriends(username);
    }

// Listen for the new chat room creation event from the server
socket.on('newChatRoom', ({ roomId }) => {
addRoomOption(roomId); // Add new room to the dropdown
joinRoom(roomId); // Automatically join the new private chat room
console.log(`Switched to new private room: ${roomId}`);
});
function addRoomOption(roomId) {
    const roomButtonsContainer = document.getElementById('room-buttons');    
  // Check if roomButtonsContainer exists and is valid
  if (!roomButtonsContainer) {
    console.error("Element with ID 'room-buttons' not found.");
    return;
  }
  
    // Check if a button for the room already exists
  const roomExists = Array.from(roomButtonsContainer.children).some(button => button.dataset.roomId === roomId);

  
  if (!roomExists) {
    // Create a new button for the room
    const newRoomButton = document.createElement('button');
    newRoomButton.classList.add('chat-room-button');
    newRoomButton.dataset.roomId = roomId;
    newRoomButton.textContent = `Room ${roomId}`; // Set button text

    // Add click event listener to join the room
    newRoomButton.addEventListener('click', () => {
      joinRoom(roomId);
    });

    // Append the new button to the room buttons container
    roomButtonsContainer.appendChild(newRoomButton);
  }

  console.log(`Added new button for room: ${roomId}`);
}


function joinRoom(roomId) {
    if (currentRoom === roomId) return; // Avoid re-joining the same room
  
    currentRoom = roomId; // Update the active room
    console.log(`Switching to room: ${roomId}`);
  
    socket.emit('joinRoom', roomId); // Emit event to server to join the room
  
    clearChatDisplay(); // Clear messages from previous room
    loadRoomMessages(roomId); // Load messages for the new room
  }
  socket.on('chat message', (data) => {
    const { room, username, message, timestamp } = data;
  
    // Only display messages for the current room
    if (room === currentRoom) {
        displayMessage({ username, message, timestamp });
    }
  });

  const generalButton = document.getElementById('general-button');
  const randomButton = document.getElementById('random-button');
  const gamingButton = document.getElementById('gaming-button');
  const musicButton = document.getElementById('music-button');

  if (generalButton) {
      generalButton.addEventListener('click', () => joinRoom('General'));
  }
  if (randomButton) {
      randomButton.addEventListener('click', () => joinRoom('Random'));
  }
  if (gamingButton) {
      gamingButton.addEventListener('click', () => joinRoom('Gaming'));
  }
  if (musicButton) {
      musicButton.addEventListener('click', () => joinRoom('Music'));
  }


// Function to display a message on the screen
function displayMessage({ username, message, timestamp }) {
    const messagesList = document.getElementById('messages');

    const messageItem = document.createElement('li');
    messageItem.textContent = `[${new Date(timestamp).toLocaleTimeString()}] ${username}: ${message}`;
    messagesList.appendChild(messageItem);
}


function clearChatDisplay() {
    const messagesList = document.getElementById('messages');
    if (messagesList) {
        messagesList.innerHTML = ''; // Clear previous messages
    }
}


function loadRoomMessages(roomId) {
    console.log(`Loading messages for room: ${roomId}`);
    socket.emit('requestChatHistory', roomId); // Request history from server
  }
  
  socket.on('chat history', (messages) => {
    messages.forEach((message) => {
        displayMessage(message); // Display each message in the history
    });
  });
  




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

    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('messageForm'); // Updated to match the HTML
    const deleteAllMessagesButton = document.getElementById('deleteAllMessages');
    const messagesList = document.getElementById('messages');

    if (chatForm && messageInput) {
        chatForm.addEventListener('submit', function(event) {
            event.preventDefault();
            sendMessage(); // Call sendMessage to handle sending
        });
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        const room = currentRoom;
        const username = localStorage.getItem('username');
        const userId = localStorage.getItem('userId');

        if (!room || !username || !userId) {
            console.error("Error: Missing required fields 'room', 'username', or 'userId'");
            console.log({ room, username, userId });
            return;
        }

        const messageData = {
            room,
            username,
            userId,
            message,
            timestamp: new Date().toISOString()
        };

        console.log('Sending message:', messageData);
        socket.emit('chat message', messageData);
        messageInput.value = ''; // Clear the input after sending
    }

    if (deleteAllMessagesButton) {
        deleteAllMessagesButton.addEventListener('click', () => {
            socket.emit('clear messages');
        });
    }
// Attach event listener to the form submission
document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form from reloading the page
    sendMessage(); // Call the sendMessage function
});


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

    document.getElementById('addFriendButton').addEventListener('click', function() {
        window.location.href = '/addFriend.html';
      });
      
});
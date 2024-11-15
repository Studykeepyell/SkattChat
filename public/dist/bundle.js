const socket = io();

document.addEventListener('DOMContentLoaded', () => {

    let lastMessageDate = '';
    let currentRoom = null;


    const userId = localStorage.getItem('userId');
    if (userId) {
        socket.emit('registerUser', userId);
    }

    loadFriendRequests(); // Load initial friend requests

    // Function to fetch the profile image for a user
    async function fetchProfileImage(userId) {
        if (!userId) {
            console.error("fetchProfileImage: userId is undefined. Returning default image.");
            return '/default-profile.jpg'; // Return a default image URL
        }
    
        try {
            const response = await fetch(`/api/getUserProfileImage/${userId}`);
            const data = await response.json();
    
            if (data.success) {
                return data.profileImage;
            } else {
                console.error("fetchProfileImage: Profile image not found for userId:", userId);
                return '/default-profile.jpg'; // Return a default image URL if not found
            }
        } catch (error) {
            console.error("Error fetching profile image:", error);
            return '/default-profile.jpg'; // Return a default image in case of error
        }
    }
    




// Function to add a new chat message to the messages container
async function addChatMessage(data) {
    console.log('Adding chat message:', data);

    const messagesList = document.getElementById('messages');
    if (!messagesList) {
        console.error("Error: 'messages' element not found.");
        return;
    }
    

    const messageDate = formatMessageDate(data.timestamp);

    // Create a date header if the date changes
    if (messageDate !== lastMessageDate) {
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.textContent = messageDate;
        messagesList.appendChild(dateHeader);
        lastMessageDate = messageDate;
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';

    // User Info Container
    const userInfoContainer = document.createElement('div');
    userInfoContainer.className = 'user-info-container';

    // Profile picture
    const characterPicture = document.createElement('img');
    characterPicture.className = 'character-picture';
    characterPicture.alt = `${data.username}'s profile picture`;

    // Fetch and set the user's profile image if available
    const profileImageUrl = await fetchProfileImage(data.userId);
    characterPicture.src = profileImageUrl || 'default-profile.jpg'; // Fallback image if no URL

    // Username and Timestamp
    const username = document.createElement('h2');
    username.className = 'username';
    username.textContent = data.username;

    const timeText = document.createElement('h4');
    timeText.className = 'timestamp';
    timeText.textContent = formatTimestamp(data.timestamp);

    userInfoContainer.append(characterPicture, username, timeText);

    // Message Content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = data.message;

    // Append message content and user info to the message container
    messageContainer.append(userInfoContainer, messageContent);

    // Friend Request Button
    const friendRequestButton = document.createElement('button');
    friendRequestButton.className = 'friend-request-button';
    friendRequestButton.textContent = 'Add Friend';
    friendRequestButton.onclick = () => sendFriendRequest(data.userId); // Ensure sendFriendRequest is defined
    messageContainer.appendChild(friendRequestButton);

    // AI Action Button
    const actionButton = document.createElement('button');
    actionButton.className = 'action-button';
    actionButton.style.marginRight = '10px';
    actionButton.textContent = 'Get AI Response';

    actionButton.addEventListener('click', async () => {
        try {
            console.log("Making request to:", '/api/get-opinion');
            const response = await fetch('/api/get-opinion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: data.message, roomId: data.roomId, username: data.username })
            });
            const result = await response.json();
            // Add AI response as a new message
            addChatMessage({
                username: "AttyAI",
                message: `Response to ${data.username}: "${data.message}" - ${result.opinion}`,
                timestamp: Date.now(),
                roomId: data.roomId || "general" // Use data.roomId or a default
            });
        } catch (error) {
            console.error('Error fetching ChatGPT opinion:', error);
        }
    });
    messageContainer.appendChild(actionButton);

    // Append the message container to the messages list
    messagesList.appendChild(messageContainer);
    messagesList.scrollTop = messagesList.scrollHeight; // Scroll to the latest message
}









 
 
    

socket.on('friendRequestReceived', (data) => {
    console.log("Friend request received from:", data.senderId); // Log request
    displayFriendRequest(data.senderId);
});

socket.on('newFriendRequest', (data) => {
    console.log("Received new friend request:", data.message); // Log notification
    loadFriendRequests(); // Refresh the friend request list
});


async function respondToFriendRequest(requestId, status, senderId, receiverId) {
    console.log('Responding to friend request:', { requestId, status, senderId, receiverId });

    try {
        const response = await fetch('/api/users/friends/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, status, senderId, receiverId })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to respond to friend request: ${errorMessage}`);
        }

        const data = await response.json();
        console.log('Friend request response successful:', data);
    } catch (error) {
        console.error('Error responding to friend request:', error);
    }
}








function displayFriendRequest(request) {
    const requestItem = document.createElement('li');

    // Display sender info
    const senderInfo = document.createElement('span');
    senderInfo.innerText = `Friend request from ${request.senderId.username}`;

    // Accept button
    const acceptButton = document.createElement('button');
    acceptButton.innerText = 'Accept';
    acceptButton.addEventListener('click', async () => {
        await respondToFriendRequest(request._id, 'accepted', request.senderId._id, request.receiverId);
    
        // Remove the request from the UI
        requestItem.remove();
    
        console.log(`Friend request ${request._id} accepted and removed from UI.`);
    });

    // Decline button
    const declineButton = document.createElement('button');
    declineButton.innerText = 'Decline';
    declineButton.addEventListener('click', async () => {
        await respondToFriendRequest(request._id, 'declined', request.senderId._id, request.receiverId);
    
        // Remove the request from the UI
        requestItem.remove();
    
        console.log(`Friend request ${request._id} accepted and removed from UI.`);
    });

    // Append elements to the request item
    requestItem.appendChild(senderInfo);
    requestItem.appendChild(acceptButton);
    requestItem.appendChild(declineButton);

    // Append request item to the friend request list
    const friendRequestList = document.getElementById('friendRequestList');
    friendRequestList.appendChild(requestItem);

    console.log("Added friend request to the list:", request);
}




// Handle new chat room creation
socket.on('newChatRoom', (room) => {
    console.log('New chat room received:', room);

    // Find the chat room list element
    const chatRoomList = document.getElementById('chatRoomList'); // Adjust the ID if necessary

    // Create a new list item for the room
    const roomItem = document.createElement('li');
    roomItem.textContent = room.name; // Use the room name or a custom label
    roomItem.dataset.roomId = room.roomId;

    // Add a button to join the room
    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join';
    joinButton.addEventListener('click', () => {
        joinChatRoom(room.roomId); // Function to handle joining the room
    });

    roomItem.appendChild(joinButton);
    chatRoomList.appendChild(roomItem);

    console.log('New chat room added to the UI.');
});

function joinChatRoom(roomId) {
    if (!roomId) {
        console.error("Room ID is missing when trying to join a room.");
        return;
    }

    console.log(`Joining chat room: ${roomId}`);
    localStorage.setItem('currentRoom', roomId); // Store the current room ID

    const messagesList = document.getElementById('messages');
    if (messagesList) {
        messagesList.innerHTML = ''; // Clear previous messages
    }

    fetch(`/api/chat/rooms/${roomId}/messages`)
        .then(response => {
            console.log('Fetch response status:', response.status); // Debug log
            if (!response.ok) {
                throw new Error(`Failed to fetch messages: ${response.statusText}`);
            }
            return response.json();
        })
        .then(messages => {
            console.log(`Messages fetched for room ${roomId}:`, messages); // Debug log
            messages.forEach(message => addChatMessage(message)); // Add messages to UI
        })
        .catch(error => console.error('Error loading messages:', error));

    // Notify the server about joining the room
    socket.emit('joinRoom', { roomId });
    console.log(`Joined chat room: ${roomId}`);
}











async function sendFriendRequest(receiverId) {
    const senderId = localStorage.getItem('userId'); // Get the sender's userId

    console.log("Sending friend request to:", receiverId);
    console.log("Sender ID:", senderId);

    if (!senderId || !receiverId) {
        console.error("Error: Missing senderId or receiverId");
        return;
    }

    try {
        const response = await fetch(`/api/users/friends/${receiverId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        console.log("Friend request response:", data);

        if (data.success) {
            alert('Friend request sent successfully!');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error sending friend request:", error);
    }
}







async function loadFriendRequests() {
    const userId = localStorage.getItem('userId'); // Get the logged-in user's ID

    try {
        const response = await fetch(`/api/users/friends/requests/${userId}`);
        if (!response.ok) throw new Error(`Failed to load friend requests: ${response.statusText}`);
        
        const data = await response.json();
        const friendRequestList = document.getElementById('friendRequestList');

        // Log to confirm the friend request list is being accessed
        console.log("Friend request list element:", friendRequestList);

        if (friendRequestList) {
            friendRequestList.innerHTML = ''; // Clear any existing requests
        } else {
            console.error("friendRequestList element not found in the DOM.");
            return;
        }

        // Log to confirm the number of requests retrieved
        console.log("Number of friend requests received:", data.friendRequests.length);

        // Loop through each friend request and display it
        data.friendRequests.forEach(request => {
            displayFriendRequest(request); // Use existing function to display each request
        });
    } catch (error) {
        console.error("Error loading friend requests:", error);
    }
}





async function loadFriends(userId) {
    try {
        const response = await fetch(`/api/users/friends/${userId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();

        const friendsListDiv = document.getElementById('friendsList');
        friendsListDiv.innerHTML = ''; // Clear existing content

        // Check if friends data exists and has items
        if (data.friends && data.friends.length > 0) {
            data.friends.forEach(friend => {
                const friendDiv = document.createElement('div');
                friendDiv.classList.add('friend');
                friendDiv.textContent = friend.username; // Adjust as needed to display friend info
                friendsListDiv.appendChild(friendDiv);
            });
        } else {
            // Display message if no friends are found
            const noFriendsMessage = document.createElement('p');
            noFriendsMessage.textContent = 'No friends found';
            friendsListDiv.appendChild(noFriendsMessage);
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}



// Get userId from localStorage and load friends
if (userId) {
    loadFriends(userId);
} else {
    console.error('User ID not found in localStorage');
}


socket.on('newChatRoom', (room) => {
    console.log('New chat room created:', room);

    // Find the chat room list element
    const chatRoomList = document.getElementById('chatRoomList');

    // Create a new list item for the room
    const roomItem = document.createElement('li');
    roomItem.textContent = room.name; // Use room name or custom display logic
    roomItem.dataset.roomId = room.roomId;

    // Add a button to join the room
    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join';
    joinButton.addEventListener('click', () => {
        joinChatRoom(room.roomId);
    });

    roomItem.appendChild(joinButton);
    chatRoomList.appendChild(roomItem);

    console.log('New chat room added to the UI.');
});




function joinChatRoom(roomId) {
    console.log(`Joining chat room: ${roomId}`);
    localStorage.setItem('currentRoom', roomId);

    // Clear previous messages
    const messagesList = document.getElementById('messages');
    if (messagesList) {
        messagesList.innerHTML = ''; // Clear previous messages
    }

    // Fetch messages for the room
    fetch(`/api/chat/rooms/${roomId}/messages`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch messages: ${response.statusText}`);
            }
            return response.json();
        })
        .then(messages => {
            console.log('Fetched messages:', messages);
            if (Array.isArray(messages)) {
                messages.forEach(message => addChatMessage(message));
            }
        })
        .catch(error => console.error('Error loading messages:', error));
}






const generalButton = document.getElementById('general-button');
const randomButton = document.getElementById('random-button');
const gamingButton = document.getElementById('gaming-button');
const musicButton = document.getElementById('music-button');

if (generalButton) {
    generalButton.addEventListener('click', () => {
        console.log('General button clicked');
        joinChatRoom('general');
    });
}
if (randomButton) {
    randomButton.addEventListener('click', () => {
        console.log('Random button clicked');
        joinChatRoom('random');
    });
}
if (gamingButton) {
    gamingButton.addEventListener('click', () => {
        console.log('Gaming button clicked');
        joinChatRoom('gaming');
    });
}
if (musicButton) {
    musicButton.addEventListener('click', () => {
        console.log('Music button clicked');
        joinChatRoom('music');
    });
}





function loadChatRooms() {
    const userId = localStorage.getItem('userId'); // Replace with your user ID logic

    fetch(`/api/users/getUserRooms/${userId}`)
        .then(response => response.json())
        .then(rooms => {
            const chatRoomList = document.getElementById('chatRoomList');
            chatRoomList.innerHTML = ''; // Clear existing rooms

            rooms.forEach(room => {
                const roomItem = document.createElement('li');
                roomItem.textContent = room.name;
                roomItem.dataset.roomId = room.roomId;

                const joinButton = document.createElement('button');
                joinButton.textContent = 'Join';
                joinButton.addEventListener('click', () => {
                    joinChatRoom(room.roomId);
                });

                roomItem.appendChild(joinButton);
                chatRoomList.appendChild(roomItem);
            });

            console.log('Chat rooms loaded:', rooms);
        })
        .catch(error => console.error('Error loading chat rooms:', error));
}

// Call this function on page load
loadChatRooms();




// Function to load historical messages

  




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
        const messageInput = document.getElementById('messageInput');
        const message = messageInput?.value.trim();
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const roomId = localStorage.getItem('currentRoom');
        const timestamp = Date.now();
    
        if (!message || !userId || !username || !roomId) {
            console.error('Missing data to send message:', { message, userId, username, roomId });
            alert('Please enter a message before sending.');
            return;
        }
    
        console.log('Emitting chat message:', { roomId, username, userId, message, timestamp });
    
        socket.emit('chat message', { roomId, username, userId, message, timestamp });
    
        messageInput.value = '';
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

    

    socket.on('chat message', (data) => {
        console.log('New chat message received:', data);
        addChatMessage(data); // Add the message to the UI
    });
    
    
    socket.on('connect', () => {
        console.log("Connected to server");
    
        // Join the selected room when connected
        const roomId = localStorage.getItem('currentRoom');
        if (roomId) {
            socket.emit('joinRoom', { roomId });
        }
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
import { fetchProfileImage, formatTimestamp, formatMessageDate } from '../utils/utils.js';


export async function addChatMessage(data) {
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

export async function createChatRoom(roomName, userId, socket) {
    try {
        const response = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName, userId }),
        });

        const data = await response.json();
        if (data.success) {
            socket.emit('joinRoom', { roomId: data.room.roomId });
            alert(`Chat room "${roomName}" created successfully!`);
        } else {
            alert('Failed to create chat room.');
        }
    } catch (error) {
        console.error('Error creating chat room:', error);
    }
}

export function displayChatRoom(room, container) {
    const roomElement = document.createElement('div');
    roomElement.className = 'chat-room';
    roomElement.textContent = room.name;

    roomElement.addEventListener('click', () => {
        localStorage.setItem('currentRoom', room.roomId);
        location.reload();
    });

    container.appendChild(roomElement);
}

export async function sendAIMessage(socket, roomId, username, message) {
    const aiMessage = await getAIResponse(message, roomId, username);
    socket.emit('chat message', { roomId, username: 'AI', message: aiMessage, timestamp: Date.now() });
}


export async function joinChatRoom(socket, roomId) {
    if (!roomId) {
        console.error('Room ID is required to join a chat room.');
        return;
    }

    // Save the active room to local storage
    localStorage.setItem('currentRoom', roomId);

    // Clear chat messages from the previous room
    const messagesList = document.getElementById('messages');
    if (messagesList) messagesList.innerHTML = '';

    // Emit the event to join the room
    socket.emit('joinRoom', { roomId });

    // Fetch chat history for the new room
    try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
        const data = await response.json();

        if (response.ok && data.messages) {
            // Display chat history
            data.messages.forEach((message) => {
                addChatMessage(message); // Assuming `addChatMessage` handles rendering
            });
        } else {
            console.warn('No chat history available for this room.');
        }
    } catch (error) {
        console.error('Error fetching chat history:', error);
    }

    console.log(`Joined chat room: ${roomId}`);
}



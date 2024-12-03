// chat.js
const { fetchProfileImage, formatTimestamp, formatMessageDate, formatMessageTime } = require('../utils/utils.js');
const { ChatRoom } = require('./chatRooms.js');
const io = require('socket.io-client');

function addChatMessage(data) {
    const messagesList = document.getElementById('messages');
    if (!messagesList) {
        console.error("Error: 'messages' element not found.");
        return;
    }

    const lastDateSeparator = messagesList.querySelector('.date-separator:last-of-type')
    const lastMessageDate = lastDateSeparator ? lastDateSeparator.textContent : null;
    // Create the message element
    const elements = createMessageElement(data,lastMessageDate);
    if (!elements) {
        console.error('Failed to create message element. Skipping:', data);
        return;
    }

   // Append all elements to the messages list
   elements.forEach(element => messagesList.appendChild(element));
   messagesList.scrollTop = messagesList.scrollHeight;
};

function createMessageElement(data,lastMessageDate) {
    const { username, userId, content, timestamp } = data;
    if (!username || !content || !timestamp) {
        console.error('Invalid data for creating message element:', data);
        return null;
    }

    const elements = [];
    const currentMessageDate = formatMessageDate(timestamp);

    if(currentMessageDate !== lastMessageDate){
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'data-separator';
        dateSeparator.textContent = currentMessageDate;
        elements.push(dateSeparator)
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';

    const usernameElement = document.createElement('h2');
    usernameElement.className = 'username';
    usernameElement.textContent = username;

    const messageContentElement = document.createElement('div');
    messageContentElement.className = 'message-content';
    messageContentElement.textContent = content;

    const timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = formatMessageTime(timestamp);

    messageContainer.append(usernameElement, messageContentElement, timestampElement);
    elements.push(messageContainer);

    return elements;
}


async function updateRoomTimestamp(roomId, timestamp) {
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        let timestampElement = roomElement.querySelector('.room-timestamp');
        if (!timestampElement) {
            timestampElement = document.createElement('span');
            timestampElement.className = 'room-timestamp';
            roomElement.appendChild(timestampElement);
        }
        timestampElement.textContent = new Date(timestamp).toLocaleString();
    
        // Add notification icon for inactive rooms
        if (!roomElement.classList.contains('active-room')) {
            const roomNameElement = roomElement.querySelector('.room-name');
            if (roomNameElement && !roomNameElement.querySelector('.new-message-icon')) {
                roomNameElement.innerHTML += '<span class="new-message-icon" aria-label="New message">🔔</span>';
            }
        }
    }
}


async function fetchMessages(roomId) {
    console.log('Fetching messages for room:', roomId);

    try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success && data.messages) {
            console.log('Fetched messages:', data.messages);
            const messagesList = document.getElementById('messages');
            if (messagesList) {
                messagesList.innerHTML = ''; // Clear existing messages
                data.messages.forEach((message) => {
                    addChatMessage({
                        username: message.username,
                        content: message.message,
                        timestamp: message.timestamp,
                    });
                });
            }
        } else {
            console.warn('No messages found or fetch failed.');
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

const fetchChatRooms = async () => {
    const baseURL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://skattchat.online';
        
    try {
        console.log('Fetching chat rooms from:', `${baseURL}/api/chat/rooms`);
        const response = await fetch(`${baseURL}/api/chat/rooms`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        throw error;
    }
};

async function createChatRoom(roomName, userId, socket) {
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

function displayChatRoom(room, container) {
    const roomElement = document.createElement('div');
    roomElement.className = 'chat-room';
    roomElement.textContent = room.name;

    roomElement.addEventListener('click', () => {
        localStorage.setItem('currentRoom', room.roomId);

        joinChatRoom(socket, room.roomId); // Fetch and display chat room messages
    });

    container.appendChild(roomElement);
}

async function sendMessage(roomId, userId, username, message, timestamp) {
    try {
        // Validate inputs
        if (!roomId || !userId || !message || !timestamp) {
            throw new Error('All fields are required.');
        }

        const payload = {
            roomId,
            userId,
            username,
            message,
            timestamp,
        };

        console.log('Sending message payload:', payload);

        // Send the payload to the backend
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Message sent successfully:', data.message);
        } else {
            console.error('Failed to send message:', data.message);
        }
    } catch (error) {
        console.error('Error in sendMessage:', error.message);
    }
}

async function joinChatRoom(roomId) {
    if (!roomId) {
        console.error('Room ID is required to join a chat room.');
        return;
    }

    console.log(`Joining room with ID: ${roomId}`);
    socket.emit('joinRoom', roomId);

    // Fetch and display messages for the room
    await fetchMessages(roomId);
}

const setupSocket = () => {
    const socketOptions = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: '/socket.io',
        auth: {
            token: localStorage.getItem('authToken')
        }
    };

    const serverUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://skattchat.online';

    try {
        const socket = io(serverUrl, socketOptions);
        
        socket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        return socket;
    } catch (error) {
        console.error('Socket initialization error:', error);
        return null;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing chat application...');
        const socket = setupSocket();
        if (!socket) throw new Error('Failed to initialize socket connection');
        
        const rooms = await fetchChatRooms();
        console.log('Chat rooms loaded:', rooms);
        
        setupCreateRoomHandler(socket);
        setupFriendRequestHandlers(socket);
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

module.exports = {
    addChatMessage,
    createChatRoom,
    sendMessage,
    joinChatRoom,
    fetchChatRooms,
    setupSocket
};

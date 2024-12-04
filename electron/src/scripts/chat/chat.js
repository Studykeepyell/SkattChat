// chat.js
import { fetchProfileImage, formatTimestamp, formatMessageDate, formatMessageTime } from '../utils/utils.js';
import { ChatRoom } from './chatRooms.js';
import { io } from 'socket.io-client';
import { createMessageHandler } from './messageHandler.js';
import { setupChatSocket } from './chatSocket.js';

function createMessageElement(data, lastMessageDate) {
    const { username, userId, content, timestamp } = data;
    if (!username || !content || !timestamp) {
        console.error('Invalid data for creating message element:', data);
        return null;
    }

    const elements = [];
    const currentMessageDate = formatMessageDate(timestamp);

    if (currentMessageDate !== lastMessageDate) {
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'data-separator';
        dateSeparator.textContent = currentMessageDate;
        elements.push(dateSeparator);
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

// Export the addChatMessage function at module level
async function addChatMessage(data) {
    const messagesList = document.getElementById('messages');
    if (!messagesList) {
        console.error("Error: 'messages' element not found.");
        return;
    }

    const lastDateSeparator = messagesList.querySelector('.date-separator:last-of-type');
    const lastMessageDate = lastDateSeparator ? lastDateSeparator.textContent : null;

    const elements = createMessageElement(data, lastMessageDate);
    if (!elements) return;

    elements.forEach(element => messagesList.appendChild(element));
    messagesList.scrollTop = messagesList.scrollHeight;
}

// Add this utility function for error messages
const showErrorMessage = (message) => {
    const errorDiv = document.getElementById('error-messages') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
};

const createErrorDiv = () => {
    const div = document.createElement('div');
    div.id = 'error-messages';
    div.className = 'error-message';
    document.body.appendChild(div);
    return div;
};

// Update fetch messages to use the correct API path
async function fetchMessages(roomId) {
    const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://skattchat.online';
    
    try {
        const response = await fetch(`${baseURL}/api/chat/rooms/${roomId}/messages`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
        console.error(`Failed to fetch messages for room ${roomId}:`, error);
        return [];
    }
}

let globalSocket = null;

export const setSocket = (socket) => {
    globalSocket = socket;
};

const fetchChatRooms = async () => {
    const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://skattchat.online';

    try {
        if (!globalSocket) {
            throw new Error('Socket not initialized');
        }

        const response = await fetch(`${baseURL}/api/chat/rooms`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const data = await response.json();
        if (data.success && data.rooms) {
            console.log('Fetched rooms:', data.rooms); // Debug log
            const container = document.getElementById('roomList');
            if (container) {
                container.innerHTML = ''; // Clear previous entries
                data.rooms.forEach((room) => {
                    console.log(`Room rendered: ${room.name} with ID ${room.roomId}`); // Debug room details
                    ChatRoom.display(room, container); // Adjust to your rendering logic
                });
            }
        } else {
            console.warn('No rooms found or fetch failed.');
        }
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        throw error;
    }
};

const createChatRoom = async (roomName, userId) => {
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

// First fix the sendMessage function URL interpolation
const sendMessage = async (roomId, userId, username, message,timestamp) => {
    try {
        if (!roomId || !userId || !message) {
            throw new Error('Missing required fields for message');
        }

        const baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000'
            : 'https://skattchat.online';


            const payload = {
                roomId,
                userId,
                username,
                message,
                timestamp,
            };
    
            console.log('Sending message payload:', payload);

        const response = await fetch(`${baseURL}/api/chat/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
};

// Update joinChatRoom with debug logging
async function joinChatRoom(socket, roomId) {
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
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: '/socket.io/'
    };

    const serverUrl = window.location.hostname === 'localhost'
        ? 'ws://localhost:3000'
        : 'wss://skattchat.online';

    try {
        const socket = io(serverUrl, socketOptions);
        const messageHandler = createMessageHandler();
        setupChatSocket(socket, messageHandler);
        return socket;
    } catch (error) {
        console.error('Socket initialization error:', error);
        return null;
    }
};

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



// Helper function to create message container
const createMessageContainer = () => {
    const container = document.createElement('div');
    container.id = 'chat-messages';
    container.className = 'chat-messages';
    
    const messagesArea = document.querySelector('.message-display');
    if (messagesArea) {
        messagesArea.appendChild(container);
    } else {
        document.body.appendChild(container);
    }
    
    return container;
};

// Utility function to sanitize HTML and prevent XSS
const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// Utility function to get current user ID
const getCurrentUserId = () => {
    return localStorage.getItem('userId') || '';
};

// Add this new function to chat.js
const updateChatUI = (room, roomId) => {
    // Update chat heading
    const chatHeading = document.getElementById('chat-heading');
    if (chatHeading) {
        const roomName = typeof room === 'object' && room.name 
            ? room.name 
            : `Room ${roomId}`;
        chatHeading.textContent = roomName;
    }

    // Update active room selection
    const roomElements = document.querySelectorAll('.chat-room');
    roomElements.forEach(el => {
        el.classList.remove('active-room');
        if (el.dataset.roomId === roomId) {
            el.classList.add('active-room');
            // Clear any notification indicators
            const notificationIcon = el.querySelector('.new-message-icon');
            if (notificationIcon) {
                notificationIcon.remove();
            }
        }
    });

    // Clear message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = '';
    }

    // Store current room in localStorage
    localStorage.setItem('currentRoom', roomId);

    // Update room info section if it exists
    const roomInfo = document.getElementById('room-info');
    if (roomInfo && typeof room === 'object') {
        roomInfo.innerHTML = `
            <div class="room-details">
                <h3>${sanitizeHTML(room.name)}</h3>
                <span class="member-count">${room.memberCount || 0} members</span>
            </div>
        `;
    }
};

// Add this CSS for styling
const style = document.createElement('style');
style.textContent = `
    .active-room {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
    }
    
    .room-details {
        padding: 10px;
        border-bottom: 1px solid #eee;
    }
    
    .member-count {
        color: #666;
        font-size: 0.9em;
    }
`;
document.head.appendChild(style);

// friends.js
const setupSocketFriends = () => {
    const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://skattchat.online';

    return io(baseURL, {
        transports: ['websocket'],
        withCredentials: true,
        autoConnect: true
    });
};

const socketFriends = setupSocketFriends();

async function sendFriendRequest(receiverId) {
    const senderId = localStorage.getItem('userId');
    const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : 'https://skattchat.online';

    console.log("Sending friend request to:", receiverId);
    console.log("Sender ID:", senderId);

    if (!senderId || !receiverId) {
        console.error("Error: Missing senderId or receiverId");
        return;
    }

    try {
        const response = await fetch(`${baseURL}/api/users/friends/${receiverId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ senderId })
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
}

// Single export statement at the end
export {
    createChatRoom,
    sendMessage,
    joinChatRoom,
    fetchChatRooms,
    setupSocket,
    displayChatRoom,
    updateRoomTimestamp,
    fetchMessages,
    addChatMessage,  // Add this line
    sendFriendRequest  // Add this line
};

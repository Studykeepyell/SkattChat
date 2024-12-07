// chat-main.js
// Option 1: Import from node_modules (preferred)
import { io } from 'socket.io-client';

import { setupChatSocket } from './chat/chatSocket.js';
import { setupFriendSocket } from './friends/friendSocket.js';
import { loadFriendRequests } from './friends/friends.js';
import { 
    createChatRoom, 
    sendMessage, 
    joinChatRoom, 
    fetchChatRooms,
    setSocket
} from './chat/chat.js';

let socket = null;

const setupSocket = async () => {
    try {
        const baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000'
            : 'https://skattchat.online';

        // Try to use imported io
        return io(baseURL, {
            transports: ['websocket'],
            withCredentials: true
        });
    } catch (error) {
        console.error('Socket.io import failed, falling back to CDN:', error);
        // Load from CDN if import fails
        await loadSocketIOFromCDN();
        return window.io(baseURL, {
            transports: ['websocket'],
            withCredentials: true
        });
    }
};

function loadSocketIOFromCDN() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Single initialization point
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing chat application...');

    try {
        socket = await setupSocket();
        if (!socket) throw new Error('Failed to initialize socket');

        setSocket(socket);
        await fetchChatRooms(socket);
        await loadFriendRequests();
        setupChatSocket(socket);
        initializeRoomListeners();
        setupCreateRoomHandler(socket);
        setupFriendRequestHandlers(socket);
        setupChatFormHandler();

        console.log('Chat application fully initialized.');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

function setupChatFormHandler() {
    const chatForm = document.getElementById('chat-form');
    if (!chatForm) {
        console.error('Chat form not found');
        return;
    }

    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const message = messageInput.value.trim();
        const roomId = localStorage.getItem('currentRoom');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const timestamp = new Date().toISOString(); // Current timestamp

        if (!message || !roomId || !userId) {
            console.error('Missing required data for sending message');
            return;
        }

        if (message && roomId && userId) {
            console.log(`Sending message to room ${roomId}:`, message);
            sendMessage(roomId, userId, username, message, timestamp); // Correct
            messageInput.value = ''; // Clear input field
        } else {
            console.error('Message, roomId, or userId is missing!');
        }
    });
}

// Function to handle switching chat rooms
function initializeRoomListeners() {
    document.querySelectorAll('.chat-room').forEach((roomElement) => {
        roomElement.removeEventListener('click', handleRoomSwitch); // Prevent duplicate listeners
        roomElement.addEventListener('click', handleRoomSwitch);
    });
}

function handleRoomSwitch(e) {
    const roomId = e.currentTarget.dataset.roomId; // Get roomId from data attribute
    if (!roomId) {
        console.error('Room ID is missing!');
        return;
    }
    console.log(`Switching to room: ${roomId}`);
    localStorage.setItem('currentRoom', roomId); // Save selected roomId
    joinChatRoom(socket, roomId); // Call joinChatRoom with the roomId
}

// Function to handle creating new chat rooms
function setupCreateRoomHandler(socket) {
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            const roomName = prompt('Enter the room name:');
            if (roomName) {
                createChatRoom(roomName, localStorage.getItem('userId'), socket);
            }
        });
    }
}

// Function to handle friend request responses
function setupFriendRequestHandlers(socket) {
    const friendRequestList = document.getElementById('friendRequestList');
    if (friendRequestList) {
        friendRequestList.addEventListener('click', (e) => {
            if (e.target.classList.contains('accept')) {
                const requestId = e.target.dataset.requestId;
                respondToFriendRequest(requestId, 'accepted', socket);
            } else if (e.target.classList.contains('decline')) {
                const requestId = e.target.dataset.requestId;
                respondToFriendRequest(requestId, 'declined', socket);
            }
        });
    }
}
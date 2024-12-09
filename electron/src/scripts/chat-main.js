// chat-main.js
import { createSocket } from './lib/socket-client';
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
        if (typeof io === 'undefined') {
            throw new Error('Socket.IO not loaded');
        }

        const baseURL = 'http://localhost:3000';
        const socket = io(baseURL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            secure: true
        });

        // Setup basic socket event handlers
        socket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return socket;
    } catch (error) {
        console.error('Socket setup failed:', error);
        throw error;
    }
};

// Single initialization point
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing chat application...');

    try {
  
        
        // Initialize socket after Socket.IO is loaded
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

        // Setup socket error handling
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            alert('Failed to connect to chat server. Please check your connection.');
        });

        socket.on('reconnect_failed', () => {
            alert('Unable to reconnect to chat server. Please refresh the page.');
        });

        console.log('Chat application fully initialized.');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize chat. Please refresh the page.');
    }
});

function setupChatFormHandler() {
    const chatForm = document.querySelector('#chat-form');
    const messageInput = document.querySelector('#messageInput');

    if (!chatForm || !messageInput) {
        console.error('Chat form or message input not found');
        return;
    }

    // Define the handler function
    function handleSubmit(event) {
        event.preventDefault();

        const message = messageInput.value.trim();
        const roomId = localStorage.getItem('currentRoom');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        if (!message) {
            console.warn('Message is empty');
            return;
        }

        if (!roomId || !userId) {
            console.error('Missing room ID or user ID');
            return;
        }

        console.log('Sending message:', message);
        const timestamp = new Date().toISOString();
        sendMessage(roomId, userId, username, message, timestamp);
        messageInput.value = '';
        messageInput.focus();
    }

    // Remove existing listener if any
    chatForm.removeEventListener('submit', handleSubmit);
    // Attach the event listener
    chatForm.addEventListener('submit', handleSubmit);
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
    localStorage.setItem('currentRoom', roomId);
    // Ensure roomId is passed as a string
    joinChatRoom(socket, roomId.toString());
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
    }}
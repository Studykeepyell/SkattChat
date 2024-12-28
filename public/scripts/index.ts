import { setupChatSocket } from './chat/chatSocket';
import { setupFriendSocket } from './friends/friendSocket';
import { loadFriendRequests, respondToFriendRequest } from './friends/friends';
import { createChatRoom, sendMessage, joinChatRoom, fetchChatRooms } from './chat/chat';
import { io } from 'socket.io-client';

declare global {
    interface Window {
        socket: any;
    }
}

let isInitialized = false;

// Check if user is authenticated
function checkAuthentication() {
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!authToken || !userId) {
        console.error('Not authenticated. Redirecting to login...');
        window.location.href = '/pages/login.html';
        return false;
    }
    
    console.log('Authentication verified:', { userId });
    return true;
}

async function initializeSocket() {
    if (isInitialized) {
        console.log('Socket already initialized');
        return;
    }

    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }

    console.log('Starting socket initialization...');
    
    try {
        // Initialize socket with auth token
        const socket = io({
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: {
                token: localStorage.getItem('authToken')
            }
        });
        
        socket.on('connect', () => {
            console.log('Socket connected successfully');
            // Emit authentication event
            socket.emit('authenticate', {
                token: localStorage.getItem('authToken'),
                userId: localStorage.getItem('userId')
            });
        });

        socket.on('authenticated', () => {
            console.log('Socket authenticated successfully');
        });

        socket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error);
        });

        // Store socket globally
        window.socket = socket;

        setupChatSocket(socket);
        setupFriendSocket(socket);

        // Initialize chat functionality
        console.log('Initializing chat application...');
        try {
            // Fetch chat rooms immediately
            console.log('Fetching chat rooms...');
            await fetchChatRooms(socket);
            console.log('Setting up room listeners...');
            initializeRoomListeners();
            console.log('Loading friend requests...');
            await loadFriendRequests();
            console.log('Setting up handlers...');
            setupFriendRequestHandlers(socket);
            setupChatFormHandler(socket);
            setupCreateRoomHandler(socket);
            
            console.log('Chat application fully initialized.');
            isInitialized = true;
        } catch (error) {
            console.error('Error during chat initialization:', error);
            throw error;
        }
    } catch (error) {
        console.error('Failed to initialize socket:', error);
        alert('Failed to connect to chat server. Please refresh the page.');
        throw error;
    }
}

// Helper functions
function initializeRoomListeners() {
    document.querySelectorAll('.chat-room').forEach((roomElement) => {
        roomElement.removeEventListener('click', handleRoomSwitch);
        roomElement.addEventListener('click', handleRoomSwitch);
    });
}

function handleRoomSwitch(e: Event) {
    const roomId = (e.currentTarget as HTMLElement).dataset.roomId;
    if (!roomId) {
        console.error('Room ID is missing!');
        return;
    }
    console.log(`Switching to room: ${roomId}`);
    localStorage.setItem('currentRoom', roomId);
    joinChatRoom(window.socket, roomId);
}

function setupChatFormHandler(socket: any) {
    const chatForm = document.getElementById('chat-form');
    if (!chatForm) return;

    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageInput = document.getElementById('messageInput') as HTMLInputElement;
        const message = messageInput.value.trim();
        const roomId = localStorage.getItem('currentRoom');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const timestamp = new Date().toISOString();

        if (!roomId) {
            alert('Please select a chat room first!');
            return;
        }

        if (message && roomId && userId && username) {
            console.log(`Sending message to room ${roomId}:`, message);
            sendMessage(roomId, userId, username, message, timestamp);
            messageInput.value = '';
        } else {
            console.error('Message, roomId, userId, or username is missing!');
        }
    });
}

function setupCreateRoomHandler(socket: any) {
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (!createRoomBtn) return;

    createRoomBtn.addEventListener('click', () => {
        const roomName = prompt('Enter room name:');
        if (roomName) {
            const userId = localStorage.getItem('userId');
            if (userId) {
                createChatRoom(roomName, userId, socket);
            } else {
                console.error('User ID not found');
            }
        }
    });
}

function setupFriendRequestHandlers(socket: any) {
    const friendRequestList = document.getElementById('friendRequestList');
    if (!friendRequestList) return;

    friendRequestList.addEventListener('click', (e) => {
        if (e.target && (e.target as HTMLElement).classList.contains('accept')) {
            const requestId = (e.target as HTMLElement).dataset.requestId;
            respondToFriendRequest(requestId, 'accepted', socket);
        } else if (e.target && (e.target as HTMLElement).classList.contains('decline')) {
            const requestId = (e.target as HTMLElement).dataset.requestId;
            respondToFriendRequest(requestId, 'declined', socket);
        }
    });
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM Content Loaded - Initializing...');
        initializeSocket().catch(error => {
            console.error('Failed to initialize:', error);
        });
    });
} else {
    console.log('DOM already loaded - Initializing...');
    initializeSocket().catch(error => {
        console.error('Failed to initialize:', error);
    });
}
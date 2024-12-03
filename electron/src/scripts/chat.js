// Using require instead of import for Electron compatibility
const io = require('socket.io-client');
const { setupChatSocket } = require('./chat/chatSocket.js');
const { setupFriendSocket } = require('./friends/friendSocket.js');
const { loadFriendRequests } = require('./friends/friends.js');
const { createChatRoom, sendMessage, joinChatRoom, fetchChatRooms } = require('./chat/chat.js');

const setupSocket = () => {
    const socketOptions = {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        path: '/socket.io/',
        auth: {
            token: localStorage.getItem('authToken')
        }
    };

    const serverUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3000' 
        : 'wss://skattchat.online';

    try {
        console.log('Connecting to:', serverUrl);
        const socket = io(serverUrl, socketOptions);
        
        socket.on('connect', () => {
            console.log('Socket connected successfully');
            window.socket = socket;
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            // Fallback to polling if websocket fails
            socket.io.opts.transports = ['polling', 'websocket'];
        });

        return socket;
    } catch (error) {
        console.error('Socket initialization error:', error);
        return null;
    }
};

// Socket.IO initialization with proper URL and options
if (!window.socket) {
    const socket = setupSocket();
    if (socket) {
        console.log('Socket attempting connection to:', socket.io.uri);

        socket.on('connect', () => {
            console.log('Socket connected successfully');
            window.socket = socket;

            // Setup Socket.IO event listeners
            setupChatSocket(socket);
            setupFriendSocket(socket);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing chat application...');
        const socket = setupSocket();
        if (!socket) throw new Error('Failed to initialize socket');
        
        const rooms = await fetchChatRooms();
        console.log('Chat rooms loaded:', rooms);
        
        setupCreateRoomHandler(socket);
        await loadFriendRequests();
        
        console.log('Chat application fully initialized.');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing chat application...');

    try {
        // Fetch and render chat rooms
        await fetchChatRooms(window.socket);
        initializeRoomListeners();

        // Load initial friend requests
        loadFriendRequests();

        // Set up create room functionality
        setupCreateRoomHandler(window.socket);

        // Set up friend request handlers
        setupFriendRequestHandlers(window.socket);

        console.log('Chat application fully initialized.');
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    document.getElementById('chat-form').addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission (page reload)
    
        event.preventDefault(); // Prevent default form submission

        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        const roomId = localStorage.getItem('currentRoom');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const timestamp = new Date().toISOString(); // Current timestamp

        if (!roomId) {
            alert('Please select a chat room first!');
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
});

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

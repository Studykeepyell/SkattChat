import { setupChatSocket } from './chat/chatSocket.js';
import { setupFriendSocket } from './friends/friendSocket.js';
import { loadFriendRequests, respondToFriendRequest } from './friends/friends.js';
import { createChatRoom, sendMessage } from './chat/chat.js';
import { joinChatRoom } from './chat/chat.js';
import { fetchChatRooms } from './chat/chat.js';
import { io } from 'socket.io-client';



// Ensure socket initialization is global and done only once
if (!window.socket) {
    const socket = io(); // Initialize Socket.IO
    console.log('Socket initialized:', socket);

    window.socket = socket; // Save to the global window object to avoid reinitialization

    // Setup Socket.IO event listeners for chat and friends
    setupChatSocket(socket);
    setupFriendSocket(socket);

    // Ensure the chat application is initialized after the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Initializing chat application...');

        try {
            // Fetch and render chat rooms
            await fetchChatRooms(socket);
            initializeRoomListeners();

            // Load initial friend requests
            loadFriendRequests();

            // Set up create room functionality
            setupCreateRoomHandler(socket);

            // Set up friend request handlers
            setupFriendRequestHandlers(socket);

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

                if (message && roomId && userId) {
                    console.log(`Sending message to room ${roomId}:`, message);
                    sendMessage(socket, roomId, userId, username, message, timestamp);
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

  
    }


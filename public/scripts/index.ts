import { setupChatSocket } from './chat/chatSocket';
import { setupFriendSocket } from './friends/friendSocket';
import { loadFriendRequests, respondToFriendRequest } from './friends/friends';
import { createChatRoom, sendMessage, joinChatRoom, fetchChatRooms } from './chat/chat';

declare global {
    interface Window {
        socket: any;
    }
}

// ... existing imports and declarations ...

async function initializeSocket() {
    const { io } = await import('socket.io-client');
    
    if (!window.socket) {
        try {
            const socket = io({
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            
            socket.on('connect_error', (error: any) => {
                console.error('Socket connection error:', error);
            });

            window.socket = socket;
            setupChatSocket(socket);
            setupFriendSocket(socket);

            // All DOM-related initialization in one place
            document.addEventListener('DOMContentLoaded', async () => {
                console.log('Initializing chat application...');
                try {
                    await fetchChatRooms(socket);
                    initializeRoomListeners();
                    loadFriendRequests();
                    setupFriendRequestHandlers(socket);
                    
                    // Setup chat form listener
                    document.getElementById('chat-form')?.addEventListener('submit', (event) => {
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

                        if (message && roomId && userId) {
                            console.log(`Sending message to room ${roomId}:`, message);
                            sendMessage(roomId, userId, username, message, timestamp);
                            messageInput.value = '';
                        } else {
                            console.error('Message, roomId, or userId is missing!');
                        }
                    });

                    console.log('Chat application fully initialized.');
                } catch (error) {
                    console.error('Error during initialization:', error);
                }
            });

        } catch (error) {
            console.error('Failed to initialize socket:', error);
            alert('Failed to connect to chat server. Please refresh the page.');
        }
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

function setupFriendRequestHandlers(socket: any) {
    const friendRequestList = document.getElementById('friendRequestList');
    if (friendRequestList) {
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
}

initializeSocket();
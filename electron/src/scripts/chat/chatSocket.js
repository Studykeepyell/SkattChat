import { ChatRoom } from './chatRooms.js';
import { updateRoomTimestamp } from './chat.js';
import { addChatMessage } from './chat.js';
export const setupChatSocket = (socket) => {
    if (!socket) {
        throw new Error('Socket connection required');
    }

    const handlers = {
        'chat message': (data) => {
            try {
                console.log('Received chat message:', data);
                
                // Create message element
                const messageData = {
                    username: data.username || 'Anonymous',
                    userId: data.userId,
                    content: data.message,
                    timestamp: data.timestamp || new Date().toISOString()
                };

                addChatMessage(messageData);


                // Update room timestamp if needed
                if (data.roomId) {
                    updateRoomTimestamp(data.roomId, messageData.timestamp);
                }
            } catch (error) {
                console.error('Error handling chat message:', error);
            }

            const currentUserId = localStorage.getItem('userId');
            if (userId !== currentUserId) {
                const audio = new Audio('/assets/skattchat.promot.guitar.mp3');
                audio.play().catch(error => console.error('Audio playback failed:', error));
            }
        },
        'updateChatRoomList': (rooms) => {
            console.log('Updated chat room list:', rooms);
            const roomList = document.getElementById('roomList');
            if (roomList) {
                roomList.innerHTML = '';
                rooms.forEach((room) => ChatRoom.display(room, roomList, socket));
            }
        },
        'user joined': (data) => {
            console.log('User joined:', data);
            showSystemMessage(`${data.username} joined the chat`);
        },
        'user left': (data) => {
            console.log('User left:', data);
            showSystemMessage(`${data.username} left the chat`);
        },
        'error': (error) => {
            console.error('Socket error:', error);
            showErrorMessage(error.message || 'Connection error occurred');
        }
    };

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
        socket.on(event, handler);
    });
};

const showSystemMessage = (message) => {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.textContent = message;
        chatMessages.appendChild(systemDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};

const showErrorMessage = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
};
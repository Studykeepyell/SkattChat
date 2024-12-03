import { ChatRoom } from './chatRooms.js';
import { addChatMessage } from './chat.js';
import { updateRoomTimestamp } from './chat.js';

const setupChatSocket = (socket) => {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }

    // Room update handler
    socket.on('roomUpdate', (data) => {
        const { roomId, roomName, messages } = data;
        if (!roomId || !roomName) {
            console.error('Invalid room data:', data);
            return;
        }
        console.log(`Room updated: ${roomName} (${roomId})`);
        // Update room UI
        updateRoomDisplay(roomId, roomName, messages);
    });

    // Message handler
    socket.on('chat message', (data) => {
        const { roomId, timestamp, userId, username, message } = data;
        console.log('Received chat message:', data);
        
        addChatMessage({
            username,
            userId,
            content: message,
            timestamp
        });

        if (typeof updateRoomTimestamp === 'function') {
            updateRoomTimestamp(roomId, timestamp);
        }

        // Play sound for others' messages
        const currentUserId = localStorage.getItem('userId');
        if (userId !== currentUserId) {
            playNotificationSound();
        }
    });
};

const updateRoomDisplay = (roomId, roomName, messages) => {
    // Implementation for updating room display
    console.log('Updating room display:', roomId, roomName);
};

const playNotificationSound = () => {
    const audio = new Audio('/audio/notification.mp3');
    audio.play().catch(error => console.error('Audio playback failed:', error));
};

module.exports = {
    setupChatSocket
};

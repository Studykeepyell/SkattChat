import { ChatRoom } from './chatRooms.js';
import { addChatMessage } from './chat.js';
import { updateRoomTimestamp } from './chat.js';

export function setupChatSocket(socket) {
    const handlers = {
'chat message': (data) => {
    console.log('Received chat message:', data);
    
    const { roomId, timestamp, userId, username, message } = data;
    
    const messageData = {
        username,
        userId,
        content: message,
        timestamp: timestamp // Pass timestamp directly without conversion
    };

    addChatMessage(messageData);
    
    if (typeof updateRoomTimestamp === 'function') {
        updateRoomTimestamp(roomId, timestamp);
    }

    const currentUserId = localStorage.getItem('userId');
    if (userId !== currentUserId) {
        const audio = new Audio('/audio/skattchat.promot.guitar.mp3');
        audio.play().catch(error => console.error('Audio playback failed:', error));
    }
    },


        'roomUpdate':(data) =>{
            const { roomId, roomName, messages } = data;

    if (!roomId || !roomName) {
        console.error('Invalid room data:', data);
        return;
    }

    console.log(`Room updated: ${roomName} (${roomId})`);

    // Update the chat heading
    const chatHeading = document.getElementById('chat-heading');
    chatHeading.textContent = `${roomName}`;

    // Render messages in the message list
    const messageContainer = document.getElementById('messages');
    if (messageContainer) {
        messageContainer.innerHTML = ''; // Clear old messages
        messages.forEach((message) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.innerHTML = `
                <strong>${message.sender}:</strong>
                <p>${message.content}</p>
                <small>${new Date(message.timestamp).toLocaleString()}</small>
            `;
            messageContainer.appendChild(messageElement);
        });
    }
        },
        'updateChatRoomList': (rooms) => {
            console.log('Updated chat room list:', rooms); // Debug log
            const roomList = document.getElementById('roomList');
            if (roomList) {
                roomList.innerHTML = ''; // Clear existing rooms
                rooms.forEach((room) => ChatRoom.display(room, roomList));
            }
        },
    };
    
    Object.keys(handlers).forEach((event) => {
        socket.on(event, handlers[event]);
    });
}

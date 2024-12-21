import { ChatRoom } from './chatRooms'
import { addChatMessage } from './chat';
import { updateRoomTimestamp } from './chat';
import type { Socket as SocketIOClient } from 'socket.io-client';

export function setupChatSocket(socket: SocketIOClient) {
    const handlers = {
'chat message': (data: any) => {
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
        const audio = new Audio('/assets/skattchat.promot.guitar.mp3');
        audio.play().catch(error => console.error('Audio playback failed:', error));
    }
    },


        'roomUpdate':(data: any) =>{
            const { roomId, roomName, messages } = data;

    if (!roomId || !roomName) {
        console.error('Invalid room data:', data);
        return;
    }

    console.log(`Room updated: ${roomName} (${roomId})`);

    // Update the chat heading
  
        },
        'updateChatRoomList': (rooms: any) => {
            console.log('Updated chat room list:', rooms); // Debug log
            const roomList = document.getElementById('roomList');
            if (roomList) {
                roomList.innerHTML = ''; // Clear existing rooms
                rooms.forEach((room: any) => ChatRoom.display(room, roomList, socket));
            }
        },
    };
    
    Object.keys(handlers).forEach((event) => {
        socket.on(event, handlers[event as keyof typeof handlers]);
    });
}

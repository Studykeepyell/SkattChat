import { ChatRoom } from './chatRooms'
import { addChatMessage, updateRoomTimestamp } from './chat';
import type { Socket as SocketIOClient } from 'socket.io-client';

export function setupChatSocket(socket: SocketIOClient) {
    console.log('Setting up chat socket handlers...');

    const handlers = {
        'message': (data: any) => {
            console.log('Received chat message:', data);
            
            const { roomId, timestamp, userId, username, message } = data;
            
            const messageData = {
                username,
                userId,
                content: message,
                timestamp: timestamp
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

        'roomUpdate': (data: any) => {
            console.log('Room update received:', data);
            const { roomId, roomName, messages } = data;

            if (!roomId || !roomName) {
                console.error('Invalid room data:', data);
                return;
            }

            console.log(`Room updated: ${roomName} (${roomId})`);
            
            // Update room in the list if it exists
            const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
            if (roomElement) {
                const nameElement = roomElement.querySelector('.room-name');
                if (nameElement) {
                    nameElement.textContent = roomName;
                }
            }

            // If messages are provided, update the chat area
            if (messages && Array.isArray(messages)) {
                messages.forEach(msg => {
                    addChatMessage({
                        username: msg.sender,
                        userId: msg.userId,
                        content: msg.content,
                        timestamp: msg.timestamp
                    });
                });
            }
        },

        'requestRooms': () => {
            console.log('Requesting room list...');
            socket.emit('requestRooms');
        },

        'roomList': (rooms: any) => {
            console.log('Received room list:', rooms);
            const roomList = document.getElementById('roomList');
            if (!roomList) {
                console.error('Room list element not found!');
                return;
            }

            try {
                roomList.innerHTML = ''; // Clear existing rooms
                if (!Array.isArray(rooms)) {
                    console.error('Received rooms is not an array:', rooms);
                    return;
                }

                rooms.forEach((room: any) => {
                    console.log('Displaying room:', room);
                    ChatRoom.display({
                        roomId: room.roomId,
                        name: room.name,
                        lastMessageTime: room.lastMessageTime,
                        updatedAt: room.updatedAt || new Date().toISOString()
                    }, roomList, socket);
                });
                
                console.log(`Successfully displayed ${rooms.length} rooms`);
            } catch (error) {
                console.error('Error updating chat room list:', error);
            }
        },

        'connect': () => {
            console.log('Chat socket connected');
            // Request room list update upon connection
            socket.emit('requestRooms');
        },

        'disconnect': () => {
            console.log('Chat socket disconnected');
        },

        'connect_error': (error: any) => {
            console.error('Chat socket connection error:', error);
        }
    };
    
    // Set up all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event); // Remove any existing handlers
        socket.on(event, handler);
        console.log(`Registered handler for event: ${event}`);
    });

    // Initial room list request
    socket.emit('requestRooms');
    console.log('Requested initial room list');

    return socket;
}

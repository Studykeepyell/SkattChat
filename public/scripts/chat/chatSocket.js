import { ChatRoom } from './chatRooms.js';
import { addChatMessage } from './chat.js';

export function setupChatSocket(socket) {
    const handlers = {
        'chat message': (data) => {
            console.log('Received chat message:', data); // Debug log
            addChatMessage(data);
        },
        'clear messages': () => {
            const messagesList = document.getElementById('messages');
            if (messagesList) messagesList.innerHTML = '';
        },
        'newChatRoom': (room) => {
            console.log('New chat room received:', room); // Debug log
            const roomList = document.getElementById('roomList');
            if (roomList) ChatRoom.display(room, roomList);
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

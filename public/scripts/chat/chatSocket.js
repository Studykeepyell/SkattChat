import { addChatMessage } from './chat.js';

export function setupChatSocket(socket) {
    socket.on('chat message', (data) => {
        const messagesList = document.getElementById('messages');
        addChatMessage(data, messagesList);
    });

    socket.on('clear messages', () => {
        const messagesList = document.getElementById('messages');
        if (messagesList) messagesList.innerHTML = '';
    });

    socket.on('newChatRoom', (room) => {
        const roomList = document.getElementById('roomList');
        if (roomList) displayChatRoom(room, roomList);
    });

    socket.on('updateChatRoomList', (rooms) => {
        const roomList = document.getElementById('roomList');
        roomList.innerHTML = ''; // Clear existing rooms
        rooms.forEach((room) => displayChatRoom(room, roomList));
    });
}

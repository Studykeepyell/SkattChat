import { joinChatRoom } from "./chat.js";
export const ChatRoom = {
    async create(roomName, userId, socket) {
        try {
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, userId }),
            });

            const data = await response.json();
            if (data.success) {
                socket.emit('joinRoom', { roomId: data.room.roomId });
                alert(`Chat room "${roomName}" created successfully!`);
            } else {
                alert('Failed to create chat room.');
            }
        } catch (error) {
            console.error('Error creating chat room:', error);
        }
    },

    display(room, container, socket) {
        const roomElement = document.createElement('div');
        roomElement.className = 'chat-room';
        roomElement.textContent = room.name;
    
        roomElement.addEventListener('click', () => {
            console.log(`Room clicked: ${room.name}, Room ID: ${room.roomId}`); // Debug log
            if (!room.roomId) {
                console.error('Room ID is missing for the clicked room:', room);
                return;
            }
    
            localStorage.setItem('currentRoom', room.roomId);
            joinChatRoom(socket, room.roomId); // Ensure `joinChatRoom` is correctly implemented
        });
    
        container.appendChild(roomElement);
    }
    
    
};

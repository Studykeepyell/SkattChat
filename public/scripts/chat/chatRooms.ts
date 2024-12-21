import { joinChatRoom } from "./chat.js";
export const ChatRoom = {
    async create(roomName: string, userId: string, socket: any) {
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

    display(room: { name: string, roomId: string, lastMessageTime: string, updatedAt: string }, container: HTMLElement, socket: any) {
        const roomElement = document.createElement('div');
        roomElement.className = 'chat-room';
        roomElement.setAttribute('data-room-id', room.roomId); // Set data attribute
        roomElement.innerHTML = `
            <div class="room-info">
                <span class="room-name">${room.name}</span>
                <span class="room-timestamp">${new Date(room.lastMessageTime || room.updatedAt).toLocaleString()}</span>
            </div>
        `;
    
        // Add click event listener to join the room
        roomElement.addEventListener('click', () => {
            if (!room.roomId) {
                console.error('Room ID is missing!');
                return;
            }
    
            socket.emit('joinRoom', room.roomId); // Send room ID to the server
            const chatHeading = document.getElementById('chat-heading');
            if (chatHeading) {
                chatHeading.textContent = `${room.name}`;
            }
            
            // Mark the room as active
            document.querySelectorAll('.chat-room').forEach((el) => el.classList.remove('active-room'));
            roomElement.classList.add('active-room');
    
            // Remove the hint icon
            const icon = roomElement.querySelector('.new-message-icon');
            if (icon) icon.remove();
        });
    
        container.appendChild(roomElement);
    }
    
    
    
};

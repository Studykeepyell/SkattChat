import { joinChatRoom } from "./chat";

export interface ChatRoomData {
    name: string;
    roomId: string;
    lastMessageTime?: string;
    updatedAt: string;
}

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
                console.log('Room created successfully:', data.room);
                return data.room;
            } else {
                console.error('Failed to create chat room:', data.error);
                throw new Error(data.error || 'Failed to create chat room');
            }
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    },

    display(room: ChatRoomData, container: HTMLElement, socket: any) {
        if (!room || !room.roomId || !room.name) {
            console.error('Invalid room data:', room);
            return;
        }

        console.log('Displaying room:', room);
        
        // Check if room already exists
        const existingRoom = container.querySelector(`[data-room-id="${room.roomId}"]`);
        if (existingRoom) {
            console.log('Room already exists, updating instead of creating new element');
            this.updateRoom(existingRoom as HTMLElement, room);
            return;
        }
        
        const roomElement = document.createElement('div');
        roomElement.className = 'chat-room';
        roomElement.setAttribute('data-room-id', room.roomId);
        
        // Create room content
        const roomContent = document.createElement('div');
        roomContent.className = 'room-info';
        
        const roomName = document.createElement('span');
        roomName.className = 'room-name';
        roomName.textContent = room.name;
        
        const roomTimestamp = document.createElement('span');
        roomTimestamp.className = 'room-timestamp';
        roomTimestamp.textContent = new Date(room.lastMessageTime || room.updatedAt).toLocaleString();
        
        roomContent.appendChild(roomName);
        roomContent.appendChild(roomTimestamp);
        roomElement.appendChild(roomContent);
    
        // Add click event listener to join the room
        roomElement.addEventListener('click', () => {
            this.handleRoomClick(room, roomElement, socket);
        });
    
        console.log('Appending room element to container');
        container.appendChild(roomElement);

        // If this is the current room, mark it as active
        const currentRoomId = localStorage.getItem('currentRoom');
        if (currentRoomId === room.roomId) {
            roomElement.classList.add('active-room');
            const chatHeading = document.getElementById('chat-heading');
            if (chatHeading) {
                chatHeading.textContent = room.name;
            }
        }
    },

    updateRoom(roomElement: HTMLElement, room: ChatRoomData) {
        const nameElement = roomElement.querySelector('.room-name');
        const timestampElement = roomElement.querySelector('.room-timestamp');
        
        if (nameElement) {
            nameElement.textContent = room.name;
        }
        
        if (timestampElement) {
            timestampElement.textContent = new Date(room.lastMessageTime || room.updatedAt).toLocaleString();
        }
    },

    handleRoomClick(room: ChatRoomData, roomElement: HTMLElement, socket: any) {
        console.log('Room clicked:', room);
        
        console.log('Emitting joinRoom event with roomId:', room.roomId);
        socket.emit('joinRoom', { roomId: room.roomId });
        localStorage.setItem('currentRoom', room.roomId);
        
        const chatHeading = document.getElementById('chat-heading');
        if (chatHeading) {
            chatHeading.textContent = room.name;
        }
        
        // Mark the room as active
        document.querySelectorAll('.chat-room').forEach((el) => el.classList.remove('active-room'));
        roomElement.classList.add('active-room');

        // Remove the hint icon
        const icon = roomElement.querySelector('.new-message-icon');
        if (icon) icon.remove();

        // Fetch messages for the room
        joinChatRoom(socket, room.roomId);
    }
}

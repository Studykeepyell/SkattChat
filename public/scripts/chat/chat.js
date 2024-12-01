import { fetchProfileImage, formatTimestamp, formatMessageDate, formatMessageTime } from '../utils/utils.js';
import { ChatRoom } from './chatRooms.js';


export async function addChatMessage(data) {
    const messagesList = document.getElementById('messages');
    if (!messagesList) {
        console.error("Error: 'messages' element not found.");
        return;
    }

    const lastDateSeparator = messagesList.querySelector('.date-separator:last-of-type')
    const lastMessageDate = lastDateSeparator ? lastDateSeparator.textContent : null;
    // Create the message element
    const elements = createMessageElement(data,lastMessageDate);
    if (!elements) {
        console.error('Failed to create message element. Skipping:', data);
        return;
    }

   // Append all elements to the messages list
   elements.forEach(element => messagesList.appendChild(element));
   messagesList.scrollTop = messagesList.scrollHeight;
};

function createMessageElement(data,lastMessageDate) {
    const { username, userId, content, timestamp } = data;
    if (!username || !content || !timestamp) {
        console.error('Invalid data for creating message element:', data);
        return null;
    }

    const elements = [];
    const currentMessageDate = formatMessageDate(timestamp);

    if(currentMessageDate !== lastMessageDate){
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'data-separator';
        dateSeparator.textContent = currentMessageDate;
        elements.push(dateSeparator)
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';

    const usernameElement = document.createElement('h2');
    usernameElement.className = 'username';
    usernameElement.textContent = username;

    const messageContentElement = document.createElement('div');
    messageContentElement.className = 'message-content';
    messageContentElement.textContent = content;

    const timestampElement = document.createElement('div');
    timestampElement.className = 'timestamp';
    timestampElement.textContent = formatMessageTime(timestamp);

    messageContainer.append(usernameElement, messageContentElement, timestampElement);
    elements.push(messageContainer);

    return elements;
}


export async function updateRoomTimestamp(roomId, timestamp) {
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
        let timestampElement = roomElement.querySelector('.room-timestamp');
        if (!timestampElement) {
            timestampElement = document.createElement('span');
            timestampElement.className = 'room-timestamp';
            roomElement.appendChild(timestampElement);
        }
        timestampElement.textContent = new Date(timestamp).toLocaleString();
    
        // Add notification icon for inactive rooms
        if (!roomElement.classList.contains('active-room')) {
            const roomNameElement = roomElement.querySelector('.room-name');
            if (roomNameElement && !roomNameElement.querySelector('.new-message-icon')) {
                roomNameElement.innerHTML += '<span class="new-message-icon" aria-label="New message">🔔</span>';
            }
        }
    }
}


export async function fetchMessages(roomId) {
    console.log('Fetching messages for room:', roomId);

    try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success && data.messages) {
            console.log('Fetched messages:', data.messages);
            const messagesList = document.getElementById('messages');
            if (messagesList) {
                messagesList.innerHTML = ''; // Clear existing messages
                data.messages.forEach((message) => {
                    addChatMessage({
                        username: message.username,
                        content: message.message,
                        timestamp: message.timestamp,
                    });
                });
            }
        } else {
            console.warn('No messages found or fetch failed.');
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}



export async function fetchChatRooms() {
    console.log('Auth Token:', localStorage.getItem('authToken'));

    try {
        const response = await fetch('/api/chat/rooms', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success && data.rooms) {
            console.log('Fetched rooms:', data.rooms); // Debug log
            const container = document.getElementById('roomList');
            if (container) {
                container.innerHTML = ''; // Clear previous entries
                data.rooms.forEach((room) => {
                    console.log(`Room rendered: ${room.name} with ID ${room.roomId}`); // Debug room details
                    ChatRoom.display(room, container); // Adjust to your rendering logic
                });
            }
        } else {
            console.warn('No rooms found or fetch failed.');
        }
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }
}






export async function createChatRoom(roomName, userId, socket) {
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
}

export function displayChatRoom(room, container) {
    const roomElement = document.createElement('div');
    roomElement.className = 'chat-room';
    roomElement.textContent = room.name;

    roomElement.addEventListener('click', () => {
        localStorage.setItem('currentRoom', room.roomId);

        joinChatRoom(socket, room.roomId); // Fetch and display chat room messages
    });

    container.appendChild(roomElement);
}

export async function sendMessage(roomId, userId, username, message, timestamp) {
    try {
        // Validate inputs
        if (!roomId || !userId || !message || !timestamp) {
            throw new Error('All fields are required.');
        }

        const payload = {
            roomId,
            userId,
            username,
            message,
            timestamp,
        };

        console.log('Sending message payload:', payload);

        // Send the payload to the backend
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Message sent successfully:', data.message);
        } else {
            console.error('Failed to send message:', data.message);
        }
    } catch (error) {
        console.error('Error in sendMessage:', error.message);
    }
}







export async function joinChatRoom(socket, roomId) {
    if (!roomId) {
        console.error('Room ID is required to join a chat room.');
        return;
    }

    console.log(`Joining room with ID: ${roomId}`);
    socket.emit('joinRoom', roomId);

    // Fetch and display messages for the room
    await fetchMessages(roomId);
}


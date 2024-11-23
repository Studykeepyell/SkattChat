import { fetchProfileImage, formatTimestamp, formatMessageDate } from '../utils/utils.js';
import { ChatRoom } from './chatRooms.js';
let lastMessageDate = null;


// Adds a new chat message to the DOM
export async function addChatMessage(data) {
    const messagesList = document.getElementById('messages');
    if (!messagesList) {
        console.error("Error: 'messages' element not found.");
        return;
    }

    const messageElement = createMessageElement(data);
    messagesList.appendChild(messageElement);
    messagesList.scrollTop = messagesList.scrollHeight; // Scroll to latest message
}

function createMessageElement(data) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';

    const username = document.createElement('h2');
    username.className = 'username';
    username.textContent = data.username;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = data.message;

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(data.timestamp); // Use formatted timestamp

    messageContainer.append(username, messageContent, timestamp);
    return messageContainer;
}


export async function fetchChatRooms(socket) {
    try {
        const response = await fetch('/api/chat/rooms');
        const data = await response.json();

        if (data.success && data.rooms) {
            console.log('Fetched rooms:', data.rooms); // Debug log
            const container = document.getElementById('roomList');
            if (container) {
                container.innerHTML = ''; // Clear previous entries
                data.rooms.forEach((room) => {
                    console.log(`Room rendered: ${room.name} with ID ${room.roomId}`); // Debug room details
                    ChatRoom.display(room, container, socket);
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
        location.reload();
    });

    container.appendChild(roomElement);
}

export async function sendMessage(socket, roomId, userId, username, message) {

    console.log('Sending message:', { roomId, userId, username, message }); // Debug log
    const timestamp = new Date().toISOString();
    socket.emit('chat message', { roomId, userId, username, message, timestamp });

    if (message.startsWith('/ai')) {
        const aiMessage = message.replace('/ai ', '');
        const aiResponse = await getAIResponse(aiMessage, roomId, username);
        console.log('AI response:', aiResponse); // Debug log
        addChatMessage({ username: 'AI', message: aiResponse });
    }
}




export async function joinChatRoom(socket, roomId) {
    if (!roomId) {
        console.error('Room ID is required to join a chat room.');
        return;
    }

    console.log(`Joining room with ID: ${roomId}`); // Debug log
    socket.emit('joinRoom', roomId);

    try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
        const data = await response.json();

        if (data.success && data.messages) {
            console.log('Fetched chat history:', data.messages); // Debug fetched messages
            const messagesList = document.getElementById('messages');
            if (messagesList) messagesList.innerHTML = ''; // Clear old messages
            data.messages.forEach((message) => addChatMessage(message));
        } else {
            console.warn('No chat history available.');
        }
    } catch (error) {
        console.error('Error fetching chat history:', error);
    }
}









import { fetchProfileImage, formatTimestamp, formatMessageDate, formatMessageTime } from '../utils/utils';
import { ChatRoom } from './chatRooms';

// Add type declaration for window.chatSocket
declare global {
    interface Window {
        chatSocket: any;
    }
}

export async function addChatMessage(data: { username: string, userId?: string, content: string, timestamp: string }) {
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

function createMessageElement(data: { username: string, userId?: string, content: string, timestamp: string }, lastMessageDate: string | null) {
    const { username, userId, content, timestamp } = data;
    if (!username || !content || !timestamp) {
        console.error('Invalid data for creating message element:', data);
        return null;
    }

    const elements: HTMLElement[] = [];
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


export async function updateRoomTimestamp(roomId: string, timestamp: string) {
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


export async function fetchMessages(roomId: string) {
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
                data.messages.forEach((message: { username: string, message: string, timestamp: string }) => {
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



export async function fetchChatRooms(socket: any) {
    console.log('Starting fetchChatRooms...');
    
    // Verify authentication
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!authToken || !userId) {
        console.error('Missing authentication credentials');
        return;
    }
    
    console.log('Auth credentials found:', { 
        userId,
        tokenExists: !!authToken,
        tokenLength: authToken?.length,
        tokenStart: authToken?.substring(0, 20) + '...'
    });

    // Determine base URL
    const baseURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://skattchat.online';

    try {
        // Verify socket connection
        if (!socket || !socket.connected) {
            console.error('Socket not connected. Attempting to reconnect...');
            if (socket) {
                socket.connect();
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.error('Socket reconnection timeout');
                        resolve(false);
                    }, 5000);
                    
                    socket.once('connect', () => {
                        clearTimeout(timeout);
                        resolve(true);
                    });
                });
            }
            
            if (!socket || !socket.connected) {
                throw new Error('No valid socket connection available');
            }
        }

        console.log('Making API request to /api/chat/rooms with token:', authToken.substring(0, 20) + '...');
        const authHeader = `Bearer ${authToken}`;
        console.log('Authorization header:', authHeader.substring(0, 40) + '...');
        
        const response = await fetch(`${baseURL}/api/chat/rooms`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);

        if (data.success && data.rooms) {
            console.log('Successfully fetched rooms:', data.rooms);
            const container = document.getElementById('roomList');
            if (container) {
                container.innerHTML = ''; // Clear previous entries
                data.rooms.forEach((room: { name: string, roomId: string }) => {
                    console.log(`Rendering room: ${room.name} with ID ${room.roomId}`);
                    ChatRoom.display({ 
                        ...room, 
                        lastMessageTime: '', 
                        updatedAt: '' 
                    }, container, socket);
                });
            } else {
                console.error('Room list container not found');
            }
        } else {
            console.warn('No rooms found or fetch failed:', data);
        }
    } catch (error) {
        console.error('Error in fetchChatRooms:', error);
        // Attempt to reconnect socket if that was the issue
        if (socket && !socket.connected) {
            console.log('Attempting to reconnect socket...');
            socket.connect();
        }
        throw error;
    }
}






export async function createChatRoom(roomName: string, userId: string, socket: any) {
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

export function displayChatRoom(room: { name: string, roomId: string }, container: HTMLElement, socket: any) {
    const roomElement = document.createElement('div');
    roomElement.className = 'chat-room';
    roomElement.textContent = room.name;

    roomElement.addEventListener('click', () => {
        localStorage.setItem('currentRoom', room.roomId);

        joinChatRoom(socket, room.roomId); // Fetch and display chat room messages
    });

    container.appendChild(roomElement);
}

export async function sendMessage(roomId: string, userId: string, username: string, message: string, timestamp: string) {
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







export async function joinChatRoom(socket: any, roomId: string) {
    if (!roomId) {
        console.error('Room ID is required to join a chat room.');
        return;
    }

    console.log(`Joining room with ID: ${roomId}`);
    socket.emit('joinRoom', roomId);

    // Fetch and display messages for the room
    await fetchMessages(roomId);
}


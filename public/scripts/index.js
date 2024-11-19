import { setupChatSocket } from './chat/chatSocket.js';
import { setupFriendSocket } from './friends/friendSocket.js';
import { loadFriendRequests, respondToFriendRequest } from './friends/friends.js';
import { createChatRoom } from './chat/chat.js';
import { joinChatRoom } from './chat/chat.js';


document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Initialize chat and friend features
    setupChatSocket(socket);
    setupFriendSocket(socket);

    // Load initial friend requests
    loadFriendRequests();

    // Handle creating new chat rooms
    document.getElementById('createRoomBtn').addEventListener('click', () => {
        const roomName = prompt('Enter the room name:');
        if (roomName) createChatRoom(roomName, localStorage.getItem('userId'), socket);
    });

    // Handle friend request response
    document.getElementById('friendRequestList').addEventListener('click', (e) => {
        if (e.target.classList.contains('accept')) {
            const requestId = e.target.dataset.requestId;
            respondToFriendRequest(requestId, 'accepted', socket);
        } else if (e.target.classList.contains('decline')) {
            const requestId = e.target.dataset.requestId;
            respondToFriendRequest(requestId, 'declined', socket);
        }
    });


      // Load initial chat room
      const lastRoom = localStorage.getItem('currentRoom') || 'general';
      joinChatRoom(socket, lastRoom);
  
      // Attach event listeners for room switching
      document.querySelectorAll('.chat-room').forEach((roomElement) => {
          roomElement.addEventListener('click', (e) => {
              const roomId = e.target.dataset.roomId;
              joinChatRoom(socket, roomId);
          });
      });
});

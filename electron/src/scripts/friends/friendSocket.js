import { loadFriendRequests, displayFriendRequest } from './friends.js';

export function setupFriendSocket(socket) {
    if (!socket) {
        console.error('Socket connection required for friend system');
        return;
    }

    socket.on('friendRequestReceived', (data) => {
        console.log("Friend request received:", data);
        displayFriendRequest(data);
    });

    socket.on('friendRequestAccepted', (data) => {
        console.log("Friend request accepted:", data);
        loadFriendRequests(); // Refresh the list
    });

    socket.on('friendListUpdated', (data) => {
        console.log("Friend list updated:", data);
        updateFriendsList(data.friends);
    });
}

function updateFriendsList(friends) {
    const friendListContainer = document.getElementById('friendsList');
    if (!friendListContainer) return;

    friendListContainer.innerHTML = '';
    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.textContent = friend.username;
        friendListContainer.appendChild(friendElement);
    });
}

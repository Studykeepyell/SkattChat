export function setupFriendSocket(socket) {
    socket.on('friendRequestReceived', (data) => {
        console.log("Friend request received from:", data.senderId); // Log request
        displayFriendRequest(data.senderId);
    });
    
    socket.on('newFriendRequest', (data) => {
        console.log("Received new friend request:", data.message); // Log notification
        loadFriendRequests(); // Refresh the friend request list
    });

    
    socket.on('friendRequestAccepted', (data) => {
        alert(`${data.senderId} accepted your friend request!`);
        socket.emit('updateFriendList', { userId: data.receiverId });
    });

    socket.on('friendListUpdated', (friends) => {
        const friendListContainer = document.getElementById('friendList');
        friendListContainer.innerHTML = ''; // Clear current list
        friends.forEach((friend) => {
            const friendItem = document.createElement('li');
            friendItem.textContent = friend.username;
            friendListContainer.appendChild(friendItem);
        });
    });
}

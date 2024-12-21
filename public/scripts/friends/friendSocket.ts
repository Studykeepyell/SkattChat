import { displayFriendRequest, loadFriendRequests } from './friends';

export function setupFriendSocket(socket: any) {
    socket.on('friendRequestReceived', (data: any) => {
        console.log("Friend request received from:", data.senderId); // Log request
        displayFriendRequest(data.senderId);
    });
    
    socket.on('newFriendRequest', (data: any) => {
        console.log("Received new friend request:", data.message); // Log notification
        loadFriendRequests(); // Refresh the friend request list
    });

    
    socket.on('friendRequestAccepted', (data: any) => {
        alert(`${data.senderId} accepted your friend request!`);
        socket.emit('updateFriendList', { userId: data.receiverId });
    });

    socket.on('friendListUpdated', (friends: any) => {
        const friendListContainer = document.getElementById('friendList');
        if (friendListContainer) {
            friendListContainer.innerHTML = ''; // Clear current list
            friends.forEach((friend: any) => {
                const friendItem = document.createElement('li');
                friendItem.textContent = friend.username;
                friendListContainer.appendChild(friendItem);
            });
        }
    });
}

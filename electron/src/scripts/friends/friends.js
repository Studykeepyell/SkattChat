import { initializeSocket } from '../lib/socket-client.js';

const baseURL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://skattchat.online';

 async function sendFriendRequest(receiverId) {
    const senderId = localStorage.getItem('userId');

    console.log("Sending friend request to:", receiverId);
    console.log("Sender ID:", senderId);

    if (!senderId || !receiverId) {
        console.error("Error: Missing senderId or receiverId");
        return;
    }

    try {
        const response = await fetch(`${baseURL}/api/users/friends/${receiverId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ senderId })
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
}

 async function loadFriendRequests() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (!userId || !token) {
        console.error('User ID or token is missing.');
        return;
    }

    try {
        const response = await fetch(`${baseURL}/api/friendRequests/requests/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error(`Failed to load friend requests: ${response.statusText}`);
        
        const data = await response.json();
        updateFriendRequestsUI(data.friendRequests);
        
    } catch (error) {
        console.error("Error loading friend requests:", error);
    }
}

function updateFriendRequestsUI(requests) {
    const friendRequestList = document.getElementById('friendRequestList');
    if (!friendRequestList) {
        console.error("friendRequestList element not found in the DOM.");
        return;
    }

    friendRequestList.innerHTML = '';
    requests.forEach(request => displayFriendRequest(request));
}

 function displayFriendRequest(request) {
    if (!request || !request.sender || !request.receiver) {
        console.error('Invalid request object:', request);
        return;
    }

    const requestItem = createRequestElement(request);
    const friendRequestList = document.getElementById('friendRequestList');
    if (friendRequestList) {
        friendRequestList.appendChild(requestItem);
    }
}

function createRequestElement(request) {
    const requestItem = document.createElement('li');
    const senderInfo = document.createElement('span');
    senderInfo.innerText = `Friend request from ${request.sender.username}`;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'friend-request-buttons';
    
    const acceptButton = createActionButton('Accept', 'accept', request._id);
    const declineButton = createActionButton('Decline', 'decline', request._id);

    buttonContainer.appendChild(acceptButton);
    buttonContainer.appendChild(declineButton);
    requestItem.append(senderInfo, buttonContainer);

    return requestItem;
}

function createActionButton(text, action, requestId) {
    const button = document.createElement('button');
    button.innerText = text;
    button.className = action;
    button.dataset.requestId = requestId;
    return button;
}

 async function respondToFriendRequest(requestId, status, socket) {
    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage

    if (!token) {
        console.error('Missing token. User might not be authenticated.');
        alert('You must be logged in to respond to friend requests.');
        return;
    }

    try {
        const response = await fetch('/api/friendRequests/respond', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the token
            },
            body: JSON.stringify({ requestId, status }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to respond to friend request: ${errorMessage}`);
        }

        const data = await response.json();
        if (data.success) {
            alert(`Friend request ${status}`);
            socket.emit('updateFriendList', { userId: localStorage.getItem('userId') });

            // Reload friend requests to reflect changes
            await loadFriendRequests();
        } else {
            alert('Failed to respond to friend request.');
        }
    } catch (error) {
        console.error('Error responding to friend request:', error);
    }
}

export {
    loadFriendRequests,
    displayFriendRequest,
    sendFriendRequest,
    respondToFriendRequest
};

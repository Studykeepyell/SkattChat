

export async function sendFriendRequest(receiverId) {
    const senderId = localStorage.getItem('userId'); // Get the sender's userId

    console.log("Sending friend request to:", receiverId);
    console.log("Sender ID:", senderId);

    if (!senderId || !receiverId) {
        console.error("Error: Missing senderId or receiverId");
        return;
    }

    try {
        const response = await fetch(`/api/users/friends/${receiverId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        console.log("Friend request response:", data);

        if (data.success) {
            alert('Friend request sent successfully!');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error sending friend request:", error);
    }
}



export async function loadFriendRequests() {
    const userId = localStorage.getItem('userId'); // Get the logged-in user's ID
    const token = localStorage.getItem('authToken');

    if (!userId || !token) {
        console.error('User ID or token is missing.');
        return;
    }

    try {
        const response = await fetch(`/api/friendRequests/requests/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Add the token to the request
            },
        });

        if (!response.ok) throw new Error(`Failed to load friend requests: ${response.statusText}`);
        
        const data = await response.json();
        const friendRequestList = document.getElementById('friendRequestList');

        // Log to confirm the friend request list is being accessed
        console.log("Friend request list element:", friendRequestList);

        if (friendRequestList) {
            friendRequestList.innerHTML = ''; // Clear any existing requests
        } else {
            console.error("friendRequestList element not found in the DOM.");
            return;
        }

        // Log to confirm the number of requests retrieved
        console.log("Number of friend requests received:", data.friendRequests.length);

        // Loop through each friend request and display it
        data.friendRequests.forEach(request => {
            displayFriendRequest(request); // Use existing function to display each request
        });
    } catch (error) {
        console.error("Error loading friend requests:", error);
    }
}



export function displayFriendRequest(request) {
    const requestItem = document.createElement('li');

    // Display sender info
    const senderInfo = document.createElement('span');
    senderInfo.innerText = `Friend request from ${request.senderId.username}`;

    // Accept button
    const acceptButton = document.createElement('button');
    acceptButton.innerText = 'Accept';
    acceptButton.addEventListener('click', async () => {
        await respondToFriendRequest(request._id, 'accepted', request.senderId._id, request.receiverId);
    
        // Remove the request from the UI
        requestItem.remove();
    
        console.log(`Friend request ${request._id} accepted and removed from UI.`);
    });

    // Decline button
    const declineButton = document.createElement('button');
    declineButton.innerText = 'Decline';
    declineButton.addEventListener('click', async () => {
        await respondToFriendRequest(request._id, 'declined', request.senderId._id, request.receiverId);
    
        // Remove the request from the UI
        requestItem.remove();
    
        console.log(`Friend request ${request._id} accepted and removed from UI.`);
    });

    // Append elements to the request item
    requestItem.appendChild(senderInfo);
    requestItem.appendChild(acceptButton);
    requestItem.appendChild(declineButton);

    // Append request item to the friend request list
    const friendRequestList = document.getElementById('friendRequestList');
    friendRequestList.appendChild(requestItem);

    console.log("Added friend request to the list:", request);
}


export async function respondToFriendRequest(requestId, status, socket) {
    try {
        const response = await fetch('/api/users/friends/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, status }),
        });

        const data = await response.json();
        if (data.success) {
            alert(`Friend request ${status}`);
            socket.emit('updateFriendList', { userId: localStorage.getItem('userId') });
        } else {
            alert('Failed to respond to friend request.');
        }
    } catch (error) {
        console.error('Error responding to friend request:', error);
    }
}

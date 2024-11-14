document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('searchForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput').value;

        // Perform the search using fetch
        searchUsers(searchInput);
    });

    function searchUsers(query) {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.innerHTML = ''; // Clear previous results
        // Fetch search results from the backend
        fetch(`/api/users/search?q=${query}`)
        .then(response => {
             if (response.status === 404) {
                alert("no user found");
                return Promise.reject('No users found'); 
            } 
             return response.json(); })
            .then(users => {
                users.forEach(user => {
                    const userBox = document.createElement('div');
                    userBox.className = 'box';

                    const userImage = document.createElement('img');
                    userImage.src = user.profileImage;

                    const userInfo = document.createElement('div');
                    userInfo.innerText = `(${user.username})`;

                    const userButton = document.createElement('button');
userButton.innerText = 'Add Friend';
userButton.addEventListener('click', () => {
    const senderId = localStorage.getItem('userId'); // Ensure this is defined
    console.log("Sender ID:", senderId);
    console.log("Recipient ID:", user._id); // Check if user._id is correct

    fetch(`/api/users/friends/${user._id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ senderId }) // Include senderId in the body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        alert(data.message);
    })
    .catch(error => console.error('Error adding friend:', error));
});

                    userBox.appendChild(userImage);
                    userBox.appendChild(userInfo);
                    userBox.appendChild(userButton);

                    resultsContainer.appendChild(userBox);
                });
            })
            .catch(error => console.error('Error fetching users:', error));
    }
    document.getElementById('accountButton').addEventListener('click', function() {
        window.location.href = 'account.html';
    });
      
    document.getElementById('chatButton').addEventListener('click', function() {
        window.location.href = 'chat.html';
    });    



    function sendFriendRequest(friendId) {
        const senderId = localStorage.getItem('userId');
        console.log(`Attempting to send friend request from ${senderId} to ${friendId}`);
    
        if (!senderId || !friendId) {
            console.error("Error: Missing senderId or friendId.");
            return;
        }
    
        fetch('/api/sendFriendRequest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId, recipientId: friendId })
        })
        .then(response => {
            if (!response.ok) throw new Error("Failed to send friend request.");
            return response.json();
        })
        .then(data => {
            alert(data.message);
            // Emit a friend request event to notify the recipient via socket
            socket.emit('friendRequestSent', { senderId, recipientId: friendId });
        })
        .catch(error => console.error("Error sending friend request:", error));
    }
    



});
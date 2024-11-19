document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('searchForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput').value;
        searchUsers(searchInput); // Perform the search using the entered input
    });

    // Function to search users based on the query
    function searchUsers(query) {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.innerHTML = ''; // Clear previous results

        fetch(`/api/users/search?q=${query}`)
            .then(response => {
                if (!response.ok) {
                    alert("No user found");
                    return Promise.reject('No users found'); 
                } 
                return response.json();
            })
            .then(users => {
                users.forEach(user => {
                    const userBox = document.createElement('div');
                    userBox.className = 'box';

                    const userImage = document.createElement('img');
                    userImage.src = user.profileImage || '/default-profile.png'; // Fallback if no image

                    const userInfo = document.createElement('div');
                    userInfo.innerText = `${user.username}`;

                    // Add Friend Button
                    const userButton = document.createElement('button');
                    userButton.innerText = 'Add Friend';
                    userButton.addEventListener('click', () => {
                        console.log(`Sending friend request to user ID: ${user._id}`);
                        sendFriendRequest(user._id); // Call sendFriendRequest with receiverId
                    });

                    userBox.appendChild(userImage);
                    userBox.appendChild(userInfo);
                    userBox.appendChild(userButton);

                    resultsContainer.appendChild(userBox);
                });
            })
            .catch(error => console.error('Error fetching users:', error));
    }

    // Function to send friend request
    async function sendFriendRequest(receiverId) {
        const senderId = localStorage.getItem('userId'); // Get senderId from localStorage
        console.log("Sender ID:", senderId);
        console.log("Recipient ID:", receiverId);

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
            
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            if (data.success) {
                alert('Friend request sent successfully.');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    }

    // Navigation Buttons (assuming these IDs exist in your HTML)
    document.getElementById('accountButton').addEventListener('click', function() {
        window.location.href = 'account.html';
    });
      
    document.getElementById('chatButton').addEventListener('click', function() {
        window.location.href = 'chat.html';
    });
});

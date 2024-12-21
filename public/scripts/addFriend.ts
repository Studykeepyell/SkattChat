document.addEventListener("DOMContentLoaded", () => {
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
if (!token) {
            console.error("Token not found in localStorage");
            return;
        }

    document.getElementById('searchForm')?.addEventListener('submit', function(event) {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        if (!searchInput) return;
        searchUsers(searchInput.value);
    });


    async function fetchFriends() {
        const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
        const userId = localStorage.getItem('userId'); // Retrieve userId
    
        if (!userId || !token) {
            console.error('Error: Missing userId or token');
            return [];
        }
    
        try {
            const response = await fetch(`/api/friendRequests/friends/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            return data.friends.map((friend: any) => friend._id); // Return an array of friend IDs
        } catch (error) {
            console.error('Error fetching friends:', error);
            return [];
        }
    }
    
    

    async function searchUsers(query: string) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;
        resultsContainer.innerHTML = ''; // Clear previous results
    
        // Fetch the current user's friends
        const friends = await fetchFriends();
    
        fetch(`/api/users/search?q=${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    alert("No user found");
                    return Promise.reject('No users found');
                }
                return response.json();
            })
            .then(users => {

                // Sort users: friends first, others later
                users.sort((a: any, b: any) => {
                    const aIsFriend = friends.includes(a._id);
                    const bIsFriend = friends.includes(b._id);
                    if (aIsFriend && !bIsFriend) return -1; // Friends come first
                    if (!aIsFriend && bIsFriend) return 1; // Non-friends come later
                    return 0; // No change for users with the same status
                });


                users.forEach((user: any) => {
                    const userBox = document.createElement('div');
                    userBox.className = 'box';
    
                    const userImage = document.createElement('img');
                    userImage.src = user.profileImage || '../images/default-profile.png'; // Fallback if no image
    
                    const userInfo = document.createElement('div');
                    userInfo.innerText = `${user.username}`;
    
                    // Check if the user is already a friend
                    if (!friends.includes(user._id)) {
                        const userButton = document.createElement('button');
                        userButton.innerText = 'Add Friend';
                        userButton.addEventListener('click', () => {
                            console.log(`Sending friend request to user ID: ${user._id}`);
                            sendFriendRequest(user._id); // Call sendFriendRequest with receiverId
                        });
    
                        userBox.appendChild(userButton);
                    } else {
                        const friendStatus = document.createElement('span');
                        friendStatus.innerText = 'Friend'; // Show "Friend" instead of a button
                        userBox.appendChild(friendStatus);
                    }
    
                    userBox.appendChild(userImage);
                    userBox.appendChild(userInfo);
                    if (resultsContainer) {
                        resultsContainer.appendChild(userBox);
                    }
                });
            })
            .catch(error => console.error('Error fetching users:', error));
    }
    

    // Function to send friend request
    async function sendFriendRequest(receiverId: string) {
        const senderId = localStorage.getItem('userId'); // Get the sender's userId

        console.log("Sender ID:", senderId);
        console.log("Recipient ID:", receiverId);

        if (!senderId || !receiverId) {
            console.error("Error: Missing senderId or receiverId");
            return;
        }
    
        try {
            const response = await fetch(`/api/friendRequests/send/${receiverId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ senderId }),
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
    document.getElementById('accountButton')?.addEventListener('click', function() {
        window.location.href = 'account.html';
    });
      
    document.getElementById('chatButton')?.addEventListener('click', function() {
        window.location.href = 'chat.html';
    });
});

// Make this file a module
export {};

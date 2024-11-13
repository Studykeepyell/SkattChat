document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('searchForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput').value;
        // Perform the search code goes here
        searchUsers(searchInput);
    });



    function searchUsers(query) {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.innerHTML = ''; // Clear previous results

        fetch(`http://localhost:3000/search?q=${query}`)//PLEASE READ: fetch from backend all suitble data, this is a code with express.js API however maybe change it based on the API or database youre using. 
            .then(response => response.json())
            .then(users => {
                users.forEach(user => {
                    const userBox = document.createElement('div');
                    userBox.className = 'box';
                    
                    const userImage = document.createElement('img');
                    userImage.src = user.profileImage;
                    userImage.alt = `${user.displayName}'s profile image`;
                    
                    const userInfo = document.createElement('div');
                    userInfo.innerText = `${user.displayName} (${user.username})`;
                    
                    userBox.appendChild(userImage);
                    userBox.appendChild(userInfo);
                    
                    resultsContainer.appendChild(userBox);
                });
            })
            .catch(error => console.error('Error fetching users:', error));
    }
});

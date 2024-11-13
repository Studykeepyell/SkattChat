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

                    userBox.appendChild(userImage);
                    userBox.appendChild(userInfo);

                    resultsContainer.appendChild(userBox);
                });
            })
            .catch(error => console.error('Error fetching users:', error));
    }
});
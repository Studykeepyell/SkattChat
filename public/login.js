document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', function(event) {
        console.log('Login form submitted'); // Debugging line
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!validateInput(username, password)) {
            alert('Please enter a valid username and password');
            return;
        }

        login(username, password);
    });

    function validateInput(username, password) {
        return username !== '' && password !== '';
    }

    function login(username, password) {
        const baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://skattchat.online';
    
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${baseURL}/api/users/login`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
    
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    console.log('Response received:', xhr.responseText);
                    const response = JSON.parse(xhr.responseText);
    
                    if (response.success) {
                        console.log('Login was successful.');
                        if (response.userId) {
                            localStorage.setItem('userId', response.userId);
                            console.log('userId stored in localStorage:', localStorage.getItem('userId'));
                        } else {
                            console.warn('Warning: userId is missing in the response');
                        }
    
                        localStorage.setItem('username', username);
                        localStorage.setItem('profileImageURL', response.profileImage || ''); // Store profileImage URL
                        window.location.href = '/chat.html?username=' + encodeURIComponent(username);
                    } else {
                        alert(response.message || 'Invalid username or password');
                    }
                } catch (e) {
                    console.error('Failed to parse JSON:', xhr.responseText);
                    alert('An error occurred while processing the response');
                }
            } else {
                console.error('Login failed:', xhr.status, xhr.responseText);
                alert('An error occurred during login. Please try again later.');
            }
        };
    
        xhr.onerror = function() {
            alert('A network error occurred. Please check your connection.');
        };
    
        // Send JSON data
        xhr.send(JSON.stringify({ username, password }));
    }
});
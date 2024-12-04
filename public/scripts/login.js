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

    async function login(username, password) {
        // Base URL determination
        const baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://skattchat.online';

        try {
            const response = await fetch(`${baseURL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // For handling cookies if needed
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                console.log('Login successful');
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('username', username);
                    window.location.href = '/pages/chat.html';
                }
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Show error to user
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = error.message === 'Failed to fetch' 
                    ? 'Network error - please check your connection'
                    : error.message;
                errorMessage.style.display = 'block';
            }
        }
    }
});

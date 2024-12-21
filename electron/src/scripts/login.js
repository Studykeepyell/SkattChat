document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const loginForm = document.getElementById('login-form');

    loginButton.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Your login logic here
        try {
            // Handle login API call
            // If successful, navigate to chat page
            window.location.href = 'chat.html';
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    loginForm.addEventListener('submit', function(event) {
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
        const baseURL = 'http://localhost:3000';

        try {
            const response = await fetch(`${baseURL}/api/users/login`, {  // Changed from /api/user/login to /api/users/login
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
                    
                    // Add debug logging
                    console.log('Redirecting to chat page...');
                    // Fix the path to point to the correct location
                    window.location.href = '../pages/chat.html';
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

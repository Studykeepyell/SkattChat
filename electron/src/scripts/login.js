document.addEventListener('DOMContentLoaded', () => {
    // Force development mode for Electron app
    const ENV = {
        isDev: true,  // Always use development mode for now
        apiUrl: 'http://localhost:3000'  // Always connect to localhost
    };

    console.log('Environment:', ENV);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);

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
        const apiUrl = ENV.apiUrl;
        console.log('Attempting login to:', apiUrl);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/api/auth/login`, true);
        xhr.withCredentials = true; // Add this line
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.timeout = 5000;
        
        xhr.onload = function() {
            console.log('Login response status:', xhr.status);
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('Login response:', response);
                    handleLoginResponse(response);
                } catch (e) {
                    showError('Server response error');
                    console.error('Parse error:', e);
                }
            } else {
                handleHttpError(xhr.status);
            }
        };

        xhr.onerror = function() {
            showError('Network error - please try again later');
            console.error('Network error occurred');
        };

        xhr.ontimeout = function() {
            showError('Request timed out - please try again');
            console.error('Request timed out');
        };

        try {
            xhr.send(JSON.stringify({ username, password }));
        } catch (e) {
            showError('Failed to send request');
            console.error('Send error:', e);
        }
    }

    function handleLoginResponse(data) {
        if (data.success) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', username);
            window.location.href = './pages/chat.html';
        } else {
            showError('Invalid username or password');
        }
    }

    function handleHttpError(status) {
        switch(status) {
            case 502:
                showError('Server is temporarily unavailable. Please try again later.');
                break;
            case 401:
                showError('Invalid username or password');
                break;
            default:
                showError(`Server error (${status}). Please try again later.`);
        }
        console.error('HTTP Error:', status);
    }

    function showError(message) {
        const errorDiv = document.getElementById('error-message') || createErrorDiv();
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    function createErrorDiv() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.className = 'error-message';
        document.querySelector('.login-container').insertBefore(
            errorDiv, 
            document.getElementById('login-form')
        );
        return errorDiv;
    }
});

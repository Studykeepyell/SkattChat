// Define backend URL based on the environment
const backendApiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/users'  // Added /api/users to match your route
    : 'https://skattchat.online/api/users';  // Added /api/users to match your route

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!validateInput(username, password)) {
                alert('Please enter a valid username and a strong password');
                return;
            }

            register(username, password);
        });
    } else {
        console.error('Register form not found.');
    }
});

function validateInput(username, password) {
    if (!username || username.length < 3) {
        alert('Username must be at least 3 characters long');
        return false;
    }

    if (!isPasswordStrong(password)) {
        return false;
    }

    return true;
}

function isPasswordStrong(password) {
    const minLength = 8;
    const errors = [];
    if (password.length < minLength) {
        errors.push(`at least ${minLength} characters`);
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('one special character');
    }

    if (errors.length > 0) {
        alert(`Password must contain: ${errors.join(', ')}`);
        return false;
    }

    return true;
}

function register(username, password) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${backendApiUrl}/register`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
        try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 201) {
                alert('Registration successful! Please login.');
                window.location.href = '/index.html';  // Redirect to login page
            } else {
                alert(response.message || 'Registration failed');
                console.error('Registration failed:', response);
            }
        } catch (e) {
            console.error('Failed to parse JSON:', xhr.responseText);
            alert('An error occurred while processing the response');
        }
    };

    xhr.onerror = function() {
        console.error('Network error occurred');
        alert('A network error occurred. Please check your connection.');
    };
    
    // Log the request data for debugging
    console.log('Sending registration request:', {
        url: `${backendApiUrl}/register`,
        data: { username, password }
    });

    // Send as JSON
    xhr.send(JSON.stringify({
        username: username,
        password: password
    }));
}
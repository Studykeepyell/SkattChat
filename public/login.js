// login.js

document.getElementById('login-form').addEventListener('submit', function(event) {
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
    // Basic validation: Check if username and password are not empty
    if (!username || !password) {
        return false;
    }
    // Add additional checks if needed (e.g., regex for format)
    return true;
}

function login(username, password) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/index', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // Save username to localStorage
                    localStorage.setItem('username', username);
                    // Redirect to the chat page with the username in the URL
                    window.location.href = '/chat.html?username=' + encodeURIComponent(username);
                } else {
                    alert(response.message || 'Invalid username or password');
                }
            } catch (e) {
                alert('An error occurred while processing the response');
            }
        } else {
            alert('An error occurred during login. Please try again later.');
        }
    };
    xhr.onerror = function() {
        alert('A network error occurred. Please check your connection.');
    };
    xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
}

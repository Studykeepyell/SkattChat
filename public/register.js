document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        // If the form is found, add the event listener
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!validateInput(username, password)) {
                alert('Please enter a valid username and password');
                return;
            }

            register(username, password);
        });
    } else {
        // If the form is not found, log an error
        console.error('Register form not found.');
    }
});

function validateInput(username, password) {
    return username && password;
}

function register(username, password) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '${backendApiUrl}/register', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                alert('Registration successful! You can now log in.');
                window.location.href = '/'; // Redirect to the login page
            } else {
                alert(response.message);
            }
        } else {
            alert('An error occurred during registration. Please try again later.');
        }
    };
    xhr.onerror = function() {
        alert('A network error occurred. Please check your connection.');
    };
    xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
}

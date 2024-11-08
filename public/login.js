const backendApiUrl = process.env.NODE_ENV === 'production'
    ? process.env.ONLINE_API_URL
    : process.env.LOCAL_API_URL;

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
    return username !== '' && password !== '';
}

function login(username, password) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${backendApiUrl}/api/users/login`, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    localStorage.setItem('username', username);
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
    xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
}

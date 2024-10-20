document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  let username = urlParams.get('username') || localStorage.getItem('username');

  // Validate the username
  if (!username || !username.trim()) {
      alert('Username is required to join the chat');
      window.location.href = '/'; // Redirect to login page if username is invalid
      return;
  }

  // Save the username to localStorage for future reconnections
  localStorage.setItem('username', username);

  // Display a welcome message
  const welcomeMessageElement = document.getElementById('welcomeMessage');
  if (welcomeMessageElement) {
      welcomeMessageElement.textContent = `Welcome, ${username}!`;
  } else {
      console.warn('Welcome message element not found.');
  }

  // Connect to the Socket.IO server
  const socket = io();

  // Send the username to the server
  socket.emit('join', username);

  // Handle the form submission to send a message
  const messageForm = document.getElementById('chat-form');
  if (messageForm) {
      messageForm.addEventListener('submit', function(event) {
          event.preventDefault(); // Prevent the form from submitting normally

          // Get the message input value
          const messageInput = document.getElementById('messageForm');
          const message = messageInput ? messageInput.value : '';

          // Send the message to the server if it's not empty
          if (message.trim()) {
              socket.emit('chat message', { username, message });

              // Clear the input field
              messageInput.value = '';
          }
      });
  } else {
      console.warn('Message form element not found.');
  }

  // Listen for chat messages from the server
  socket.on('chat message', function(data) {
      const messagesList = document.getElementById('messages');
      if (messagesList) {
          const item = document.createElement('li');
          item.textContent = `${data.username}: ${data.message}`;
          messagesList.appendChild(item);
      } else {
          console.warn('Messages list element not found.');
      }
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
      console.log('You have been disconnected');
  });
});

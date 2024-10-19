
// Connect to the server using Socket.IO
const socket = io();

// Listen for form submission to send the message to the server
document.querySelector('#chat-form').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent form from reloading the page

  const input = document.querySelector('#message-input');
  const message = input.value;

  // Emit the chat message to the server
  socket.emit('chat message', message);

  // Clear the input field after sending
  input.value = '';
});

// Listen for chat messages from the server
socket.on('chat message', function(msg) {
  const messages = document.querySelector('#messages');
  const newMessage = document.createElement('li');
  newMessage.textContent = msg;
  messages.appendChild(newMessage);
});

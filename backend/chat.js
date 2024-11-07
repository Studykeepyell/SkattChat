// chat.js
const Message = require('./models/Message'); // Adjust path if needed

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected to the chat:', socket.id);

    // Load chat history from the database and send it to the client
    Message.find().sort({ timestamp: 1 }).limit(100)
      .then(messages => {
        socket.emit('chat history', messages);
      })
      .catch(err => {
        console.log('Error fetching messages:', err);
      });

    // Handle incoming chat messages
    socket.on('chat message', (data) => {
      console.log(`Message from ${data.username}: ${data.message}`);
      
      // Save the message to the database
      const newMessage = new Message({
        username: data.username,
        message: data.message,
        timestamp: data.timestamp
      });

      newMessage.save()
        .then(() => {
          console.log('Message saved successfully');
          // Broadcast the message to all connected clients
          io.emit('chat message', data);
        })
        .catch(err => {
          console.log('Error saving message:', err);
        });
    });

    // Handle the 'clear messages' event
    socket.on('clear messages', () => {
      // Delete all messages from the database
      Message.deleteMany({})
        .then(() => {
          console.log('All messages deleted');
          // Broadcast the 'clear messages' event to all clients
          io.emit('clear messages');
        })
        .catch(err => {
          console.log('Error deleting messages:', err);
        });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected from the chat:', socket.id);
    });
  });
};

const Message = require('../models/Message');
const Room = require('../models/Room');
function setupChat(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

  // Join a room and send chat history
socket.on('joinRoom', async (room) => {
    const existingRoom = await Room.findOne({ roomId: room });
    if (!existingRoom) {
        console.error(`Room "${room}" does not exist in the database.`);
        return; // Optionally send an error message to the client
    }

    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    // Emit chat history for the joined room
    Message.find({ room })
        .sort({ timestamp: 1 })
        .then(messages => {
            socket.emit('chat history', messages);
        })
        .catch(err => console.error('Error loading messages:', err));
});


socket.on('chat message', async (data) => {
    const { room, username, userId, message, timestamp } = data;

    if (!message || !room || !userId || !username) {
        console.error("Error: Missing required fields 'message', 'room', 'userId', or 'username'");
        return;
    }

    const newMessage = {
        room,
        username,
        userId,
        message,
        timestamp
    };

    try {
        await Message.create(newMessage);
        io.to(room).emit('chat message', newMessage); // Broadcast within the room
    } catch (err) {
        console.error('Error saving message:', err);
    }
});


      // chat.js or server.js - Listen for chat history requests
socket.on('requestChatHistory', async (room) => {
  try {
      const messages = await Message.find({ room }).sort({ timestamp: 1 });
      socket.emit('chat history', messages); // Emit history to the client
  } catch (error) {
      console.error(`Error fetching chat history for room ${room}:`, error);
  }
});


        // Handle clearing all messages in a room
        socket.on('clear messages', async (room) => {
            try {
                // Clear messages for the specified room in the database
                await Message.deleteMany({ room });
                io.to(room).emit('clear messages'); // Notify all clients in the room to clear the chat display
                console.log(`Cleared all messages in room: ${room}`);
            } catch (err) {
                console.error('Error clearing messages:', err);
            }
        });
    });
}

module.exports = setupChat;
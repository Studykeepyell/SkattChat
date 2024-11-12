const Message = require('./models/Message');

function setupChat(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a room
        socket.on('joinRoom', (room) => {
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

        // Handle message emission with validation
        socket.on('chat message', async (data) => {
            const { room, username, userId, message, timestamp } = data;

            // Validate that required fields are not empty
            if (!message || !room || !userId || !username) {
                console.error("Error: Missing required fields 'message', 'room', 'userId', or 'username'");
                return;
            }

            const newMessage = {
                room,
                username,
                message,
                timestamp
            };

            try {
                // Save message and broadcast within the room
                await Message.create(newMessage);
                io.to(room).emit('chat message', newMessage); // Broadcast within room only
            } catch (err) {
                console.error('Error saving message:', err);
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

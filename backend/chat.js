const Message = require('./models/Message'); // Ensure Message model is correctly configured

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
            const { room, username, message, timestamp } = data;

            // Validate that required fields are not empty
            if (!message || !room) {
                console.error("Error: Missing required fields 'message' or 'room'");
                return;
            }

            const newMessage = {
                room,
                username,
                message, // Use `message` if the schema expects this field
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
    });
}

module.exports = setupChat;

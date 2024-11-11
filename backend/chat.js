// chat.js
const Message = require('./models/Message'); // Make sure Message model is correctly configured

function setupChat(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a specific chat room
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);

            // Send the chat history for this room to the newly joined user
            Message.find({ roomId })
                .sort({ timestamp: 1 }) // Sort messages by timestamp
                .then((messages) => {
                    socket.emit('loadMessages', messages); // Send previous messages to the client
                })
                .catch((err) => console.error('Error loading messages:', err));
        });

        // Handle sending a new message in the room
        socket.on('chatMessage', async (data) => {
            const { roomId, senderId, content } = data;
            
            try {
                // Create and save the new message to the database
                const message = new Message({ roomId, senderId, content });
                await message.save();

                // Broadcast the message to all users in the room
                io.to(roomId).emit('newMessage', message);
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        // Handle clearing chat history in a room
        socket.on('clearMessages', async (roomId) => {
            try {
                await Message.deleteMany({ roomId });
                io.to(roomId).emit('messagesCleared');
            } catch (err) {
                console.error('Error clearing messages:', err);
            }
        });

        // Disconnecting the user
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}
module.exports = setupChat;

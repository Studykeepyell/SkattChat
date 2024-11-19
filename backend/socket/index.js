const userSocketMap = {};
const Message = require('../models/Message');

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Handle user login
        socket.on('login', (userId) => {
            userSocketMap[userId] = socket.id;
            console.log(`User ${userId} connected with socket ${socket.id}`);
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            for (const [userId, socketId] of Object.entries(userSocketMap)) {
                if (socketId === socket.id) {
                    delete userSocketMap[userId];
                    console.log(`User ${userId} disconnected.`);
                }
            }
        });

        socket.on('joinRoom', (roomId) => {
            console.log(`Raw roomId:`, roomId);
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room: ${roomId}`);
        });
        

        // Chat events
        socket.on('chat message', async (data) => {
            const { roomId, username, userId, message, timestamp } = data;
            
            // Save the message to the database
            try {
                const newMessage = new Message({
                    roomId,
                    userId,
                    username,
                    message,
                    timestamp
                });
                await newMessage.save();
        
                // Broadcast the message to everyone in the room
                io.to(roomId).emit('chat message', {
                    roomId,
                    username,
                    userId,
                    message,
                    timestamp
                });
                console.log(`Message sent to room ${roomId} by ${username}: ${message}`);
            // Emit the message to all users in the room
            io.to(roomId).emit('chatMessage', newMessage);
            console.log(`Message sent to room ${roomId}: ${message}`);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    });
};

module.exports = { setupSocket, userSocketMap };

const userSocketMap = {};
const Message = require('../models/Message');
const Room = require('../models/Room');

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

        socket.on('joinRoom', async (roomId) => {
            const existingRoom = await Room.findOne({ roomId });
            if (!existingRoom) {
                console.error(`Room "${roomId}" does not exist in the database.`);
                return; // Optionally send an error message to the client
            }
        
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
        
            // Emit chat history for the joined room
            try {
                const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
                socket.emit('chat history', messages);
            } catch (error) {
                console.error(`Error loading messages for room ${roomId}:`, error);
            }
        });
        
        

      // Listen for chat message
    socket.on('chat message', async (data) => {
        const { roomId, username, userId, message, timestamp } = data;

        console.log('Chat message received:', data); // Debug log

        if (!roomId || !username || !userId || !message) {
            console.error('Invalid message data:', data);
            return;
        }

        try {
            const newMessage = await Message.create({ roomId, username, userId, message, timestamp });
            console.log('Message saved to database:', newMessage); // Debug log

            // Broadcast the message to the room
            io.to(roomId).emit('chat message', newMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    });
};

module.exports = { setupSocket, userSocketMap };

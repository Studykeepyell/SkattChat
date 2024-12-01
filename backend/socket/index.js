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
            if (!roomId) {
                console.error('Room ID is missing!');
                socket.emit('errorMessage', { error: 'Room ID is required to join the room.' });
                return;
            }
        
            try {
                const existingRoom = await Room.findOne({ roomId }).populate('messages');
                if (!existingRoom) {
                    console.error(`Room "${roomId}" does not exist!`);
                    socket.emit('errorMessage', { error: `Room "${roomId}" does not exist.` });
                    return;
                }
        
                socket.join(roomId);
                console.log(`User ${socket.id} joined room: ${roomId}`);
        
                // Combine chat history and room details into one event
                socket.emit('roomUpdate', {
                    roomId,
                    roomName: existingRoom.name,
                    messages: existingRoom.messages.map((msg) => ({
                        sender: msg.username,
                        content: msg.message,
                        timestamp: msg.timestamp,
                    })),
                });
            } catch (error) {
                console.error(`Error loading messages for room "${roomId}":`, error);
                socket.emit('errorMessage', { error: 'Failed to load room details.' });
            }
        });
        
        
        
    }
    )};

module.exports = { setupSocket, userSocketMap };

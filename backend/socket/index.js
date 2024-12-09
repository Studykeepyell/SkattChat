const userSocketMap = {};
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

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
            try {
                // Input validation
                if (!roomId) {
                    throw new Error('Room ID is required');
                }
            
                const existingRoom = await Room.findOne({ roomId })
                    .populate({
                        path: 'messages',
                        options: { 
                            sort: { timestamp: 1 },  // Sort messages by timestamp
                            limit: 100  // Limit to last 100 messages for performance
                        }
                    });
            
                if (!existingRoom) {
                    console.error(`Room "${roomId}" does not exist!`);
                    socket.emit('errorMessage', { 
                        error: `Room "${roomId}" does not exist.`,
                        code: 'ROOM_NOT_FOUND'
                    });
                    return;
                }

                const room = await Room.findOne({ roomId });
                if (room.isPrivate) {
                    const userIds = roomId.split('_');
                    const users = await Promise.all(userIds.map(id => 
                        User.findById(id).select('username')
                    ));
                    const otherUser = users.find(u => u._id.toString() !== socket.userId);
                    room.name = `Chat with ${otherUser.username}`;
                }
            
                // Join the socket room
                await socket.join(roomId);
                console.log(`User ${socket.id} joined room: ${roomId}`);
            
                // Notify other users in the room
                socket.to(roomId).emit('userJoined', {
                    userId: socket.id,
                    timestamp: new Date().toISOString()
                });
            
                // Send room data to joining user
                socket.emit('roomUpdate', {
                    roomId,
                    roomName: room.name,
                    activeUsers: Array.from(socket.adapter.rooms.get(roomId) || []),
                    messages: existingRoom.messages.map((msg) => ({
                        id: msg._id,
                        sender: msg.username,
                        content: msg.message,
                        timestamp: msg.timestamp,
                        userId: msg.userId
                    })),
                    metadata: {
                        createdAt: existingRoom.createdAt,
                        lastActivity: existingRoom.updatedAt
                    }
                });
            
            } catch (error) {
                console.error(`Error in room "${roomId}":`, error);
                socket.emit('errorMessage', { 
                    error: 'Failed to load room details.',
                    details: error.message,
                    code: 'ROOM_LOAD_ERROR'
                });
            }
        });

        // Add message handler
        socket.on('message', async (data) => {
            try {
                const { roomId, userId, username, message, timestamp } = data;
                console.log('Received message:', data);

                // Save message to database
                const newMessage = new Message({
                    roomId,
                    userId,
                    username,
                    message,
                    timestamp
                });
                await newMessage.save();

                // Update room's last activity
                await Room.findOneAndUpdate(
                    { roomId },
                    { 
                        $set: { lastActivity: timestamp },
                        $push: { messages: newMessage._id }
                    }
                );

                // Broadcast to all clients in the room
                io.in(roomId).emit('message', {
                    messageId: newMessage._id,
                    roomId,
                    userId,
                    username,
                    message,
                    timestamp
                });

                // Send room update to all clients
                const updatedRoom = await Room.findOne({ roomId })
                    .populate('messages');
                io.in(roomId).emit('roomUpdate', {
                    roomId,
                    name: updatedRoom.name,
                    lastActivity: timestamp,
                    messageCount: updatedRoom.messages.length
                });

            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('error', 'Failed to send message');
            }
        });
    });
};

module.exports = { setupSocket, userSocketMap };

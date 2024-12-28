import { Socket } from 'socket.io';

interface CustomSocket extends Socket {
    userId?: string;
}

const userSocketMap: { [key: string]: string } = {};

import { Server } from 'socket.io';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

const setupSocket = (io: Server) => {
    io.on('connection', (socket: CustomSocket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Handle user login
        socket.on('login', (userId: string) => {
            userSocketMap[userId as keyof typeof userSocketMap] = socket.id;
            socket.userId = userId;
            console.log(`User ${userId} connected with socket ${socket.id}`);
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            for (const [userId, socketId] of Object.entries(userSocketMap)) {
                if (socketId === socket.id) {
                    delete userSocketMap[userId as keyof typeof userSocketMap];
                    console.log(`User ${userId} disconnected.`);
                }
            }
        });

        // Handle room list requests
        socket.on('requestRooms', async () => {
            console.log('Room list requested by socket:', socket.id);
            try {
                if (!socket.userId) {
                    console.error('User not authenticated');
                    socket.emit('error', { message: 'User not authenticated' });
                    return;
                }

                const rooms = await Room.find({
                    $or: [
                        { participants: socket.userId },
                        { participants: { $size: 0 } }
                    ]
                }).populate('participants', 'username profileImage').lean();

                const formattedRooms = rooms.map(room => ({
                    roomId: room.roomId,
                    name: room.name,
                    lastMessageTime: room.lastMessageTime || room.updatedAt,
                    updatedAt: room.updatedAt,
                    participants: room.participants.map((p: any) => ({
                        id: p._id,
                        username: p.username,
                        profileImage: p.profileImage
                    }))
                }));

                console.log('Sending room list:', formattedRooms);
                socket.emit('roomList', formattedRooms);
            } catch (error) {
                console.error('Error fetching rooms:', error);
                socket.emit('error', { message: 'Failed to fetch rooms' });
            }
        });

        socket.on('joinRoom', async (data) => {
            try {
                const roomId = typeof data === 'object' ? data.roomId : data;
                
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
                        },
                        populate: {
                            path: 'userId',
                            select: 'username'
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
                if (!room) {
                    socket.emit('errorMessage', { 
                        error: 'Room not found',
                        code: 'ROOM_NOT_FOUND'
                    });
                    return;
                }

                if (room.isPrivate) {
                    const userIds = roomId.split('_');
                    const users = await Promise.all(userIds.map((id: string) => 
                        User.findById(id).select('username').lean()
                    )) as { _id: string; username: string }[];
                    const otherUser = users.find(u => u._id.toString() !== socket.userId);
                    if (otherUser) {
                        room.name = `Chat with ${otherUser.username}`;
                    }
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
                    activeUsers: Array.from(io.sockets.adapter.rooms.get(roomId) || []),
                    messages: existingRoom.messages.map((msg: any) => ({
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
            
            } catch (error: any) {
                console.error(`Error in room "${data}":`, error);
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
                if (!updatedRoom) {
                    socket.emit('errorMessage', { 
                        error: 'Room not found',
                        code: 'ROOM_NOT_FOUND'
                    });
                    return;
                }

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

export { setupSocket, userSocketMap };

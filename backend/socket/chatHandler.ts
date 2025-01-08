import { Server, Socket } from 'socket.io';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { CustomSocket } from './types.js';

export class ChatHandler {
    constructor(private io: Server) {}

    handleConnection(socket: CustomSocket) {
        socket.on('message', (data: any) => this.handleMessage(socket, data));
        socket.on('joinRoom', (data: any) => this.handleJoinRoom(socket, data));
        socket.on('createRoom', (data: any) => this.handleCreateRoom(socket, data));
        socket.on('requestRooms', () => this.handleRequestRooms(socket));
    }

    private async handleMessage(socket: CustomSocket, data: any) {
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
            this.io.in(roomId).emit('message', {
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

            this.io.in(roomId).emit('roomUpdate', {
                roomId,
                name: updatedRoom.name,
                lastActivity: timestamp,
                messageCount: updatedRoom.messages.length
            });

        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('error', 'Failed to send message');
        }
    }

    private async handleJoinRoom(socket: CustomSocket, data: any) {
        try {
            const roomId = typeof data === 'object' ? data.roomId : data;
            
            if (!roomId) {
                throw new Error('Room ID is required');
            }
        
            const existingRoom = await Room.findOne({ roomId })
                .populate({
                    path: 'messages',
                    options: { 
                        sort: { timestamp: 1 },
                        limit: 100
                    },
                    populate: {
                        path: 'userId',
                        select: 'username'
                    }
                });
        
            if (!existingRoom) {
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
                activeUsers: Array.from(this.io.sockets.adapter.rooms.get(roomId) || []),
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
    }

    private async handleCreateRoom(socket: CustomSocket, data: any) {
        try {
            const { name } = data;
            const room = new Room({
                name,
                createdBy: socket.userId
            });
            await room.save();
            
            this.io.emit('roomCreated', room);
            await this.handleRequestRooms(socket);
        } catch (error) {
            socket.emit('error', 'Failed to create room');
        }
    }

    private async handleRequestRooms(socket: CustomSocket) {
        try {
            console.log(`[CHAT] Fetching rooms for user: ${socket.userId}`);
            
            if (!socket.userId) {
                console.error('[CHAT] User not authenticated');
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }

            const rooms = await Room.find({
                $or: [
                    { participants: socket.userId },
                    { participants: { $size: 0 } }
                ]
            })
            .populate('participants', 'username profileImage')
            .sort({ updatedAt: -1 })
            .lean();

            console.log(`[CHAT] Found ${rooms.length} rooms for user`);

            const formattedRooms = rooms.map(room => ({
                roomId: room.roomId || room._id,
                name: room.name,
                isPrivate: room.isPrivate || false,
                lastMessageTime: room.lastMessageTime || room.updatedAt,
                updatedAt: room.updatedAt,
                participants: room.participants.map((p: any) => ({
                    id: p._id,
                    username: p.username,
                    profileImage: p.profileImage
                }))
            }));

            console.log('[CHAT] Sending room list to client');
            socket.emit('roomList', formattedRooms);
        } catch (error) {
            console.error('[CHAT] Error fetching rooms:', error);
            socket.emit('error', { message: 'Failed to fetch rooms' });
        }
    }
} 
import { Server } from 'socket.io';
import ChatRoom from '../../models/chatroom/ChatRoom.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import { CustomSocket } from '../../socket/types.js';
import { Types } from 'mongoose';

export class RoomSocketHandlers {
    constructor(private io: Server) {
        // Listen for profile updates
        this.setupProfileUpdateListener();
    }

    private setupProfileUpdateListener() {
        this.io.on('connection', (socket: CustomSocket) => {
            socket.on('profileUpdated', async (data: { userId: string, profileImage: any }) => {
                await this.handleProfileUpdate(data.userId, data.profileImage);
            });
        });
    }

    private async handleProfileUpdate(userId: string, profileImage: any) {
        try {
            // Find all rooms where this user is a member
            const rooms = await ChatRoom.find({ members: userId });

            // Update profile image in each room's memberProfiles
            await Promise.all(rooms.map(async room => {
                const memberProfileIndex = room.memberProfiles.findIndex(
                    profile => profile.userId.toString() === userId
                );

                if (memberProfileIndex !== -1) {
                    room.memberProfiles[memberProfileIndex].profileImage = profileImage;
                } else {
                    room.memberProfiles.push({
                        userId: new Types.ObjectId(userId),
                        profileImage,
                        role: 'member'
                    });
                }

                await room.save();

                // Notify all room members about the update
                this.io.to(room.roomId).emit('memberProfileUpdated', {
                    roomId: room.roomId,
                    userId,
                    profileImage
                });
            }));

            // Trigger room list update for all connected users who are members of affected rooms
            const connectedSockets = await this.io.fetchSockets();
            for (const socket of connectedSockets) {
                const customSocket = socket as unknown as CustomSocket;
                if (customSocket.userId) {
                    await this.handleRequestRooms(customSocket);
                }
            }

        } catch (error) {
            console.error('[CHAT] Error updating profile in rooms:', error);
        }
    }

    async handleCreateRoom(socket: CustomSocket, data: any) {
        try {
            const { name } = data;
            const room = new ChatRoom({
                name,
                type: 'public',
                hostId: socket.userId,
                members: [socket.userId],
                memberProfiles: [{
                    userId: socket.userId,
                    role: 'host'
                }]
            });
            await room.save();
            
            this.io.emit('roomCreated', room);
            await this.handleRequestRooms(socket);
        } catch (error) {
            socket.emit('error', 'Failed to create room');
        }
    }

    async handleJoinRoom(socket: CustomSocket, data: any) {
        try {
            const roomId = typeof data === 'object' ? data.roomId : data;
            
            if (!roomId) {
                throw new Error('Room ID is required');
            }
        
            const existingRoom = await ChatRoom.findOne({ roomId: roomId });
        
            if (!existingRoom) {
                socket.emit('errorMessage', { 
                    error: `Room "${roomId}" does not exist.`,
                    code: 'ROOM_NOT_FOUND'
                });
                return;
            }

            const messages = await this.getMessages(roomId);
            console.log('[CHAT] Retrieved message history:', messages);

            // Use the existing room instead of finding it again
            const room = existingRoom;

            if (room.type === 'private') {
                const memberIds = room.members;
                const users = (await Promise.all(memberIds.map((id: Types.ObjectId) => 
                    User.findById(id).select('_id username').lean()
                ))).filter(Boolean);

                const otherUser = users.find(u => u?._id.toString() !== socket.userId);
                if (otherUser?.username) {
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
                metadata: {
                    createdAt: existingRoom.createdAt,
                    lastActivity: existingRoom.updatedAt
                }
            });

            // Send message history separately
            socket.emit('messageHistory', messages);

        } catch (error: any) {
            console.error(`Error in room "${data}":`, error);
            socket.emit('errorMessage', { 
                error: 'Failed to load room details.',
                details: error.message,
                code: 'ROOM_LOAD_ERROR'
            });
        }
    }

    async handleRequestRooms(socket: CustomSocket) {
        try {
            console.log(`[CHAT] Fetching rooms for user: ${socket.userId}`);
            
            if (!socket.userId) {
                console.error('[CHAT] User not authenticated');
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }

            const rooms = await ChatRoom.find({
                $or: [
                    { members: socket.userId },
                    { type: 'public' }
                ]
            })
            .populate('members', 'username profileImage')
            .populate('hostId', 'username profileImage')
            .sort({ lastMessageTime: -1 })
            .lean();

            console.log(`[CHAT] Found ${rooms.length} rooms for user`);

            // For each private room, get the other participant's profile
            const formattedRooms = await Promise.all(rooms.map(async room => {
                let memberProfiles = room.memberProfiles || [];
                
                // If it's a private room and profiles need updating
                if (room.type === 'private' && room.members.length === 2) {
                    const otherParticipant = room.members.find(
                        (p: any) => p._id.toString() !== socket.userId
                    );
                    
                    if (otherParticipant) {
                        // Get the other participant's full profile
                        const user = await User.findById(otherParticipant._id)
                            .select('username profileImage')
                            .lean();
                            
                        if (user?.profileImage) {
                            // Update or add profile in memberProfiles
                            const profileIndex = memberProfiles.findIndex(
                                (p: any) => p.userId.toString() === otherParticipant._id.toString()
                            );
                            
                            if (profileIndex >= 0) {
                                memberProfiles[profileIndex].profileImage = user.profileImage;
                            } else {
                                memberProfiles.push({
                                    userId: otherParticipant._id,
                                    role: 'member',
                                    profileImage: user.profileImage
                                });
                            }
                            
                            // Update the room's memberProfiles
                            await ChatRoom.findByIdAndUpdate(room._id, {
                                $set: { memberProfiles }
                            });
                        }
                    }
                }

                return {
                    roomId: room.roomId || room._id,
                    name: room.name,
                    type: room.type,
                    lastMessage: room.lastMessage || room.updatedAt,
                    updatedAt: room.updatedAt,
                    members: room.members.map((p: any) => ({
                        _id: p._id,
                        username: p.username,
                        profileImage: memberProfiles.find(
                            (profile: any) => profile.userId.toString() === p._id.toString()
                        )?.profileImage
                    }))
                };
            }));

            console.log('[CHAT] Sending room list to client');
            socket.emit('roomList', formattedRooms);
        } catch (error) {
            console.error('[CHAT] Error fetching rooms:', error);
            socket.emit('error', { message: 'Failed to fetch rooms' });
        }
    }

    private async getMessages(roomId: string, limit: number = 100) {
        try {
            console.log('[CHAT] Getting messages for room:', roomId);
            
            // First find the room
            const room = await ChatRoom.findOne({ roomId })
                .populate({
                    path: 'messages',
                    options: { 
                        sort: { timestamp: -1 },
                        limit
                    }
                })
                .lean();

            if (!room) {
                console.log('[CHAT] Room not found:', roomId);
                return [];
            }

            console.log('[CHAT] Found room with messages:', room.messages?.length || 0);

            // If no messages in room, try finding them directly
            if (!room.messages || room.messages.length === 0) {
                console.log('[CHAT] No messages in room, searching messages collection');
                const messages = await Message.find({ roomId })
                    .sort({ timestamp: -1 })
                    .limit(limit)
                    .lean();
                
                console.log('[CHAT] Found messages directly:', messages.length);
                return messages.map(msg => ({
                    id: msg._id,
                    sender: msg.username,
                    content: msg.message,
                    timestamp: msg.timestamp,
                    userId: msg.userId
                }));
            }

            // Map the populated messages to the expected format
            const formattedMessages = room.messages.map((msg: any) => ({
                id: msg._id,
                sender: msg.username,
                content: msg.message,
                timestamp: msg.timestamp,
                userId: msg.userId
            }));

            console.log('[CHAT] Returning formatted messages:', formattedMessages.length);
            return formattedMessages;
            
        } catch (error) {
            console.error('[CHAT] Error getting messages:', error);
            return [];
        }
    }
} 
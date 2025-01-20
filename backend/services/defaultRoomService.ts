import mongoose from 'mongoose';
import ChatRoom from '../models/chatroom/ChatRoom.js';

export class DefaultRoomService {
    private static readonly DEFAULT_ROOM_ID = 'default_global_chat';
    private static readonly DEFAULT_ROOM_NAME = 'Global Chat';

    public static async ensureDefaultRoomExists(): Promise<void> {
        try {
            // Check if default room exists
            let defaultRoom = await ChatRoom.findOne({ roomId: this.DEFAULT_ROOM_ID });

            if (!defaultRoom) {
                // Create default room if it doesn't exist
                defaultRoom = new ChatRoom({
                    roomId: this.DEFAULT_ROOM_ID,
                    type: 'public',
                    name: this.DEFAULT_ROOM_NAME,
                    description: 'Welcome to the Global Chat Room!',
                    members: [], // Will be populated as users join
                    memberProfiles: [], // Will be populated as users join
                    messages: [],
                    hostId: new mongoose.Types.ObjectId(), // System user as host
                    settings: {
                        allowNewMembers: true,
                        maxMembers: 1000,
                        isModerated: true
                    }
                });

                await defaultRoom.save();
                console.log('[DEFAULT_ROOM] Created default global chat room');
            }
        } catch (error) {
            console.error('[DEFAULT_ROOM] Error ensuring default room exists:', error);
            throw error;
        }
    }

    public static async addUserToDefaultRoom(userId: string): Promise<void> {
        try {
            // First ensure default room exists
            await DefaultRoomService.ensureDefaultRoomExists();
            
            // Find and update in one atomic operation
            const result = await ChatRoom.findOneAndUpdate(
                { roomId: DefaultRoomService.DEFAULT_ROOM_ID },
                {
                    $addToSet: { // Use $addToSet to prevent duplicates
                        members: new mongoose.Types.ObjectId(userId),
                        memberProfiles: {
                            userId: new mongoose.Types.ObjectId(userId),
                            role: 'member'
                        }
                    }
                },
                { new: true }
            );

            if (!result) {
                throw new Error('Failed to add user to default room');
            }

            console.log(`[DEFAULT_ROOM] User ${userId} status in default room updated`);
        } catch (error) {
            console.error('[DEFAULT_ROOM] Error adding user to default room:', error);
            throw error;
        }
    }

    public static async getVisibleRooms(userId: string): Promise<any[]> {
        try {
            // Get rooms where:
            // 1. User is a member (private or public)
            // 2. Room is the default global chat
            return await ChatRoom.find({
                $or: [
                    { members: new mongoose.Types.ObjectId(userId) },
                    { roomId: this.DEFAULT_ROOM_ID }
                ]
            })
            .populate('members', 'username profileImage')
            .populate('hostId', 'username profileImage')
            .populate('memberProfiles.userId', 'username profileImage')
            .sort({ 'lastMessage.timestamp': -1 });
        } catch (error) {
            console.error('[DEFAULT_ROOM] Error getting visible rooms:', error);
            throw error;
        }
    }
} 
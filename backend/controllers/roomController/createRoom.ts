import { Request, Response } from 'express';
import ChatRoom from '../../models/chatroom/ChatRoom.js';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
    user?: { id: string; username: string };
}

export const createRoom = async (req: AuthRequest, res: Response) => {
    try {
        const { type, name, members, memberProfiles, description } = req.body;
        const userId = req.user?.id;

        if (!userId || !type || !name) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // For private rooms, ensure exactly 2 members
        if (type === 'private' && (!members || members.length !== 2)) {
            return res.status(400).json({
                success: false,
                message: 'Private rooms must have exactly 2 members'
            });
        }

        // For public rooms, set creator as host
        const roomData = {
            type,
            name,
            members: type === 'private' ? members : [userId],
            memberProfiles: type === 'private' ? memberProfiles : [{
                userId,
                role: 'host'
            }],
            description: description || '',
            hostId: type === 'public' ? userId : undefined,
            settings: {
                maxMembers: type === 'private' ? 2 : 100,
                isModerated: type === 'public',
                allowNewMembers: type === 'public'
            }
        };

        const room = await ChatRoom.create(roomData);
        
        // Populate member profiles
        const populatedRoom = await ChatRoom.findById(room._id)
            .populate('members', 'username profileImage')
            .populate('hostId', 'username profileImage');

        res.json({
            success: true,
            room: populatedRoom
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create room'
        });
    }
}; 
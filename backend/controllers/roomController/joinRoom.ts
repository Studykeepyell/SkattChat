import { Request, Response } from 'express';
import ChatRoom from '../../models/chatroom/ChatRoom.js';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
    user?: { id: string; username: string };
}

export const joinRoom = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const userId = req.user?.id;

        if (!userId || !roomId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const room = await ChatRoom.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (room.type === 'private') {
            return res.status(403).json({
                success: false,
                message: 'Cannot join private rooms'
            });
        }

        if (!room.settings.allowNewMembers) {
            return res.status(403).json({
                success: false,
                message: 'Room is not accepting new members'
            });
        }

        if (room.members.length >= room.settings.maxMembers) {
            return res.status(403).json({
                success: false,
                message: 'Room is full'
            });
        }

        // Add member if not already in room
        if (!room.members.includes(new Types.ObjectId(userId))) {
            room.members.push(new Types.ObjectId(userId));
            room.memberProfiles.push({
                userId: new Types.ObjectId(userId),
                role: 'member'
            });
            await room.save();
        }

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join room'
        });
    }
}; 
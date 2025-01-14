import { Request, Response } from 'express';
import ChatRoom from '../../models/chatroom/ChatRoom.js';

interface AuthRequest extends Request {
    user?: { id: string; username: string };
}

export const getRooms = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const rooms = await ChatRoom.find({
            members: userId
        })
        .populate('members', 'username profileImage')
        .populate('hostId', 'username profileImage')
        .sort({ lastMessageTime: -1 });

        res.json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get rooms'
        });
    }
}; 
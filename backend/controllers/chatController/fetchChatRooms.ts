import { Request, Response } from 'express';
import Room from '../../models/Room.js';
import { IParticipant } from './types.js';

interface AuthRequest extends Request {
    user?: { id: string };
}

export const fetchChatRooms = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    try {
        const rooms = await Room.find({
            $or: [
                { participants: userId },
                { participants: { $size: 0 } },
            ]
        }).populate<{ participants: IParticipant[] }>('participants', 'username profileImage')
        .lean();

        const formattedRooms = rooms.map(room => ({
            roomId: room.roomId,
            name: room.name,
            lastMessageTime: room.lastMessageTime || null,
            participants: room.participants.map(participant => ({
                id: participant._id,
                username: participant.username,
                profileImage: participant.profileImage,
            })),
        }));

        console.log('Formatted Rooms:', formattedRooms);
        res.json({ success: true, rooms: formattedRooms });
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
    }
};
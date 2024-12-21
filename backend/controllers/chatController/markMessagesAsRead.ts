import { Request, Response } from 'express';
import Room from '../../models/Room.js';

interface AuthRequest extends Request {
    user?: { id: string };
}


export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
    const { roomId } = req.params;
    const userId = req.user?.id;

    try {
        await Room.findOneAndUpdate(
            { roomId, 'unreadMessages.userId': userId },
            { $set: { 'unreadMessages.$.count': 0 } }
        );
        res.status(200).json({ success: true, message: 'Messages marked as read.' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Error marking messages as read.' });
    }
};
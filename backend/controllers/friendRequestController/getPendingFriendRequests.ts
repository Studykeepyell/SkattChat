import { Request, Response } from 'express';
import FriendRequest from '../../models/FriendRequest.js';

export const getPendingFriendRequests = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const pendingRequests = await FriendRequest.find({ receiver: userId, status: 'pending' })
            .populate('sender', 'username profileImage');

        res.json({ success: true, friendRequests: pendingRequests });
    } catch (error) {
        console.error('[GET PENDING FRIEND REQUESTS] Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching friend requests.' });
    }
};
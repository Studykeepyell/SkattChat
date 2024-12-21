import { Request, Response } from 'express';
import mongoose from 'mongoose';
import FriendRequest from '../../models/FriendRequest.js';
import User from '../../models/User.js';

// Add this interface to extend Request
interface AuthRequest extends Request {
    user?: { id: string };
}

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
    const senderId = req.user?.id;
    const { receiverId } = req.params;

    console.log('[SEND FRIEND REQUEST] Sender ID:', senderId);
    console.log('[SEND FRIEND REQUEST] Receiver ID:', receiverId);

    if (!senderId || !receiverId) {
        return res.status(400).json({ success: false, message: 'Sender and receiver IDs are required.' });
    }

    try {
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ success: false, message: 'Sender not found.' });
        }

        if (sender.friends.includes(receiverId)) {
            return res.status(400).json({ success: false, message: 'Users are already friends.' });
        }

        const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverObjectId,
            status: 'pending',
        });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Friend request already sent.' });
        }

        const friendRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverObjectId,
            status: 'pending',
        });

        await friendRequest.save();

        res.status(201).json({ success: true, message: 'Friend request sent successfully.' });
    } catch (error) {
        console.error('[SEND FRIEND REQUEST] Error:', error);
        res.status(500).json({ success: false, message: 'Error sending friend request.' });
    }
};
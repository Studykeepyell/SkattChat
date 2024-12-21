import { Request, Response } from 'express';
import FriendRequest from '../../models/FriendRequest.js';
import User, { IUser } from '../../models/User.js';
import Room from '../../models/Room.js';
import { notifyUser } from '../../utils/socketUtils.js';

export const respondToFriendRequest = async (req: Request, res: Response) => {
    const { requestId, status } = req.body;

    if (!requestId || !status) {
        return res.status(400).json({ success: false, message: 'Request ID and status are required.' });
    }

    try {
        const friendRequest = await FriendRequest.findByIdAndUpdate(
            requestId,
            { status },
            { new: true }
        )
        .populate('sender')
        .populate('receiver')
        .exec();

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Friend request not found.' });
        }

        const sender = await User.findById(friendRequest.sender) as IUser;
        const receiver = await User.findById(friendRequest.receiver) as IUser;

        if (status === 'accepted') {
            const roomId = `${sender._id}_${receiver._id}`;
            const roomName = `Chat Room for ${sender.username} and ${receiver.username}`;
            const newRoom = await Room.create({
                roomId,
                name: roomName,
                participants: [sender._id, receiver._id],
            });

            await User.findByIdAndUpdate(sender._id, { $push: { friends: receiver._id } });
            await User.findByIdAndUpdate(receiver._id, { $push: { friends: sender._id } });

            notifyUser(sender._id as string, 'newChatRoom', {
                roomId: newRoom.roomId,
                name: newRoom.name,
            });
            notifyUser(receiver._id as string, 'newChatRoom', {
                roomId: newRoom.roomId,
                name: newRoom.name,
            });

            console.log(`Friendship established and chat room created: ${roomName}`);
        }

        res.json({ success: true, message: `Friend request ${status}.` });
    } catch (error) {
        console.error('[RESPOND TO FRIEND REQUEST] Error:', error);
        res.status(500).json({ success: false, message: 'Error responding to friend request.' });
    }
};
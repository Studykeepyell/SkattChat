import { Router, Request } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import authMiddleware from '../middleware/authMiddleware.js';
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import ChatRoom from '../models/chatroom/ChatRoom.js';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
    user?: { id: string; username: string };
}

interface PopulatedUser {
    _id: Types.ObjectId;
    username: string;
    profileImage?: {
        data: string;
        contentType: string;
    } | null;
}

interface PopulatedFriendRequest {
    _id: Types.ObjectId;
    sender: PopulatedUser;
    receiver: PopulatedUser;
    status: string;
}

const router = Router(); 

// Accept friend request
router.put('/requests/accept', authMiddleware, (async (req: AuthRequest, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user?.id;

        if (!requestId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        const request = await FriendRequest.findById(requestId)
            .populate<{ sender: PopulatedUser }>('sender', 'username profileImage')
            .populate<{ receiver: PopulatedUser }>('receiver', 'username profileImage')
            .lean() as PopulatedFriendRequest;
            
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        // Verify the current user is the receiver
        if (request.receiver._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to accept this request'
            });
        }

        // Update request status and create chat room
        const [, , , chatRoom] = await Promise.all([
            FriendRequest.updateOne(
                { _id: requestId },
                { status: 'accepted' }
            ),
            User.findByIdAndUpdate(request.sender._id, {
                $addToSet: { friends: request.receiver._id }
            }),
            User.findByIdAndUpdate(request.receiver._id, {
                $addToSet: { friends: request.sender._id }
            }),
            // Create private chat room with new schema
            ChatRoom.create({
                roomId: `private_chat_${request.sender._id}_${request.receiver._id}`,
                type: 'private',
                name: `${request.receiver.username} & ${request.sender.username}`,
                members: [request.sender._id, request.receiver._id],
                memberProfiles: [
                    {
                        userId: request.sender._id,
                        username: request.sender.username,
                        profileImage: request.sender.profileImage || null,
                        role: 'member'
                    },
                    {
                        userId: request.receiver._id,
                        username: request.receiver.username,
                        profileImage: request.receiver.profileImage || null,
                        role: 'member'
                    }
                ],
                settings: {
                    maxMembers: 2,
                    isModerated: false,
                    allowNewMembers: false
                }
            })
        ]);

        // Return the response with room data
        res.json({ 
            success: true,
            friendId: request.sender._id.toString() === userId ? 
                request.receiver._id.toString() : 
                request.sender._id.toString(),
            room: chatRoom
        });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept friend request' });
    }
}) as RequestHandler);

// Decline friend request
router.put('/requests/decline', authMiddleware, (async (req: AuthRequest, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user?.id;

        if (!requestId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        // Verify the current user is the receiver
        if (request.receiver.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to decline this request'
            });
        }

        // Update request status
        await FriendRequest.updateOne(
            { _id: requestId },
            { status: 'declined' }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Decline friend request error:', error);
        res.status(500).json({ success: false, message: 'Failed to decline friend request' });
    }
}) as RequestHandler);

// List friend requests
router.get('/requests', authMiddleware, (async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const requests = await FriendRequest.find({
            receiver: userId,
            status: 'pending'
        }).populate('sender', 'username profileImage');

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('List friend requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to list friend requests' });
    }
}) as RequestHandler);

// Get user's friends list
router.get('/:userId/list', authMiddleware, (async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get user with populated friends
        const user = await User.findById(userId)
            .populate('friends', 'username profileImage')
            .select('friends');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            friends: user.friends
        });
    } catch (error) {
        console.error('Get friends list error:', error);
        res.status(500).json({ success: false, message: 'Failed to get friends list' });
    }
}) as RequestHandler);

// Send friend request
router.post('/requests/send', authMiddleware, (async (req: AuthRequest, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user?.id;

        console.log('Friend request attempt:', { senderId, receiverId, body: req.body });

        if (!senderId || !receiverId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Sender and receiver IDs are required' 
            });
        }

        // Check for existing friend request
        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Friend request already sent'
            });
        }

        const friendRequest = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        });

        res.json({ success: true, requestId: friendRequest._id });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ success: false, message: 'Failed to send friend request' });
    }
}) as RequestHandler);

export default router; 
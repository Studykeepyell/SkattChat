import { Router, Request } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import authMiddleware from '../middleware/authMiddleware.js';
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';

interface AuthRequest extends Request {
    user?: { id: string; username: string };
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
                message: 'Not authorized to accept this request'
            });
        }

        // Update request status and create chat room
        await Promise.all([
            FriendRequest.updateOne(
                { _id: requestId },
                { status: 'accepted' }
            ),
            User.findByIdAndUpdate(request.sender, {
                $addToSet: { friends: request.receiver }
            }),
            User.findByIdAndUpdate(request.receiver, {
                $addToSet: { friends: request.sender }
            }),
            // Create private chat room
            ChatRoom.create({
                type: 'private',
                members: [request.sender, request.receiver],
                createdBy: userId
            })
        ]);

        res.json({ success: true });
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
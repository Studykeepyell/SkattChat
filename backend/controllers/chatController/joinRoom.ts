import { Response } from 'express';
import ChatRoom from '../../models/Room.js';
import Message from '../../models/Message.js';
import { AuthenticatedRequest } from '../../types/express.js';
import mongoose from 'mongoose';

export const joinRoom = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user?._id || req.body.userId;

        console.log('[JOIN_ROOM] Request:', {
            params: req.params,
            body: req.body,
            user: req.user,
            roomId,
            userId
        });

        if (!roomId || !userId) {
            console.log('[JOIN_ROOM] Missing data:', { roomId, userId, body: req.body });
            return res.status(400).json({ 
                success: false, 
                message: 'Room ID and user ID are required',
                debug: { roomId, userId, body: req.body }
            });
        }

        // Check if this is a private room (contains underscore)
        const isPrivateRoom = roomId.includes('_');
        let room;

        if (isPrivateRoom) {
            // For private rooms, search by the composite roomId
            room = await ChatRoom.findOne({ roomId: roomId });
            console.log('[JOIN_ROOM] Private room search result:', { found: !!room, roomId });
        } else {
            // For public rooms, validate and search by MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                console.log('[JOIN_ROOM] Invalid room ID format:', roomId);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID format'
                });
            }
            room = await ChatRoom.findById(roomId);
            console.log('[JOIN_ROOM] Public room search result:', { found: !!room, roomId });
        }

        // List all rooms for debugging
        const allRooms = await ChatRoom.find({});
        console.log('[JOIN_ROOM] All rooms in database:', allRooms.map(r => ({
            id: r._id.toString(),
            roomId: r.roomId,
            name: r.name,
            participants: r.participants
        })));

        if (!room) {
            console.log('[JOIN_ROOM] Room not found for ID:', roomId);
            return res.status(404).json({ 
                success: false, 
                message: 'Room not found',
                debug: { roomId, isPrivateRoom }
            });
        }

        // Convert userId to string for comparison
        const userIdStr = userId.toString();
        const hasUser = room.participants.some(p => p.toString() === userIdStr);

        if (!hasUser) {
            console.log('[JOIN_ROOM] Adding user to room:', { userId: userIdStr, roomId });
            room.participants.push(new mongoose.Types.ObjectId(userIdStr));
            await room.save();
        }

        // Fetch messages for the room
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        console.log('[JOIN_ROOM] Found messages:', messages.length);

        return res.status(200).json({ 
            success: true, 
            message: 'Successfully joined room',
            room,
            messages
        });
    } catch (error) {
        console.error('[JOIN_ROOM] Error joining room:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error joining room',
            debug: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}; 
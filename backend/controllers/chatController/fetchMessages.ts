import { Request, Response } from 'express';
import Message from '../../models/Message.js';

export const fetchMessages = async (req: Request, res: Response) => {
    let { roomId } = req.body;
    
    // Handle case where roomId might be an object
    if (typeof roomId === 'object' && roomId.roomId) {
        roomId = roomId.roomId;
    }

    try {
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};
import { Request, Response } from 'express';
import Message from '../../models/Message.js';
import Room from '../../models/Room.js';
import { IMessage } from './types.js';
import { Server } from 'socket.io';

export const sendMessage = async (io: Server, req: Request, res: Response) => {
    let { roomId, username, userId, message, timestamp } = req.body;
    
    if (typeof roomId === 'object' && roomId.roomId) {
        roomId = roomId.roomId;
    }

    if (!roomId || !username || !userId || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newMessage = await Message.create({ 
            roomId, 
            username, 
            userId, 
            message, 
            timestamp 
        }) as unknown as IMessage;

        await Room.findOneAndUpdate(
            { roomId },
            { $set: { lastMessageTime: newMessage.timestamp } }
        );

        io.to(roomId).emit('chat message', {
            _id: newMessage._id,
            roomId: newMessage.roomId,
            userId: newMessage.userId,
            username: newMessage.username,
            message: newMessage.message,
            timestamp: newMessage.timestamp || Date.now(),
            createdAt: newMessage.createdAt,
            updatedAt: newMessage.updatedAt,
        });

        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Error sending message.' });
    }
};
import { Request, Response } from 'express';
import ChatRoom from '../../models/chatroom/ChatRoom.js';
import type { ErrorResponse } from './types.js';
import fs from 'fs';
import path from 'path';

export const uploadRoomImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const roomId = req.params.roomId;
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        // Find the room by roomId only
        const room = await ChatRoom.findOne({ roomId: roomId });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Update only the profileImage field while preserving other room data
        const updateResult = await ChatRoom.findOneAndUpdate(
            { roomId: roomId },
            { 
                $set: {
                    profileImage: {
                        data: req.file.buffer.toString('base64'),
                        contentType: req.file.mimetype
                    }
                }
            },
            { new: true } // Return the updated document
        );

        if (!updateResult) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update room profile image'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Room profile image updated successfully',
            room: updateResult
        });

    } catch (error) {
        console.error('Error uploading room image:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading room image'
        } as ErrorResponse);
    }
}; 
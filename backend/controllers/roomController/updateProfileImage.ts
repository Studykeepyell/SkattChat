import { Request, Response } from 'express';
import Room from '../../models/Room.js';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
    user?: { _id: Types.ObjectId };
}

export const updateRoomProfileImage = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;
        const { targetUserId, profileImage } = req.body;
        const currentUserId = req.user?._id;

        if (!currentUserId || !roomId || !profileImage || !targetUserId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the room and verify both users are participants
        const room = await Room.findOne({
            roomId,
            participants: { 
                $all: [
                    currentUserId,
                    targetUserId
                ]
            }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found or users not authorized' });
        }

        // Update or add the profile image for the target user
        const participantProfileIndex = room.participantProfiles.findIndex(
            profile => profile.userId?.toString() === targetUserId
        );

        if (participantProfileIndex !== -1) {
            // Update existing profile
            room.participantProfiles[participantProfileIndex].profileImage = profileImage;
        } else {
            // Add new profile
            room.participantProfiles.push({
                userId: new Types.ObjectId(targetUserId),
                profileImage
            });
        }

        await room.save();

        return res.status(200).json({
            message: 'Profile image updated successfully',
            room
        });
    } catch (error) {
        console.error('Error updating room profile image:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
} 
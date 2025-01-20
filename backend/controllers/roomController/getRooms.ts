import { Request, Response } from 'express';
import { DefaultRoomService } from '../../services/defaultRoomService.js';

interface AuthRequest extends Request {
    user?: { _id: string };
}

export const getRooms = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Ensure user is in default room
        await DefaultRoomService.ensureDefaultRoomExists();
        await DefaultRoomService.addUserToDefaultRoom(userId.toString());

        // Get only rooms visible to this user
        const rooms = await DefaultRoomService.getVisibleRooms(userId.toString());

        return res.status(200).json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('[ROOM_CONTROLLER] Error getting rooms:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving rooms'
        });
    }
}; 
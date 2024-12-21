import { Request, Response } from 'express';
import Room from '../../models/Room.js';

export const getUserRooms = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const rooms = await Room.find({ participants: userId });
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching rooms.' });
    }
};
import { Request, Response } from 'express';
import User from '../../models/User.js';

export const getFriends = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).populate('friends');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, friends: user.friends });
        return;
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching friends' });
        return;
    }
};
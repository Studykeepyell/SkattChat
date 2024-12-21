import { Request, Response } from 'express';
import User from '../../models/User.js';

export const getUserProfileImage = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId);
        if (user) {
            res.json({ success: true, profileImage: user.profileImage });
        } else {
            res.status(404).json({ success: false, message: 'Profile image not found.' });
        }
    } catch (error) {
        console.error('Error fetching profile image:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
import { Request, Response } from 'express';
import User from '../../models/User.js';

export const updateProfile = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { username, profileImage } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        const updateFields: { username?: string; profileImage?: string } = {};
        if (username) updateFields.username = username;
        if (profileImage) updateFields.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

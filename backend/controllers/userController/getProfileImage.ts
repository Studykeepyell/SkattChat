import { Request, Response } from 'express';
import User from '../../models/User.js';

export const getProfileImage = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user || !user.profileImage || !user.profileImage.data) {
            return res.status(404).json({ success: false, message: 'Profile image not found' });
        }

        // Set the content type and send the image data
        res.set('Content-Type', user.profileImage.contentType);
        res.send(user.profileImage.data);
    } catch (error) {
        console.error('Error fetching profile image:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 
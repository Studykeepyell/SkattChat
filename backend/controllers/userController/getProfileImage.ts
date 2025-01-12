import { Request, Response } from 'express';
import User from '../../models/User.js';

export const getProfileImage = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user?.profileImage?.data) {
            return res.status(404).json({ success: false, message: 'Profile image not found' });
        }

        // Extract the content type and base64 data
        const [header, base64Data] = user.profileImage.data.split(',');
        const contentType = header.split(':')[1].split(';')[0];

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Send the image with the correct content type
        res.set('Content-Type', contentType);
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error fetching profile image:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 
import { Request, Response } from 'express';
import User from '../../models/User.js';
import { FileRequest } from './types.js';

export const uploadProfileImage = async (req: FileRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId, 
            { profileImage: imageUrl }, 
            { new: true }
        );

        if (user) {
            res.json({ success: true, imageUrl });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
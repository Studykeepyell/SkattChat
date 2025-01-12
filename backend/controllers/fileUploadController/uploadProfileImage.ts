import { Request, Response } from 'express';
import User from '../../models/User.js';
import { FileRequest } from './types.js';
import sharp from 'sharp';

const PROFILE_IMAGE_SIZE = 400; // Standard size for profile images
const PROFILE_IMAGE_QUALITY = 80; // WebP quality (0-100)

export const uploadProfileImage = async (req: FileRequest, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        // Process image with Sharp
        const processedImageBuffer = await sharp(req.file.buffer)
            .resize(PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: PROFILE_IMAGE_QUALITY })
            .toBuffer();

        // Update user profile in database with the processed image
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            {
                profileImage: {
                    data: processedImageBuffer,
                    contentType: 'image/webp'
                }
            },
            { new: true }
        );

        if (user) {
            // Return a URL that will be used to fetch the image
            const imageUrl = `/api/users/${req.params.userId}/profile-image`;
            res.json({ success: true, imageUrl });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
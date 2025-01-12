import { Request, Response } from 'express';
import User from '../../models/User.js';
import { FileRequest } from './types.js';
import sharp from 'sharp';

const PROFILE_IMAGE_SIZE = 400; // Standard size for profile images
const PROFILE_IMAGE_QUALITY = 80; // WebP quality (0-100)

export const uploadProfileImage = async (req: FileRequest, res: Response) => {
    console.log('Upload request received for user:', req.params.userId);
    console.log('File in request:', req.file ? 'present' : 'missing');
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        console.log('Processing image for user:', req.params.userId);
        
        // Process image with Sharp
        const processedImageBuffer = await sharp(req.file.buffer)
            .resize(PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: PROFILE_IMAGE_QUALITY })
            .toBuffer();

        // Convert buffer to base64 string with data URI
        const base64Image = `data:image/webp;base64,${processedImageBuffer.toString('base64')}`;

        // First, clear the existing profileImage if any
        await User.findByIdAndUpdate(req.params.userId, { $unset: { profileImage: "" } });

        // Then set the new profileImage
        const updateResult = await User.findByIdAndUpdate(
            req.params.userId,
            { 
                profileImage: {
                    data: base64Image,
                    contentType: 'image/webp'
                }
            },
            { new: true }
        );

        if (!updateResult) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify the update
        const verifyUser = await User.findById(req.params.userId);
        console.log('Verification after update:', {
            hasProfileImage: !!verifyUser?.profileImage,
            hasData: !!verifyUser?.profileImage?.data,
            contentType: verifyUser?.profileImage?.contentType,
            dataLength: verifyUser?.profileImage?.data?.length
        });

        // Return success response
        res.json({ 
            success: true, 
            imageUrl: `/api/users/${req.params.userId}/profile-image` 
        });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
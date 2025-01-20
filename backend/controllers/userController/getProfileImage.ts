import { Request, Response } from 'express';
import User from '../../models/User.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getProfileImage = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user || !user.profileImage || !user.profileImage.data) {
            const defaultImagePath = join(__dirname, '../../../public/assets/images/default-avatar.svg');
            return res.sendFile(defaultImagePath);
        }

        // Extract the base64 data (remove the "data:image/webp;base64," prefix)
        const base64Data = user.profileImage.data.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', user.profileImage.contentType);
        return res.send(imageBuffer);
    } catch (error) {
        console.error('Error serving profile image:', error);
        res.status(500).send('Error serving profile image');
    }
}; 
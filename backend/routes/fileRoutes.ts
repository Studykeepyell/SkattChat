import { Router, RequestHandler } from 'express';
import { 
    uploadProfileImage, 
    uploadRoomImage,
    upload 
} from '../controllers/fileUploadController/index.js';
import ChatRoom from '../models/chatroom/ChatRoom.js';

const router = Router();

router.post('/users/:userId/profile-image', upload.single('profileImage'), uploadProfileImage as RequestHandler);
router.post('/rooms/:roomId/profile-image', upload.single('roomImage'), uploadRoomImage as RequestHandler);

// Add GET route for room profile images
router.get('/rooms/:roomId/profile-image', async (req, res) => {
    try {
        const room = await ChatRoom.findOne({ roomId: req.params.roomId });
        if (!room || !room.profileImage || !room.profileImage.data) {
            return res.status(404).send('Profile image not found');
        }
        
        res.set('Content-Type', room.profileImage.contentType);
        const imageBuffer = Buffer.from(room.profileImage.data, 'base64');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error retrieving room profile image:', error);
        res.status(500).send('Error retrieving profile image');
    }
});
                                                           
export default router;
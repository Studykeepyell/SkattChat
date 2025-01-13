import express from 'express';
import { updateRoomProfileImage } from '../controllers/roomController/updateProfileImage.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/:roomId/profile-image', authMiddleware, updateRoomProfileImage);

export default router; 
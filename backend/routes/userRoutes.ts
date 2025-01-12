import { Router } from 'express';
import { searchUsers } from '../controllers/userController/searchUsers.js';
import { updateProfile } from '../controllers/userController/updateProfile.js';
import { getProfileImage } from '../controllers/userController/getProfileImage.js';
import { uploadProfileImage } from '../controllers/fileUploadController/uploadProfileImage.js';
import { upload } from '../controllers/fileUploadController/config.js';
import { RequestHandler } from 'express-serve-static-core';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// User-specific routes (require authentication)
router.get('/search', authMiddleware, searchUsers as RequestHandler);
router.put('/:userId', authMiddleware, updateProfile as RequestHandler);

// Profile image routes
router.get('/:userId/profile-image', getProfileImage as RequestHandler);
router.post('/:userId/profile-image', authMiddleware, upload.single('profileImage'), uploadProfileImage as RequestHandler);

export default router;


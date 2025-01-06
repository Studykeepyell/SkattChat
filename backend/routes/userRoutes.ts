import { Router } from 'express';
import { searchUsers } from '../controllers/userController/searchUsers.js';
import { updateProfile } from '../controllers/userController/updateProfile.js';
import { RequestHandler } from 'express-serve-static-core';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// User-specific routes (require authentication)
router.get('/search', authMiddleware, searchUsers as RequestHandler);
router.put('/:userId', authMiddleware, updateProfile as RequestHandler);

export default router;


import { Router, RequestHandler } from 'express';
import {
    sendFriendRequest,
    respondToFriendRequest,
    getPendingFriendRequests,
    getFriends,
    getUserRooms,
} from '../controllers/friendRequestController/index.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/send/:receiverId', authMiddleware, sendFriendRequest as RequestHandler);
router.put('/respond', authMiddleware, respondToFriendRequest as RequestHandler);
router.get('/requests/:userId', authMiddleware, getPendingFriendRequests as RequestHandler);
router.get('/friends/:userId', authMiddleware, getFriends as RequestHandler);
router.get('/rooms/:userId', authMiddleware, getUserRooms as RequestHandler);

export default router;

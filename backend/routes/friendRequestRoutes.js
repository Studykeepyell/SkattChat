const express = require('express');
const {
    sendFriendRequest,
    respondToFriendRequest,
    getPendingFriendRequests,
    getFriends,
    getUserRooms,
} = require('../controllers/friendRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/send/:receiverId', authMiddleware, sendFriendRequest);
router.put('/respond', authMiddleware, respondToFriendRequest);
router.get('/requests/:userId', authMiddleware, getPendingFriendRequests);
router.get('/friends/:userId', authMiddleware, getFriends);
router.get('/rooms/:userId', authMiddleware, getUserRooms);

module.exports = router;

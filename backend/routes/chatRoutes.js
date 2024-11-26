const express = require('express');
const { fetchMessages, fetchChatRooms,sendMessage } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/send', sendMessage);
router.get('/rooms/:roomId/messages', fetchMessages);
router.get('/rooms', authMiddleware,fetchChatRooms);




module.exports = router;

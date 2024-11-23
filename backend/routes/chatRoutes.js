const express = require('express');
const { fetchMessages, fetchChatRooms,sendMessage } = require('../controllers/chatController');
const router = express.Router();

router.post('/send', sendMessage);
router.get('/rooms/:roomId/messages', fetchMessages);
router.get('/chat/rooms',fetchChatRooms);




module.exports = router;

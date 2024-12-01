const express = require('express');
const { fetchMessages, fetchChatRooms, sendMessage } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

module.exports = (io) => {
    router.post('/send', (req, res) => sendMessage(io, req, res));
    router.get('/rooms/:roomId/messages', fetchMessages);
    router.get('/rooms', authMiddleware, fetchChatRooms);

    return router;
};

const express = require('express');
const router = express.Router();
const Message = require('./models/Message');
const Room = require('./models/Room');


// Fetch messages for a specific room by roomId
router.get('/rooms/:roomId/messages', async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Room ID is required.' });
        }

        // Query the messages collection for messages with the specified roomId
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 }); // Sort by timestamp to get messages in order

        if (!messages || messages.length === 0) {
            return res.status(404).json({ success: false, message: 'No messages found for this room.' });
        }

        console.log(`Messages retrieved for room ${roomId}:`, messages);
        res.json(messages); // Send the messages to the client
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});







// Route to fetch chat history
router.get('/chatHistory/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        // Find all messages for the specified room, sorted by timestamp
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load chat history' });
    }
});

// Route to fetch chat rooms
router.get('/chat/rooms', async (req, res) => {
    const userId = req.user.id; // Replace with your method of getting the logged-in user's ID

    try {
        const rooms = await Room.find({ participants: userId });
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ message: 'Error fetching chat rooms' });
    }
});


module.exports = router;

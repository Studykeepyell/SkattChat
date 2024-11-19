const Message = require('../models/Message');
const Room = require('../models/Room');

exports.fetchMessages = async (req, res) => {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
    res.json(messages);
};

exports.fetchChatHistory = async (req, res) => {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
    res.json(messages);
};

exports.fetchChatRooms = async (req, res) => {
    const userId = req.user.id;
    const rooms = await Room.find({ participants: userId });
    res.json(rooms);
};

// Send a chat message
exports.sendMessage = async (req, res) => {
    const { roomId, username, userId, message, timestamp } = req.body;

    try {
        const newMessage = await Message.create({ roomId, username, userId, message, timestamp });
        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error saving message.' });
    }
};

// Fetch messages for a room
exports.getMessages = async (req, res) => {
    const { roomId } = req.params;

    try {
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching messages.' });
    }
};
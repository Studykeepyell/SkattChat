const Message = require('../models/Message');
const Room = require('../models/Room');

// Fetch messages for a room
exports.fetchMessages = async (req, res) => {
    const { roomId } = req.params;

    try {
        const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};


exports.fetchChatRooms = async (req, res) => {
    const userId = req.user.id;
    try {
        const rooms = await Room.find({ participants: userId }).populate('participants', 'username profileImage');
        const formattedRooms = rooms.map(room => ({
            roomId: room.roomId,
            name: room.name,
            participants: room.participants.map(participant => ({
                id: participant._id,
                username: participant.username,
                profileImage: participant.profileImage,
            })),
        }));

        res.json({ success: true, rooms: formattedRooms });
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
    }
};


// Send a message
exports.sendMessage = async (req, res) => {
    const { roomId, username, userId, message, timestamp } = req.body;

    if (!roomId || !username || !userId || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newMessage = await Message.create({ roomId, username, userId, message, timestamp });
        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ success: false, message: 'Error saving message.' });
    }
};

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
    console.log('Fetching chat rooms for user ID:', userId);

    try {
        const rooms = await Room.find({
            $or: [
                { participants: userId }, // Rooms where the user is a participant
                { participants: { $size: 0 } }, // Default rooms with no participants
            ]
        }).populate('participants', 'username profileImage')
        .lean();

        const formattedRooms = rooms.map(room => ({
            roomId: room.roomId,
            name: room.name,
            lastMessageTime: room.lastMessageTime || null, // Avoid fallback to `updatedAt`
            participants: room.participants.map(participant => ({
                id: participant._id,
                username: participant.username,
                profileImage: participant.profileImage,
            })),
        }));
        

        console.log('Formatted Rooms:', formattedRooms);
        res.json({ success: true, rooms: formattedRooms });
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
    }
};


exports.markMessagesAsRead = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;

    try {
        await Room.findOneAndUpdate(
            { roomId, 'unreadMessages.userId': userId },
            { $set: { 'unreadMessages.$.count': 0 } }
        );
        res.status(200).json({ success: true, message: 'Messages marked as read.' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Error marking messages as read.' });
    }
};



// Send a message
exports.sendMessage = async (io, req, res) => {
    const { roomId, username, userId, message, timestamp } = req.body;

    // Validate required fields
    if (!roomId || !username || !userId || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        // Create a new message in the database
        const newMessage = await Message.create({ roomId, username, userId, message, timestamp });

     // Update room's lastMessageTime
     await Room.findOneAndUpdate(
        { roomId },
        { $set: { lastMessageTime: newMessage.timestamp } }
    );

    io.to(roomId).emit('chat message', {
        _id: newMessage._id,
        roomId: newMessage.roomId,
        userId: newMessage.userId,
        username: newMessage.username,
        message: newMessage.message,
        timestamp: newMessage.timestamp || Date.now(), // Use original timestamp or current time
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt,
    });
        
        

        // Send response back to the client
        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Error sending message.' });
    }
};


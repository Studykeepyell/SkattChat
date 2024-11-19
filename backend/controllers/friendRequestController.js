const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');
const { notifyUser } = require('../utils/socketUtils');
//const { userSocketMap } = require('../socket/index');



// Send a friend request
exports.sendFriendRequest = async (req, res) => {
    const { senderId } = req.body;
    const { receiverId } = req.params;

    if (!senderId || !receiverId) {
        return res.status(400).json({ success: false, message: 'Sender and receiver IDs are required.' });
    }

    try {
        const existingRequest = await FriendRequest.findOne({ senderId, receiverId, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Friend request already sent.' });
        }

        const friendRequest = new FriendRequest({
            senderId,
            receiverId,
            requestId: uuidv4(),
            status: 'pending',
        });

        await friendRequest.save();

        notifyUser(receiverId, 'newFriendRequest', { senderId, receiverId, message: 'You have a new friend request' });

        res.status(201).json({ success: true, message: 'Friend request sent successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending friend request.' });
    }
};

// Respond to a friend request
exports.respondToFriendRequest = async (req, res) => {
    const { requestId, status } = req.body;

    if (!requestId || !status) {
        return res.status(400).json({ success: false, message: 'Request ID and status are required.' });
    }

    try {
        const friendRequest = await FriendRequest.findByIdAndUpdate(
            requestId,
            { status },
            { new: true }
        );

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Friend request not found.' });
        }

        if (status === 'accepted') {
            const { senderId, receiverId } = friendRequest;

            // Create a new chat room
            const roomId = `${senderId}_${receiverId}`;
            const newRoom = await Room.create({
                roomId,
                name: `Chat Room for ${senderId} and ${receiverId}`,
                participants: [senderId, receiverId],
            });

            // Add each user to the other's friend list
            await User.findByIdAndUpdate(senderId, { $push: { friends: receiverId } });
            await User.findByIdAndUpdate(receiverId, { $push: { friends: senderId } });

            // Notify both users about the new room
            notifyUser(senderId, 'newChatRoom', newRoom);
            notifyUser(receiverId, 'newChatRoom', newRoom);
        }

        res.json({ success: true, message: `Friend request ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error responding to friend request.' });
    }
};

// Get pending friend requests for a user
exports.getPendingFriendRequests = async (req, res) => {
    const { userId } = req.params;

    try {
        const pendingRequests = await FriendRequest.find({ receiverId: userId, status: 'pending' }).populate('senderId', 'username profileImage');
        res.json({ success: true, friendRequests: pendingRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching friend requests.' });
    }
};

// Get a user's friends
exports.getFriends = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).populate('friends', 'username profileImage');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, friends: user.friends });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching friends.' });
    }
};

// Get chat rooms for a user
exports.getUserRooms = async (req, res) => {
    const { userId } = req.params;

    try {
        const rooms = await Room.find({ participants: userId });
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching rooms.' });
    }
};

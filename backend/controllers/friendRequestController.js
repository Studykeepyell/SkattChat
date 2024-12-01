const mongoose = require('mongoose');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');
const { notifyUser } = require('../utils/socketUtils');
//const { userSocketMap } = require('../socket/index');



exports.sendFriendRequest = async (req, res) => {
    const senderId = req.user?.id; // Authenticated user ID (ObjectId)
    const { receiverId } = req.params; // Receiver ID from route params

    console.log('[SEND FRIEND REQUEST] Sender ID:', senderId);
    console.log('[SEND FRIEND REQUEST] Receiver ID:', receiverId);

    if (!senderId || !receiverId) {
        return res.status(400).json({ success: false, message: 'Sender and receiver IDs are required.' });
    }

    try {
        // Check if the users are already friends
        const sender = await User.findById(senderId);
        if (sender.friends.includes(receiverId)) {
            return res.status(400).json({ success: false, message: 'Users are already friends.' });
        }
    
    
        // Ensure receiverId is converted to ObjectId
        const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

        // Check for existing friend request
        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverObjectId,
            status: 'pending',
        });
        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Friend request already sent.' });
        }

        // Create a new friend request
        const friendRequest = new FriendRequest({
            sender: senderId, // ObjectId
            receiver: receiverObjectId, // ObjectId
            status: 'pending',
        });

        await friendRequest.save();

        res.status(201).json({ success: true, message: 'Friend request sent successfully.' });
    } catch (error) {
        console.error('[SEND FRIEND REQUEST] Error:', error);
        res.status(500).json({ success: false, message: 'Error sending friend request.' });
    }
};

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
        ).populate('sender', 'username').populate('receiver', 'username');

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Friend request not found.' });
        }

        if (status === 'accepted') {
            const { sender, receiver } = friendRequest;

            // Create a new chat room
            const roomId = `${sender._id}_${receiver._id}`;
            const roomName = `Chat Room for ${sender.username} and ${receiver.username}`;
            const newRoom = await Room.create({
                roomId,
                name: roomName,
                participants: [sender._id, receiver._id],
            });

            // Add each user to the other's friend list
            await User.findByIdAndUpdate(sender._id, { $push: { friends: receiver._id } });
            await User.findByIdAndUpdate(receiver._id, { $push: { friends: sender._id } });

            // Notify both users about the new room
            notifyUser(sender._id, 'newChatRoom', {
                roomId: newRoom.roomId,
                name: newRoom.name,
            });
            notifyUser(receiver._id, 'newChatRoom', {
                roomId: newRoom.roomId,
                name: newRoom.name,
            });

            console.log(`Friendship established and chat room created: ${roomName}`);
        }

        res.json({ success: true, message: `Friend request ${status}.` });
    } catch (error) {
        console.error('[RESPOND TO FRIEND REQUEST] Error:', error);
        res.status(500).json({ success: false, message: 'Error responding to friend request.' });
    }
};


exports.getPendingFriendRequests = async (req, res) => {
    const { userId } = req.params;

    try {
        // Match receiver field and populate sender field correctly
        const pendingRequests = await FriendRequest.find({ receiver: userId, status: 'pending' })
            .populate('sender', 'username profileImage');

        res.json({ success: true, friendRequests: pendingRequests });
    } catch (error) {
        console.error('[GET PENDING FRIEND REQUESTS] Error:', error);
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

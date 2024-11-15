const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Room = require('./models/Room');
const FriendRequest = require('./models/FriendRequest');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');


module.exports = (io, userSocketMap) => {

// User Search Endpoint
router.get('/search', async (req, res) => {
    const query = req.query.q;
    try {
        const users = await User.find({
            $or: [
                { displayName: new RegExp(query, 'i') },
                { username: new RegExp(query, 'i') }
            ]
        });
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found' });
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User Authentication Routes
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ success: false, message: 'Username already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to register user' });
        }
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, userId: user._id, username: user.username, profileImage: user.profileImage || null });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to log in user' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    req.session = null;
    res.status(200).json({ success: true, message: 'Logout successful' });
});

// User Profile Management
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { username, profileImage } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    try {
        const updateFields = {};
        if (username) updateFields.username = username;
        if (profileImage) updateFields.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});



router.post('/friends/respond', async (req, res) => {
    const { requestId, status, senderId, receiverId } = req.body;

    console.log('Friend request response received:', { requestId, status, senderId, receiverId });

    if (!requestId || !status || !senderId || !receiverId) {
        console.error('Invalid request data:', req.body);
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const friendRequest = await FriendRequest.findOneAndUpdate(
            { _id: requestId, senderId, receiverId },
            { status },
            { new: true }
        );

        if (!friendRequest) {
            return res.status(404).json({ success: false, message: 'Friend request not found.' });
        }

        if (status === 'accepted') {
            const roomId = `${senderId}_${receiverId}`;
            const newRoom = await Room.create({
                roomId,
                name: `Chat Room for ${senderId} and ${receiverId}`,
                participants: [senderId, receiverId],
                messages: []
            });

            await User.findByIdAndUpdate(senderId, { $push: { friends: receiverId } });
            await User.findByIdAndUpdate(receiverId, { $push: { friends: senderId } });

            // Notify both users about the new room
            if (io && userSocketMap[senderId]) {
                io.to(userSocketMap[senderId]).emit('newChatRoom', newRoom);
            }
            if (io && userSocketMap[receiverId]) {
                io.to(userSocketMap[receiverId]).emit('newChatRoom', newRoom);
            }

            console.log('New chat room created:', newRoom);
        }

        res.json({ success: true, message: `Friend request ${status}.` });
    } catch (error) {
        console.error('Error responding to friend request:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});



router.post('/friends/:receiverId', async (req, res) => {
    const { senderId } = req.body;
    const { receiverId } = req.params;

    console.log("Received friend request:");
    console.log("Sender ID:", senderId);
    console.log("Receiver ID:", receiverId);

    if (!senderId || !receiverId) {
        console.error("Missing senderId or receiverId.");
        return res.status(400).json({ success: false, message: 'Sender and receiver IDs are required.' });
    }

    try {
        const existingRequest = await FriendRequest.findOne({ senderId, receiverId, status: 'pending' });
        if (existingRequest) {
            console.log("Friend request already exists.");
            return res.status(400).json({ success: false, message: 'Friend request already sent.' });
        }

        const friendRequest = new FriendRequest({
            senderId,
            receiverId,
            requestId: uuidv4(), // Generate a unique requestId
            status: 'pending'
        });

        await friendRequest.save();
        console.log("Friend request saved successfully:", friendRequest);

        if (userSocketMap[receiverId]) {
            io.to(userSocketMap[receiverId]).emit('newFriendRequest', {
                senderId,
                receiverId,
                message: 'You have a new friend request'
            });
        } else {
            console.log(`User ${receiverId} is offline or not registered in userSocketMap.`);
        }

        res.json({ success: true, message: 'Friend request sent successfully.' });
    } catch (error) {
        console.error("Error creating friend request:", error);
        res.status(500).json({ success: false, message: 'Error sending friend request.' });
    }
});





router.get('/friends/requests/:userId', async (req, res) => {
    const { userId } = req.params; // This is the receiver's user ID
    try {
        const pendingRequests = await FriendRequest.find({
            receiverId: userId,
            status: 'pending'
        }).populate('senderId', 'username profileImage'); // Populate sender details if needed

        console.log("Pending friend requests fetched:", pendingRequests);
        res.json({ success: true, friendRequests: pendingRequests });
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ success: false, message: 'Error fetching friend requests.' });
    }
});

// Room Management
router.get('/getUserRooms/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const rooms = await Room.find({ participants: userId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while fetching rooms' });
    }
});

// Friend Addition Route (Socket Handling)
router.get('/friends/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).populate('friends'); // Adjust based on your schema

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // If friends data is null, respond with an empty array instead
        const friendsList = user.friends || [];
        res.json({ success: true, friends: friendsList });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching friends' });
    }
});

return router;
};
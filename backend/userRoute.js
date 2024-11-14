const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust the path as needed
const router = express.Router();
const FriendRequest = require('./models/FriendRequest');

// Ensure userSocketMap and io are accessible
const { io, userSocketMap } = require('./server');

// Search users endpoint
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
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
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


const Room = require('./models/Room');


// Registration route
router.post('/register', async (req, res) => {
    console.log('Incoming registration data:', req.body);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

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
            console.error('Registration error:', err);
            res.status(500).json({ success: false, message: 'Failed to register user' });
        }
    }
});

// Login route
router.post('/login', async (req, res) => {
    console.log('Login route accessed');  // Debugging log

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('User ID to be returned:', user._id); // Verify that this logs the correct userId

        res.json({
            success: true,
            userId: user._id,
            username: user.username,
            profileImage: user.profileImage || null // Return profileImage URL if it exists
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Failed to log in user' });
    }
});



// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('token');  // If using cookies
    req.session = null;        // If using sessions
    res.status(200).json({ success: true, message: 'Logout successful' });
});

router.get('/getUserRooms/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find rooms where the user is a participant
        const rooms = await Room.find({ participants: userId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error while fetching rooms' });
    }
});



// Send Friend Request
router.post('/sendFriendRequest', async (req, res) => {
    const { senderId, recipientId } = req.body;
    try {
        const recipient = await User.findById(recipientId);
        if (recipient.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }
        recipient.friendRequests.push(senderId);
        await recipient.save();
        res.json({ success: true, message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Accept Friend Request
router.post('/acceptFriendRequest', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
        user.friends.push(friendId);
        friend.friends.push(userId);

        await user.save();
        await friend.save();
        res.json({ success: true, message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Decline Friend Request
router.post('/declineFriendRequest', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        const user = await User.findById(userId);
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
        await user.save();
        res.json({ success: true, message: 'Friend request declined' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { username, profileImage } = req.body;

    // Validate the presence of userId
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        // Update only if fields are provided
        const updateFields = {};
        if (username) updateFields.username = username;
        if (profileImage) updateFields.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

module.exports = (io, userSocketMap) => {
    router.post('/friends/:userId', async (req, res) => {
        const { userId } = req.params; // Recipient ID
        const { senderId } = req.body; // Sender ID

        console.log("Received Sender ID:", senderId);
        console.log("Received Recipient ID:", userId);

        if (!senderId) {
            console.log("Missing sender ID in request body");
            return res.status(400).json({ message: "Sender ID is required." });
        }

        try {
            // Check if a friend request already exists
            const existingRequest = await FriendRequest.findOne({ senderId, recipientId: userId });
            if (existingRequest) {
                console.log("Friend request already exists between these users");
                return res.status(400).json({ message: "Friend request already sent." });
            }

            // Create and save the friend request
            const friendRequest = new FriendRequest({ senderId, recipientId: userId });
            await friendRequest.save();
            console.log("Friend request saved successfully");

            // Check if the recipient is online before attempting to emit an event
            console.log("Current userSocketMap:", userSocketMap); // Log the userSocketMap

            if (userSocketMap[userId] && typeof userSocketMap[userId] === 'string') {
                // If the recipient is online, emit the friend request notification
                io.to(userSocketMap[userId]).emit('friendRequestReceived', { senderId });
                console.log(`Emitted friendRequestReceived to ${userId} from ${senderId}`);
            } else {
                // If the recipient is offline, log this information
                console.log(`Recipient with ID ${userId} is currently offline, storing request for later notification.`);
            }

            res.json({ message: "Friend request sent successfully" });
        } catch (error) {
            console.error("Error sending friend request:", error);
            res.status(500).json({ message: "Error sending friend request" });
        }
    });

    return router;
};





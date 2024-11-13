const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust the path as needed
const router = express.Router();
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
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        res.json({ success: true, message: 'Login successful' });
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






module.exports = router;
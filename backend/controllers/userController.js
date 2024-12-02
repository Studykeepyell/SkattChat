const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => { /* Registration logic */ 
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
};



exports.login = async (req, res) => {
    const { username, password } = req.body;
    console.log('Login request received:', { username, password }); // Debug log

    try {
        const user = await User.findOne({ username });
        console.log('User found:', user); // Debug log

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid); // Debug log

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, userId: user._id, token });
    } catch (error) {
        console.error('Error during login:', error); // Log the error
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.logout = (req, res) => { 
    /* Logout logic */
    res.clearCookie('token');
    req.session = null;
    res.status(200).json({ success: true, message: 'Logout successful' });

};

exports.searchUsers = async (req, res) => { 
    /* User search logic */ 
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
};


exports.updateProfile = async (req, res) => { 
    /* Profile update logic */
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
};

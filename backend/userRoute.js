// userRoute.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust the path as needed
const router = express.Router();

// Registration route
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
            console.error('Registration error:', err);
            res.status(500).json({ success: false, message: 'Failed to register user' });
        }
    }
});

// userRoute.js - Ensure login checks only username and password
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            console.error('User not found:', username);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error('Password mismatch for user:', username);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Successful login response
        res.status(200).json({ success: true, message: "Login successful" });
    } catch (error) {
        console.error('Login error:', error); // Log full error details
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('./models/User');

// Registration route
router.post('/register', async (req, res) => {
    console.log('Incoming registration data:', req.body); // Log the request body to verify data
    console.log('Headers:', req.headers);  // Add this
    console.log('Body:', req.body);        // Add this
    const { username, password } = req.body;
    
    // Check if required fields are present
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        if (err.code === 11000) { // Duplicate key error for unique fields
            res.status(400).json({ success: false, message: 'Username already exists' });
        } else {
            console.error('Registration error:', err);
            res.status(500).json({ success: false, message: 'Failed to register user' });
        }
    }
});

// Login route (for reference, ensure this is properly handling login as well)
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

module.exports = router;

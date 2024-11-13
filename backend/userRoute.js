const express = require('express');
const router = express.Router();
const User = require('./models/User');

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


module.exports = router;
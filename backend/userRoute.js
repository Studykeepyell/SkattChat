const express = require('express');
const bcrypt = require('bcrypt'); // Ensure bcrypt is required for hashing
const router = express.Router();
const User = require('./models/User'); // Adjust the path as needed

// User registration route
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username already taken' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the new user with the hashed password
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ success: false, message: 'An error occurred during registration' });
    }
});

// User login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Successful login
        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
});

module.exports = router;

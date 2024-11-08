// userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('./models/User'); // Adjust the path as needed

// User registration route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }
    const newUser = new User({ username, password });
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
        console.log('Received login request:', { username, password }); // Debugging log

        // Check for required fields
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // Perform your user verification logic here, for example:
        const user = await User.findOne({ username });
        if (!user || user.password !== password) { // Replace with proper password check
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Successful login response
        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error); // Log the exact error
        res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
});


module.exports = router;

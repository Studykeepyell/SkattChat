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
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});

module.exports = router;

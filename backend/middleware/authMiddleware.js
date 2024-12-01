const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');


module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token

    if (!token) {
        console.error('[AUTH MIDDLEWARE] Missing token');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        console.log('[AUTH MIDDLEWARE] Decoded Token:', decoded);

        const user = await User.findById(decoded.userId); // Find user in DB
        if (!user) {
            console.error('[AUTH MIDDLEWARE] User not found for token:', decoded.userId);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Attach user info to req.user
        req.user = {
            id: user._id,
            username: user.username,
        };
        console.log('[AUTH MIDDLEWARE] User attached to req:', req.user);
        next(); // Pass control to next middleware
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.error('[AUTH MIDDLEWARE] Token expired:', error.expiredAt);
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        console.error('[AUTH MIDDLEWARE] Token verification failed:', error);
        return res.status(403).json({ error: 'Forbidden' });
    }
};

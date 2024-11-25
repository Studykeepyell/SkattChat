const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');


module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.error('[AUTH MIDDLEWARE] Missing token');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[AUTH MIDDLEWARE] Decoded Token:', decoded);

        // Convert userId to ObjectId for querying the database
        const userId = new mongoose.Types.ObjectId(decoded.userId);

        const user = await User.findById(userId);
        if (!user) {
            console.error('[AUTH MIDDLEWARE] User not found for token:', userId);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.error('[AUTH MIDDLEWARE] Token expired:', error.expiredAt);
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }

        console.error('[AUTH MIDDLEWARE] Token verification failed:', error);
        return res.status(403).json({ error: 'Forbidden' });
    }
};

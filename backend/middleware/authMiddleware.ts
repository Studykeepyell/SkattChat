import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
    };
}

interface JwtPayload {
    userId: string;
}

interface UserDocument {
    _id: any;
    username: string;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token

    if (!token) {
        console.error('[AUTH MIDDLEWARE] Missing token');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload; // Verify token
        console.log('[AUTH MIDDLEWARE] Decoded Token:', decoded);

        const user = await User.findById(decoded.userId) as UserDocument; // Find user in DB
        if (!user) {
            console.error('[AUTH MIDDLEWARE] User not found for token:', decoded.userId);
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = {
            id: user._id.toString(),
            username: user.username,
        };
        console.log('[AUTH MIDDLEWARE] User attached to req:', req.user);
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            console.error('[AUTH MIDDLEWARE] Token expired:', error.expiredAt);
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
        console.error('[AUTH MIDDLEWARE] Token verification failed:', error);
        return res.status(403).json({ error: 'Forbidden' });
    }
};

export default authMiddleware;

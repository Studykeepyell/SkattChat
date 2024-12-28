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
    userId?: string;
    id?: string;
}

interface UserDocument {
    _id: any;
    username: string;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        console.log('\n[AUTH MIDDLEWARE] Starting token verification...');
        console.log('[AUTH MIDDLEWARE] Headers:', JSON.stringify(req.headers, null, 2));
        console.log('[AUTH MIDDLEWARE] Authorization header:', req.headers.authorization);
        
        const token = req.headers.authorization?.split(' ')[1];
        console.log('[AUTH MIDDLEWARE] Extracted token:', token ? `${token.substring(0, 20)}...` : 'no token');

        if (!token) {
            console.error('[AUTH MIDDLEWARE] Missing token');
            return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }

        console.log('[AUTH MIDDLEWARE] JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('[AUTH MIDDLEWARE] JWT_SECRET length:', process.env.JWT_SECRET?.length);
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            console.log('[AUTH MIDDLEWARE] Token verified successfully');
            console.log('[AUTH MIDDLEWARE] Decoded Token:', decoded);

            const userId = decoded.userId || decoded.id;
            console.log('[AUTH MIDDLEWARE] Extracted userId:', userId);
            
            if (!userId) {
                console.error('[AUTH MIDDLEWARE] No user ID found in token payload');
                return res.status(401).json({ error: 'Invalid token format - No user ID' });
            }

            const user = await User.findById(userId) as UserDocument;
            console.log('[AUTH MIDDLEWARE] User lookup result:', user ? 'Found' : 'Not found');
            
            if (!user) {
                console.error('[AUTH MIDDLEWARE] User not found in database:', userId);
                return res.status(401).json({ error: 'Invalid token - User not found' });
            }

            req.user = {
                id: user._id.toString(),
                username: user.username,
            };
            console.log('[AUTH MIDDLEWARE] User attached to request:', req.user);
            next();
        } catch (verifyError: any) {
            console.error('[AUTH MIDDLEWARE] Token verification failed:', {
                name: verifyError.name,
                message: verifyError.message,
                expiredAt: verifyError.expiredAt,
                stack: verifyError.stack
            });
            
            if (verifyError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Session expired',
                    details: {
                        expiredAt: verifyError.expiredAt,
                        message: 'Your session has expired. Please log in again.'
                    }
                });
            }
            
            return res.status(403).json({ 
                error: 'Invalid token',
                details: {
                    name: verifyError.name,
                    message: verifyError.message
                }
            });
        }
    } catch (error: any) {
        console.error('[AUTH MIDDLEWARE] Unexpected error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export default authMiddleware;

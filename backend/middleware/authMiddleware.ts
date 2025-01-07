import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User.js';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
    };
}

interface JwtPayload {
    id: string;
    iat?: number;
    exp?: number;
}

interface IUserDocument extends IUser {
    _id: Types.ObjectId;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('\n[AUTH] Request path:', req.path);
        console.log('[AUTH] Authorization header:', authHeader?.substring(0, 50) + '...');

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Unauthorized', 
                message: 'No token provided or invalid format' 
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('[AUTH] Token:', token.substring(0, 20) + '...');
        console.log('[AUTH] JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('[AUTH] JWT_SECRET length:', process.env.JWT_SECRET?.length);

        if (!process.env.JWT_SECRET) {
            console.error('[AUTH] JWT_SECRET not configured');
            return res.status(500).json({ 
                error: 'Server configuration error' 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
            console.log('[AUTH] Decoded token:', {
                id: decoded.id,
                iat: decoded.iat,
                exp: decoded.exp,
                now: Math.floor(Date.now() / 1000)
            });

            const user = await User.findById(decoded.id) as IUserDocument;
            if (!user) {
                console.error('[AUTH] User not found for id:', decoded.id);
                return res.status(401).json({ 
                    error: 'Unauthorized', 
                    message: 'User not found' 
                });
            }

            req.user = {
                id: user._id.toString(),
                username: user.username
            };
            console.log('[AUTH] Authentication successful for user:', user.username);

            next();
        } catch (err: any) {
            console.error('[AUTH] Token verification failed:', {
                name: err.name,
                message: err.message,
                expiredAt: err.expiredAt,
                token: token.substring(0, 20) + '...'
            });

            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Token expired', 
                    message: 'Please log in again',
                    expiredAt: err.expiredAt
                });
            }
            return res.status(403).json({ 
                error: 'Invalid token', 
                message: 'Please log in again',
                details: err.message
            });
        }
    } catch (error) {
        console.error('[AUTH] Middleware error:', error);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};

export default authMiddleware;

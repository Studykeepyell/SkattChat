import { Request, Response } from 'express';
import User from '../../models/User.js';

export const searchUsers = async (req: Request, res: Response) => {
    const query = req.query.q as string;
    try {
        const users = await User.find({
            $or: [
                { displayName: new RegExp(query, 'i') },
                { username: new RegExp(query, 'i') }
            ]
        });
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found' });
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

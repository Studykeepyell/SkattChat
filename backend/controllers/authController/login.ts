import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../../models/User.js';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        }) as IUser;

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.isPasswordMatch(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            userId: user._id,
            token,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

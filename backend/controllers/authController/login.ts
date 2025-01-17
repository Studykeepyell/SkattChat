import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../../models/User.js';
import { Types } from 'mongoose';

export interface IUserDocument extends IUser {
    _id: Types.ObjectId;
}

export const login = async (req: Request, res: Response) => {
    console.log('\n[LOGIN] Starting login process...');
    const { username, password } = req.body;
    console.log('[LOGIN] Login attempt for username:', username);

    try {
        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        }) as IUserDocument;

        console.log('[LOGIN] User found:', user ? 'yes' : 'no');

        if (!user) {
            console.error('[LOGIN] User not found');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.isPasswordMatch(password);
        console.log('[LOGIN] Password match:', isMatch);

        if (!isMatch) {
            console.error('[LOGIN] Password does not match');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Debug JWT secrets
        console.log('[LOGIN] JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('[LOGIN] JWT_SECRET length:', process.env.JWT_SECRET?.length);
        console.log('[LOGIN] JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
        console.log('[LOGIN] JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET?.length);

        // Verify secrets are configured
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.error('[LOGIN] Missing JWT secrets:', {
                hasJwtSecret: !!process.env.JWT_SECRET,
                hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET
            });
            return res.status(500).json({ 
                success: false, 
                error: 'Server configuration error' 
            });
        }

        // Generate token with 'id' instead of 'userId'
        const payload = { id: user._id.toString() };
        console.log('[LOGIN] Token payload:', payload);

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }  // Access token expires in 1 hour
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }  // Refresh token expires in 7 days
        );

        // Store refresh token in user document
        user.refreshToken = refreshToken;
        await user.save();

        console.log('[LOGIN] Tokens generated successfully');
        console.log('[LOGIN] Access token length:', token?.length);
        console.log('[LOGIN] Refresh token length:', refreshToken?.length);

        // Verify the token immediately after generation
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            console.log('[LOGIN] Token verification test passed');
            console.log('[LOGIN] Decoded test token:', decoded);
        } catch (verifyError) {
            console.error('[LOGIN] Token verification test failed:', verifyError);
        }

        // Send response
        const responseData = {
            success: true,
            userId: user._id.toString(),
            username: user.username,
            token,
            refreshToken,
            message: 'Login successful'
        };

        console.log('[LOGIN] Sending response data:', responseData);
        res.json(responseData);

        console.log('[LOGIN] Login successful for user:', user.username);

    } catch (error) {
        console.error('[LOGIN] Error during login:', error);
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
};

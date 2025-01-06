import { Request, Response } from 'express';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }

    try {
        const newUser = new User({ username, password });
        await newUser.save();

        // Generate token after successful registration
        const token = jwt.sign(
            { id: newUser._id.toString() },
            process.env.JWT_SECRET as string,
            { expiresIn: '12h' }
        );

        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            userId: newUser._id,
            token
        });
    } catch (err: any) {
        if (err.code === 11000) {
            res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to register user' 
            });
        }
    }
}; 
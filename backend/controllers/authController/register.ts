import { Request, Response } from 'express';
import User, { IUser } from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface IUserDocument extends IUser {
    _id: Types.ObjectId;
}

export const register = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }

    try {
        const newUser = new User({ username, password }) as IUserDocument;
        await newUser.save();

        // Generate token after successful registration
        const token = jwt.sign(
            { id: newUser._id.toString() },
            process.env.JWT_SECRET as string,
            { expiresIn: '3d' }
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
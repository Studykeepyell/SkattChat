import { Request , Response} from 'express';
import User from '../../models/User.js';



export const register = async (req: Request, res: Response) => { /* Registration logic */ 
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err:any) {
        if (err.code === 11000) {
            res.status(400).json({ success: false, message: 'Username already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to register user' });
        }
    }
};
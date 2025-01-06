import { Request, Response } from 'express';

interface SessionRequest extends Request {
    session?: any;
}

export const logout = (req: SessionRequest, res: Response) => {
    res.clearCookie('token');
    if (req.session) req.session = null;
    res.status(200).json({ success: true, message: 'Logout successful' });
};

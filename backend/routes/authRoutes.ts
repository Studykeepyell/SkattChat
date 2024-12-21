import express, { RequestHandler, Response } from 'express';
import authMiddleware, { AuthRequest } from '../middleware/authMiddleware.js';
import { login } from '../controllers/authController/login.js';
import { refreshToken } from '../controllers/authController/refreshToken.js';

const router = express.Router();

// Public routes (no auth required)
router.post('/login', login as RequestHandler);
router.post('/refresh', refreshToken as RequestHandler);

// Protected routes (require auth)
router.get('/verify', authMiddleware as RequestHandler, (req: AuthRequest, res: Response) => {
    res.json({ valid: true, user: req.user });
});

// Example of another protected route
router.post('/logout', authMiddleware as RequestHandler, (req: AuthRequest, res: Response) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;

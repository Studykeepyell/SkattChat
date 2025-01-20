import express, { Request } from 'express';
import GameScore from '../models/GameScore.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Extend Request type
interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
    };
}

const router = express.Router();

// Save score
router.post('/scores', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { score, accuracy, songName } = req.body;
        const userId = req.user?.id;
        const username = req.user?.username;

        const gameScore = new GameScore({
            userId,
            username,
            score,
            accuracy,
            songName
        });

        await gameScore.save();
        res.status(201).json(gameScore);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await GameScore.find()
            .sort({ score: -1 })
            .limit(10)
            .select('username score accuracy songName');
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;

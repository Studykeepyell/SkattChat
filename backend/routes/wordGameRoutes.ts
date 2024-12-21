import express, { Request, Response } from 'express';
import { checkWord } from '../controllers/wordGameController.js';
const router = express.Router();

router.get('/check-word', checkWord);
    
export default router;

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createRoom, joinRoom, getRooms,  } from '../controllers/roomController/index.js';

const router = express.Router();

// Create a new room (can be private or public)
router.post('/create', authMiddleware, createRoom);

// Update room profile image
router.post('/:roomId/profile-image', authMiddleware);

// Join a public room
router.post('/:roomId/join', authMiddleware, joinRoom);

// Get room list for user
router.get('/', authMiddleware, getRooms);

export default router; 
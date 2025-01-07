import { Router, Request, Response } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import { Server } from 'socket.io';
import { 
    fetchMessages, 
    fetchChatRooms, 
    sendMessage,
    markMessagesAsRead,
    joinRoom 
} from '../controllers/chatController/index.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { AuthenticatedRequest } from '../types/express.js';

export default function(io: Server) {
    const router = Router();
    
    router.post('/send', ((req: Request, res: Response) => {
        return sendMessage(io, req, res);
    }) as RequestHandler);
    router.get('/rooms/:roomId/messages', fetchMessages as RequestHandler);
    router.get('/rooms', authMiddleware, fetchChatRooms as RequestHandler);
    router.put('/rooms/:roomId/read', authMiddleware, markMessagesAsRead as RequestHandler);
    router.post('/rooms/:roomId/join', authMiddleware, ((req: Request, res: Response) => {
        return joinRoom(req as AuthenticatedRequest, res);
    }) as RequestHandler);

    return router;
}
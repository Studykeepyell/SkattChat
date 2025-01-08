import { Server } from 'socket.io';
import { ChatHandler } from './chatHandler.js';
import { FriendRequestHandler } from './friendRequestHandler.js';
import jwt from 'jsonwebtoken';
import { CustomSocket } from './types.js';

const userSocketMap = new Map();

export const setupSocket = (io: Server) => {
    const chatHandler = new ChatHandler(io);
    const friendRequestHandler = new FriendRequestHandler(io);

    io.use((socket: CustomSocket, next) => {
        try {
            const { token, userId } = socket.handshake.auth;
            
            if (!token || !userId) {
                console.error('[SOCKET] Missing auth data:', { hasToken: !!token, hasUserId: !!userId });
                return next(new Error('Authentication required'));
            }

            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
            
            // Verify that the token's user ID matches the provided user ID
            if (decoded.id !== userId) {
                console.error('[SOCKET] User ID mismatch:', { tokenUserId: decoded.id, providedUserId: userId });
                return next(new Error('Invalid authentication'));
            }

            // Set the verified user ID on the socket
            socket.userId = userId;
            console.log('[SOCKET] User authenticated:', userId);
            
            next();
        } catch (error) {
            console.error('[SOCKET] Authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket: CustomSocket) => {
        console.log('[SOCKET] Client connected:', socket.id);
        console.log('[SOCKET] User ID:', socket.userId);

        // Store socket mapping
        if (socket.userId) {
            userSocketMap.set(socket.userId, socket.id);
        }

        chatHandler.handleConnection(socket);
        friendRequestHandler.handleConnection(socket);

        socket.on('disconnect', () => {
            console.log('[SOCKET] Client disconnected:', socket.id);
            if (socket.userId) {
                userSocketMap.delete(socket.userId);
            }
        });
    });
};

export { userSocketMap };

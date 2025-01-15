import { Server } from 'socket.io';
import Message from '../models/Message.js';
import { CustomSocket } from './types.js';
import { RoomSocketHandlers } from '../controllers/roomController/socketHandlers.js';

interface MessageData {
    roomId: string;
    userId: string;
    username: string;
    message?: string;
    gifUrl?: string;
    messageType: 'text' | 'gif';
    timestamp: Date;
}

export class ChatHandler {
    private roomHandlers: RoomSocketHandlers;

    constructor(private io: Server) {
        this.roomHandlers = new RoomSocketHandlers(io);
    }

    handleConnection(socket: CustomSocket) {
        socket.on('message', (data: MessageData) => this.handleMessage(socket, data));
        socket.on('joinRoom', (data: any) => this.roomHandlers.handleJoinRoom(socket, data));
        socket.on('createRoom', (data: any) => this.roomHandlers.handleCreateRoom(socket, data));
        socket.on('requestRooms', () => this.roomHandlers.handleRequestRooms(socket));
        
        // Listen for profile updates
        socket.on('profileUpdated', (data: { userId: string, profileImage: any }) => {
            this.io.emit('profileUpdated', data);
            this.roomHandlers.handleRequestRooms(socket);
        });
    }

    private async handleMessage(socket: CustomSocket, data: MessageData) {
        try {
            const { roomId, userId, username, message, gifUrl, messageType, timestamp } = data;
            console.log('[CHAT] Received message:', data);

            // Save message to database
            const newMessage = new Message({
                roomId,
                userId,
                username,
                messageType,
                message: messageType === 'text' ? message : '',
                gifUrl: messageType === 'gif' ? gifUrl : '',
                timestamp
            });
            await newMessage.save();

            // Broadcast to all clients in the room
            const formattedMessage = {
                id: newMessage._id,
                sender: username,
                content: messageType === 'text' ? message : '',
                messageType,
                gifUrl: messageType === 'gif' ? gifUrl : '',
                timestamp: timestamp,
                userId: userId
            };
            this.io.in(roomId).emit('message', formattedMessage);

            // Request room update to refresh last message time
            this.roomHandlers.handleRequestRooms(socket);

        } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('error', 'Failed to send message');
        }
    }
} 
import { Server, Socket } from 'socket.io';
import Room from '../models/Room.js';

// Move this to a shared socket utility file or pass it as a parameter
const userSocketMap: { [key: string]: string } = {};

interface privateRoom {
    roomId: string;
    name: string;
    participants: string[];
}

/**
 * Handles friend requests and real-time private room creation.
 * @param {Object} io - The Socket.IO server instance.
 * @param {Object} socket - The Socket.IO socket instance.
 */
export function handleFriendRequestEvents(io: Server, socket: Socket) {
    // Event: Accept Friend Request
    socket.on('acceptFriendRequest', async (data: any) => {
        const { requesterId, accepterId } = data;

        try {
            // Create private room (or fetch an existing one)
            const roomId = `${requesterId}_${accepterId}`;
            let privateRoom = await Room.findOne({ roomId });
            
            if (!privateRoom) {
                privateRoom = await Room.create({
                    roomId,
                    name: `Private Chat: ${requesterId} and ${accepterId}`,
                    participants: [requesterId, accepterId],
                });
                console.log('Private room created:', privateRoom);
            }

            // Ensure privateRoom exists before proceeding
            if (!privateRoom) {
                throw new Error('Failed to create or find private room');
            }

            // Notify both users of the new private room
            [requesterId, accepterId].forEach((userId: string) => {
                const userSocketId = userSocketMap[userId];
                if (userSocketId) {
                    io.to(userSocketId).emit('newPrivateRoom', {
                        roomId: privateRoom!.roomId,
                        name: privateRoom!.name,
                    });
                }
            });
        } catch (error: any) {
            console.error('Error creating private room:', error);
            socket.emit('privateRoomError', { message: 'Failed to create private room' });
        }
    });
}

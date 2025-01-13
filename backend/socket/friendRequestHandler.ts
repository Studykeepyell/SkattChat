import { Server } from 'socket.io';
import { CustomSocket } from './types.js';
import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';

export class FriendRequestHandler {
    constructor(private io: Server) {}

    handleConnection(socket: CustomSocket) {
        socket.on('friendRequest', (data) => this.handleFriendRequest(socket, data));
        socket.on('acceptFriendRequest', (data) => this.handleAcceptRequest(socket, data));
        socket.on('rejectFriendRequest', (data) => this.handleRejectRequest(socket, data));
    }

    private async handleFriendRequest(socket: CustomSocket, data: any) {
        try {
            const { senderId, receiverId } = data;
            
            // Create friend request
            const friendRequest = await FriendRequest.create({
                sender: senderId,
                receiver: receiverId,
                status: 'pending'
            });

            // Notify the receiver if they're online
            socket.to(receiverId).emit('friendRequest', {
                requestId: friendRequest._id,
                sender: senderId
            });

            socket.emit('friendRequestSent', { success: true });
        } catch (error) {
            console.error('Friend request error:', error);
            socket.emit('error', 'Failed to send friend request');
        }
    }

    private async handleAcceptRequest(socket: CustomSocket, data: any) {
        try {
            const { requestId, userId } = data;
            
            const request = await FriendRequest.findById(requestId);
            if (!request) {
                throw new Error('Friend request not found');
            }

            // Update request status
            request.status = 'accepted';
            await request.save();

            // Add users to each other's friend lists
            await User.findByIdAndUpdate(request.sender, {
                $addToSet: { friends: request.receiver }
            });
            await User.findByIdAndUpdate(request.receiver, {
                $addToSet: { friends: request.sender }
            });

            // Notify both users
            socket.to(request.sender.toString()).emit('friendRequestAccepted', {
                requestId,
                userId: request.receiver
            });
            socket.emit('friendRequestAccepted', {
                requestId,
                userId: request.sender
            });
        } catch (error) {
            console.error('Accept request error:', error);
            socket.emit('error', 'Failed to accept friend request');
        }
    }

    private async handleRejectRequest(socket: CustomSocket, data: any) {
        try {
            const { requestId } = data;
            
            const request = await FriendRequest.findByIdAndUpdate(requestId, {
                status: 'declined'
            });

            if (!request) {
                throw new Error('Friend request not found');
            }

            socket.to(request.sender.toString()).emit('friendRequestRejected', {
                requestId
            });
        } catch (error) {
            console.error('Reject request error:', error);
            socket.emit('error', 'Failed to reject friend request');
        }
    }
}

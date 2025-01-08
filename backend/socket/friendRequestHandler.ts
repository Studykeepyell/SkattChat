import { Server } from 'socket.io';
import { CustomSocket } from './types.js';

export class FriendRequestHandler {
    constructor(private io: Server) {}

    handleConnection(socket: CustomSocket) {
        socket.on('friendRequest', (data) => this.handleFriendRequest(socket, data));
        socket.on('acceptFriendRequest', (data) => this.handleAcceptRequest(socket, data));
        socket.on('rejectFriendRequest', (data) => this.handleRejectRequest(socket, data));
    }

    private async handleFriendRequest(socket: CustomSocket, data: any) {
        try {
            // Friend request logic here
            console.log('Friend request:', data);
        } catch (error) {
            socket.emit('error', 'Failed to send friend request');
        }
    }

    private async handleAcceptRequest(socket: CustomSocket, data: any) {
        try {
            // Accept friend request logic here
            console.log('Accept friend request:', data);
        } catch (error) {
            socket.emit('error', 'Failed to accept friend request');
        }
    }

    private async handleRejectRequest(socket: CustomSocket, data: any) {
        try {
            // Reject friend request logic here
            console.log('Reject friend request:', data);
        } catch (error) {
            socket.emit('error', 'Failed to reject friend request');
        }
    }
}

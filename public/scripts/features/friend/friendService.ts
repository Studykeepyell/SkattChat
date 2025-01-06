import { API_CONFIG } from '../../core/api.config.js';
import { HttpService } from '../../core/httpService.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';
import { ErrorHandler } from '../../core/errorHandler.js';
import { StorageService } from '../../core/storageService.js';

export class FriendService {
    async sendFriendRequest(receiverId: string) {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.SEND(receiverId),
                {}
            );

            if (response.success) {
                EventBus.publish(Constants.EVENTS.FRIEND_REQUEST_SENT, response);
                return response;
            }
            throw new Error(response.message || 'Failed to send friend request');
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    async loadFriendRequests() {
        try {
            const userId = StorageService.get('userId');
            if (!userId) throw new Error('User ID not found');

            const response = await HttpService.get(
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.PENDING(userId)
            );
            return response.requests;
        } catch (error) {
            ErrorHandler.handle(error);
            return [];
        }
    }

    async respondToFriendRequest(requestId: string, status: 'accepted' | 'declined') {
        try {
            const response = await HttpService.put(
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.RESPOND,
                { requestId, status }
            );
            
            if (response.success) {
                EventBus.publish(Constants.EVENTS.FRIEND_REQUEST_RESPONDED, { 
                    requestId, 
                    status 
                });
                return response;
            }
            throw new Error(response.message || 'Failed to respond to friend request');
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }
} 
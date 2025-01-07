import { API_CONFIG } from '../../core/api.config';
import { HttpService } from '../../core/httpService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';
import { StorageService } from '../../core/storageService';

export class FriendService {
    async sendFriendRequest(receiverId: string) {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.SEND,
                { receiverId }
            );

            if (response.success) {
                EventBus.publish(Constants.EVENTS.FRIEND_REQUEST, response);
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
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.LIST
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
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.ACCEPT,
                { requestId }
            );
            
            if (response.success) {
                EventBus.publish(Constants.EVENTS.FRIEND_REQUEST, { 
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
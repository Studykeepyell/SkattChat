import { API_CONFIG } from '../../core/api.config';
import { HttpService } from '../../core/httpService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';
import { StorageService } from '../../core/storageService';
import { ChatService } from '../chat/services/chatService';

export class FriendService {
    private chatService: ChatService;

    constructor() {
        this.chatService = ChatService.getInstance();
    }

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
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
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
            const endpoint = status === 'accepted' ? 
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.ACCEPT :
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.DECLINE;

            const response = await HttpService.put(
                endpoint,
                { requestId }
            );
            
            if (response.success && status === 'accepted') {
                if (!response.friendId) {
                    throw new Error('Friend ID not received from server');
                }

                // If we got a room back from the server, use it directly
                if (response.room) {
                    EventBus.publish(Constants.EVENTS.ROOM_CREATED, response.room);
                } else {
                    // Otherwise create a new room
                    await this.createPrivateChatRoom(response.friendId);
                }

                EventBus.publish(Constants.EVENTS.FRIEND_REQUEST, { 
                    requestId, 
                    status,
                    friendId: response.friendId
                });
                return response;
            }
            throw new Error(response.message || 'Failed to respond to friend request');
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private async createPrivateChatRoom(friendId: string) {
        try {
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            if (!currentUserId) throw new Error('User ID not found');
            if (!friendId) throw new Error('Friend ID not found');

            // Get both profiles
            const [friendProfile, currentUserProfile] = await Promise.all([
                HttpService.get(API_CONFIG.ENDPOINTS.USER.PROFILE + `/${friendId}`),
                HttpService.get(API_CONFIG.ENDPOINTS.USER.PROFILE + `/${currentUserId}`)
            ]);

            if (!friendProfile?.username || !currentUserProfile?.username) {
                throw new Error('Failed to get user profiles');
            }

            // Create a private chat room
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.CHAT.CREATE_ROOM,
                {
                    roomId: `private_chat_${currentUserId}_${friendId}`,
                    type: 'private',
                    members: [currentUserId, friendId],
                    name: `${currentUserProfile.username} & ${friendProfile.username}`,
                    memberProfiles: [
                        {
                            userId: currentUserId,
                            profileImage: currentUserProfile.profileImage || null,
                            username: currentUserProfile.username,
                            role: 'member'
                        },
                        {
                            userId: friendId,
                            profileImage: friendProfile.profileImage || null,
                            username: friendProfile.username,
                            role: 'member'
                        }
                    ]
                }
            );

            if (response.success) {
                EventBus.publish(Constants.EVENTS.ROOM_CREATED, response.room);
            }

            return response;
        } catch (error) {
            console.error('Error creating private chat room:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }
} 
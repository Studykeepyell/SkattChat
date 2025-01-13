import { SocketService } from '../../core/socketService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';
import { StorageService } from '../../core/storageService';

export class FriendSocketHandler {
    private socket: any;
    private readonly SOCKET_EVENTS = {
        FRIEND_REQUEST: 'friend_request',
        FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
        FRIEND_LIST_UPDATE: 'friend_list_update'
    };

    initialize(token: string) {
        try {
            console.log('[FRIEND_SOCKET] Initializing...');
            if (!token) {
                throw new Error('Authentication token not found');
            }
            
            this.socket = SocketService.initialize(token);
            this.setupEventHandlers();
            console.log('[FRIEND_SOCKET] Initialization complete');
        } catch (error) {
            console.error('[FRIEND_SOCKET] Initialization failed:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    private setupEventHandlers() {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        const handlers = {
            [this.SOCKET_EVENTS.FRIEND_REQUEST]: this.handleFriendRequest.bind(this),
            [this.SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED]: this.handleFriendRequestAccepted.bind(this),
            [this.SOCKET_EVENTS.FRIEND_LIST_UPDATE]: this.handleFriendListUpdate.bind(this)
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            this.socket.off(event);
            this.socket.on(event, handler);
        });
    }

    private handleFriendRequest(data: any) {
        try {
            EventBus.publish(Constants.EVENTS.FRIEND_REQUEST, data);
        } catch (error) {
            console.error('[FRIEND_SOCKET] Friend request handling failed:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleFriendRequestAccepted(data: any) {
        try {
            EventBus.publish(Constants.EVENTS.FRIEND_REQUEST_ACCEPTED, data);
        } catch (error) {
            console.error('[FRIEND_SOCKET] Friend request acceptance handling failed:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleFriendListUpdate(friends: any[]) {
        try {
            EventBus.publish(Constants.EVENTS.FRIEND_LIST_UPDATE, friends);
        } catch (error) {
            console.error('[FRIEND_SOCKET] Friend list update handling failed:', error);
            ErrorHandler.handle(error);
        }
    }
} 
import { SocketService } from '../../core/socketService.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';
import { API_CONFIG } from '../../core/api.config.js';
import { ErrorHandler } from '../../core/errorHandler.js';

export class FriendSocketHandler {
    private socket = SocketService.getInstance();
    private readonly EVENTS = API_CONFIG.SOCKET.EVENTS;

    initialize() {
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        const handlers = {
            [this.EVENTS.FRIEND_REQUEST_RECEIVED]: this.handleFriendRequest.bind(this),
            [this.EVENTS.FRIEND_REQUEST_ACCEPTED]: this.handleFriendRequestAccepted.bind(this),
            [this.EVENTS.FRIEND_LIST_UPDATED]: this.handleFriendListUpdate.bind(this)
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            this.socket.off(event);
            this.socket.on(event, handler);
        });
    }

    private handleFriendRequest(data: any) {
        try {
            EventBus.publish(Constants.EVENTS.FRIEND_REQUEST_RECEIVED, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleFriendRequestAccepted(data: any) {
        try {
            EventBus.publish(Constants.EVENTS.FRIEND_REQUEST_ACCEPTED, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleFriendListUpdate(friends: any[]) {
        try {
            EventBus.publish(Constants.EVENTS.FRIEND_LIST_UPDATED, friends);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }
} 
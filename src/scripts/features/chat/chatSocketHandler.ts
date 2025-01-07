import { SocketService } from '../../core/socketService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';

export class ChatSocketHandler {
    private socket = SocketService.initialize();

    initialize() {
        this.setupEventHandlers();
        this.requestInitialData();
    }

    private setupEventHandlers() {
        const handlers = {
            'message': this.handleMessage.bind(this),
            'room_update': this.handleRoomUpdate.bind(this),
            'room_list': this.handleRoomList.bind(this),
            'connect': this.handleConnect.bind(this),
            'connect_error': this.handleError.bind(this)
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            this.socket.off(event);
            this.socket.on(event, handler);
        });
    }

    private handleMessage(data: any) {
        try {
            EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleRoomUpdate(data: any) {
        try {
            EventBus.publish(Constants.EVENTS.ROOM_UPDATED, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleRoomList(rooms: any[]) {
        try {
            EventBus.publish(Constants.EVENTS.ROOMS_UPDATED, rooms);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleConnect() {
        console.log('[CHAT_SOCKET] Connected');
        this.requestInitialData();
    }

    private handleError(error: any) {
        console.error('[CHAT_SOCKET] Connection error:', error);
        ErrorHandler.handle(error);
    }

    private requestInitialData() {
        this.socket.emit('request_rooms');
    }
} 
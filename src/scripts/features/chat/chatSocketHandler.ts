import { SocketService } from '../../core/socketService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { API_CONFIG } from '../../core/api.config';
import { ErrorHandler } from '../../core/errorHandler';

export class ChatSocketHandler {
    private socket = SocketService.getInstance();
    private readonly EVENTS = API_CONFIG.SOCKET.EVENTS;

    initialize() {
        this.setupEventHandlers();
        this.requestInitialData();
    }

    private setupEventHandlers() {
        const handlers = {
            [this.EVENTS.MESSAGE]: this.handleMessage.bind(this),
            [this.EVENTS.ROOM_UPDATE]: this.handleRoomUpdate.bind(this),
            [this.EVENTS.ROOM_LIST]: this.handleRoomList.bind(this),
            [this.EVENTS.CONNECT]: this.handleConnect.bind(this),
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
        console.log('Chat socket connected');
        this.requestInitialData();
    }

    private handleError(error: any) {
        ErrorHandler.handle(error);
    }

    private requestInitialData() {
        this.socket.emit(this.EVENTS.REQUEST_ROOMS);
    }
} 
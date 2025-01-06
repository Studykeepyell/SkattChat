import { API_CONFIG } from '../../core/api.config';
import { HttpService } from '../../core/httpService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { SocketService } from '../../core/socketService';
import { StorageService } from '../../core/storageService';
import { ErrorHandler } from '../../core/errorHandler';
import { MessageService } from './messageService';
import { ChatUIService } from './chatUIService';

export class ChatService {
    private socket = SocketService.getInstance();
    private messageService: MessageService;
    private uiService: ChatUIService;

    constructor() {
        this.messageService = new MessageService();
        this.uiService = new ChatUIService();
        this.setupEventListeners();
    }

    private setupEventListeners() {
        EventBus.subscribe(Constants.EVENTS.SEND_MESSAGE, this.sendMessage.bind(this));
        EventBus.subscribe(Constants.EVENTS.MESSAGE_RECEIVED, this.messageService.addChatMessage.bind(this.messageService));
    }

    async sendMessage(roomId: string, message: string) {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.CHAT.SEND,
                { roomId, message }
            );
            EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, response);
            return response;
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    async fetchMessages(roomId: string) {
        try {
            const response = await HttpService.get(
                API_CONFIG.ENDPOINTS.CHAT.MESSAGES(roomId)
            );
            return response.messages;
        } catch (error) {
            ErrorHandler.handle(error);
            return [];
        }
    }

    async markMessagesAsRead(roomId: string) {
        try {
            await HttpService.put(
                API_CONFIG.ENDPOINTS.CHAT.MARK_READ(roomId)
            );
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    async joinRoom(roomId: string) {
        try {
            StorageService.set('currentRoom', roomId);
            this.socket.emit(API_CONFIG.SOCKET.EVENTS.JOIN_ROOM, { roomId });
            await this.fetchMessages(roomId);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }
} 
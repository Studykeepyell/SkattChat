import { API_CONFIG } from '../../core/api.config';
import { HttpService } from '../../core/httpService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';
import { MessageService } from './messageService';
import { ChatSocketHandler } from './chatSocketHandler';

export class ChatService {
    private static instance: ChatService;
    private messageService: MessageService;
    private socketHandler: ChatSocketHandler;

    private constructor() {
        try {
            console.log('[CHAT_SERVICE] Initializing...');
            this.messageService = new MessageService();
            this.socketHandler = ChatSocketHandler.getInstance();
            this.setupEventListeners();
            console.log('[CHAT_SERVICE] Initialization complete');
        } catch (error) {
            console.error('[CHAT_SERVICE] Initialization failed:', error);
            throw error;
        }
    }

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    public setCurrentRoom(roomId: string | null) {
        this.socketHandler.setCurrentRoom(roomId);
    }

    public getCurrentRoom(): string | null {
        return this.socketHandler.getCurrentRoom();
    }

    private setupEventListeners() {
        // Handle local events
        EventBus.subscribe(Constants.EVENTS.SEND_MESSAGE, async (data: any) => {
            console.log('[CHAT_SERVICE] Received send message event:', data);
            if (data && data.content) {
                await this.handleMessageSend(data.content);
            } else {
                console.error('[CHAT_SERVICE] Invalid message data:', data);
            }
        });
        
        EventBus.subscribe(Constants.EVENTS.MESSAGE_RECEIVED, this.messageService.addChatMessage.bind(this.messageService));
        EventBus.subscribe(Constants.EVENTS.JOIN_ROOM, this.joinRoom.bind(this));
    }

    public async handleMessageSend(content: string): Promise<boolean> {
        return this.socketHandler.sendMessage(content);
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
            this.messageService.clearMessages();
            await this.socketHandler.joinRoom(roomId);
        } catch (error) {
            console.error('[CHAT_SERVICE] Error joining room:', error);
            ErrorHandler.handle(error);
        }
    }
}
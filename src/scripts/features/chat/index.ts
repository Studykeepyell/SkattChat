import { ChatService } from './chatService';
import { ChatRoomService } from './chatRoomService';
import { ChatSocketHandler } from './chatSocketHandler';
import { MessageService } from './messageService';
import { ErrorHandler } from '../../core/errorHandler';

export class ChatModule {
    private chatService: ChatService;
    private socketHandler: ChatSocketHandler;
    private messageService: MessageService;
    private chatRoomService: ChatRoomService;

    constructor() {
        try {
            console.log('[CHAT_MODULE] Initializing services...');
            this.chatService = ChatService.getInstance();
            this.socketHandler = new ChatSocketHandler();
            this.messageService = new MessageService();
            this.chatRoomService = new ChatRoomService();
            console.log('[CHAT_MODULE] Services created successfully');
        } catch (error) {
            console.error('[CHAT_MODULE] Error in constructor:', error);
            throw error;
        }
    }

    initialize() {
        try {
            console.log('[CHAT_MODULE] Starting initialization...');
            
            console.log('[CHAT_MODULE] Initializing socket handler...');
            this.socketHandler.initialize();
            
            console.log('[CHAT_MODULE] Initializing room service...');
            this.chatRoomService.initialize();
            
            console.log('[CHAT_MODULE] Module initialization complete');
        } catch (error) {
            console.error('[CHAT_MODULE] Error during initialization:', error);
            if (error instanceof Error) {
                console.error('[CHAT_MODULE] Error details:', error.message);
                console.error('[CHAT_MODULE] Stack trace:', error.stack);
            }
            ErrorHandler.handle(error);
            throw error;
        }
    }
} 
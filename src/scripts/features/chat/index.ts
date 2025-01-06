import { ChatService } from './chatService.js';
import { ChatRoomService } from './chatRoomService.js';
import { ChatSocketHandler } from './chatSocketHandler.js';
import { MessageService } from './messageService.js';
import { ChatUIService } from './chatUIService.js';

export class ChatModule {
    private chatService: ChatService;
    private socketHandler: ChatSocketHandler;

    constructor() {
        this.chatService = new ChatService();
        this.socketHandler = new ChatSocketHandler();
    }

    initialize() {
        this.socketHandler.initialize();
    }
} 
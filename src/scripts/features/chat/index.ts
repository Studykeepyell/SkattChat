import { ChatService } from './chatService';
import { ChatRoomService } from './chatRoomService';
import { ChatSocketHandler } from './chatSocketHandler';
import { MessageService } from './messageService';
import { ChatUIService } from './chatUIService';

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
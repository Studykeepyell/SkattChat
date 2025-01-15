import { API_CONFIG } from '../../../core/api.config';
import { HttpService } from '../../../core/httpService';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { ErrorHandler } from '../../../core/errorHandler';
import { MessageService } from '../messageService';
import { ChatSocketHandler } from './chatSocketHandler';
import { ChatRoom } from '../types';

export class ChatService {
    private static instance: ChatService;
    private messageService: MessageService;
    private socketHandler: ChatSocketHandler;
    private currentRoom: string | null = null;

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

    // Room Management
    public setCurrentRoom(roomId: string | null) {
        this.currentRoom = roomId;
        this.socketHandler.setCurrentRoom(roomId);
    }

    public getCurrentRoom(): string | null {
        return this.currentRoom;
    }

    public async joinRoom(roomId: string) {
        try {
            this.messageService.clearMessages();
            await this.socketHandler.joinRoom(roomId);
            this.setCurrentRoom(roomId);
        } catch (error) {
            console.error('[CHAT_SERVICE] Error joining room:', error);
            ErrorHandler.handle(error);
        }
    }

    public requestRoomUpdate() {
        this.socketHandler.requestRooms();
    }

    // Message Management
    public async handleMessageSend(content: string, messageType: 'text' | 'gif' = 'text', gifUrl?: string): Promise<boolean> {
        if (!this.currentRoom) {
            console.error('[CHAT_SERVICE] No active room to send message to');
            return false;
        }
        return this.socketHandler.sendMessage(content, messageType, gifUrl);
    }

    public async markMessagesAsRead(roomId: string) {
        try {
            await HttpService.put(API_CONFIG.ENDPOINTS.CHAT.MARK_READ(roomId));
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    // Profile Management
    public async updateRoomProfileImage(
        roomId: string, 
        targetUserId: string, 
        imageData: string, 
        contentType: string
    ) {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.CHAT.UPDATE_PROFILE_IMAGE(roomId),
                {
                    targetUserId,
                    profileImage: {
                        data: imageData,
                        contentType
                    }
                }
            );
            if (response) {
                EventBus.publish(Constants.EVENTS.ROOM_UPDATED, { roomId });
            }
            return response;
        } catch (error) {
            ErrorHandler.handle(error);
            return null;
        }
    }

    // Event Handling
    private setupEventListeners() {
        EventBus.subscribe(Constants.EVENTS.SEND_MESSAGE, this.handleSendMessageEvent.bind(this));
        EventBus.subscribe(Constants.EVENTS.JOIN_ROOM, this.joinRoom.bind(this));
        EventBus.subscribe(Constants.EVENTS.ROOM_UPDATED, this.handleRoomUpdate.bind(this));
    }

    private async handleSendMessageEvent(data: { content: string }) {
        console.log('[CHAT_SERVICE] Received send message event:', data);
        if (data?.content) {
            await this.handleMessageSend(data.content);
        } else {
            console.error('[CHAT_SERVICE] Invalid message data:', data);
        }
    }

    private handleRoomUpdate(data: { roomId: string }) {
        if (data.roomId === this.currentRoom) {
            this.requestRoomUpdate();
        }
    }
}
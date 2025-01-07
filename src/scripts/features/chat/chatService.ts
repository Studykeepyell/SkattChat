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
    private static instance: ChatService;
    private socket: any;
    private messageService: MessageService;
    private uiService: ChatUIService;

    private constructor() {
        try {
            console.log('[CHAT_SERVICE] Initializing...');
            this.socket = SocketService.initialize();
            this.messageService = new MessageService();
            this.uiService = new ChatUIService();
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

    private setupEventListeners() {
        EventBus.subscribe(Constants.EVENTS.SEND_MESSAGE, this.sendMessage.bind(this));
        EventBus.subscribe(Constants.EVENTS.MESSAGE_RECEIVED, this.messageService.addChatMessage.bind(this.messageService));
        EventBus.subscribe(Constants.EVENTS.JOIN_ROOM, this.joinRoom.bind(this));
        
        if (this.socket) {
            this.socket.on('message', (data: any) => {
                EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, data);
            });
        }
    }

    async sendMessage(roomId: string, message: string) {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.CHAT.SEND,
                { roomId, message }
            );
            
            if (this.socket) {
                this.socket.emit('message', { roomId, message });
            }
            
            EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, response);
            return response;
        } catch (error) {
            ErrorHandler.handle(error);
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
            console.log('[CHAT_SERVICE] Joining room:', roomId);
            
            // Check authentication with both storage keys
            const token = StorageService.get('token') || StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
            const userId = StorageService.get('userId') || StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            console.log('[CHAT_SERVICE] Auth check:', { 
                token: !!token, 
                userId: userId,
                directUserId: StorageService.get('userId'),
                constantUserId: StorageService.get(Constants.STORAGE_KEYS.USER_ID)
            });

            if (!token || !userId) {
                throw new Error('User not authenticated');
            }

            // Get the full room ID without splitting
            const fullRoomId = roomId;
            console.log('[CHAT_SERVICE] Attempting to join room with data:', {
                roomId: fullRoomId,
                userId,
                hasToken: !!token
            });

            // Clear existing messages before joining new room
            this.messageService.clearMessages();
            this.uiService.clearMessages();

            // Join room via HTTP
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.CHAT.JOIN_ROOM(fullRoomId),
                { 
                    roomId: fullRoomId,
                    userId 
                }
            );

            console.log('[CHAT_SERVICE] Join response:', response);

            if (response.success) {
                // Store current room
                StorageService.set('currentRoom', fullRoomId);
                
                // Update UI first to show room change
                this.uiService.updateRoomDisplay(response.room);

                // Join room via socket
                if (this.socket) {
                    this.socket.emit('join_room', { roomId: fullRoomId });
                }

                // Display new messages
                if (response.messages && Array.isArray(response.messages)) {
                    console.log('[CHAT_SERVICE] Displaying messages:', response.messages.length);
                    response.messages.forEach((message: any) => {
                        this.messageService.addChatMessage(message);
                    });
                } else {
                    console.log('[CHAT_SERVICE] No messages to display');
                }
                
                return response.room;
            }
        } catch (error) {
            console.error('[CHAT_SERVICE] Error joining room:', error);
            ErrorHandler.handle(error);
        }
    }
}
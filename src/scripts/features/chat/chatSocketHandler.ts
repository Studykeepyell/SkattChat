import { SocketService } from '../../core/socketService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';
import { StorageService } from '../../core/storageService';

export class ChatSocketHandler {
    private static instance: ChatSocketHandler;
    private socket;
    private currentRoom: string | null = null;

    private constructor() {
        // Get auth data from storage
        const authData = JSON.parse(StorageService.get('authData') || '{}');
        const token = authData.token;
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID) || authData.userId;
        
        console.log('[CHAT_SOCKET] Auth data:', { token: !!token, userId });
        
        if (!token || !userId) {
            console.error('[CHAT_SOCKET] Missing authentication data', { hasToken: !!token, hasUserId: !!userId });
            // Redirect to login if not authenticated
            window.location.href = '/dist/pages/login.html';
            throw new Error('Authentication required');
        }

        // Initialize socket with auth data
        this.socket = SocketService.initialize(token);
        
        // Set user ID in socket query params
        this.socket.auth = { token, userId };
        
        this.initialize();
    }

    public static getInstance(): ChatSocketHandler {
        if (!ChatSocketHandler.instance) {
            ChatSocketHandler.instance = new ChatSocketHandler();
        }
        return ChatSocketHandler.instance;
    }

    initialize() {
        this.setupEventHandlers();
        this.requestInitialData();
    }

    private setupEventHandlers() {
        const handlers = {
            'message': this.handleMessage.bind(this),
            'roomUpdate': this.handleRoomUpdate.bind(this),
            'errorMessage': this.handleErrorMessage.bind(this),
            'connect': this.handleConnect.bind(this),
            'connect_error': this.handleError.bind(this),
            'roomList': this.handleRoomList.bind(this),
            'roomCreated': this.handleRoomCreated.bind(this)
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            this.socket.off(event);
            this.socket.on(event, handler);
        });
    }

    public setCurrentRoom(roomId: string | null) {
        this.currentRoom = roomId;
    }

    public getCurrentRoom(): string | null {
        return this.currentRoom;
    }

    public async sendMessage(content: string): Promise<boolean> {
        try {
            if (!content.trim()) {
                console.log('[CHAT_SOCKET] Cannot send empty message');
                return false;
            }

            if (!this.currentRoom) {
                console.log('[CHAT_SOCKET] No room selected');
                return false;
            }

            // Get user info from storage
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            const userProfile = JSON.parse(StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || '{}');
            const username = userProfile.username;

            if (!userId || !username) {
                console.error('[CHAT_SOCKET] User info not found');
                return false;
            }

            const messageData = {
                roomId: this.currentRoom,
                userId,
                username,
                message: content,
                timestamp: new Date().toISOString()
            };

            console.log('[CHAT_SOCKET] Sending message:', messageData);
            this.socket.emit('message', messageData);
            return true;

        } catch (error) {
            console.error('[CHAT_SOCKET] Error sending message:', error);
            ErrorHandler.handle(error);
            return false;
        }
    }

    public async joinRoom(roomId: string) {
        try {
            console.log('[CHAT_SOCKET] Joining room:', roomId);
            
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            if (!userId) {
                throw new Error('User not authenticated');
            }

            this.setCurrentRoom(roomId);
            StorageService.set('currentRoom', roomId);
            this.socket.emit('joinRoom', { roomId });

        } catch (error) {
            console.error('[CHAT_SOCKET] Error joining room:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleMessage(data: any) {
        try {
            console.log('[CHAT_SOCKET] Received message:', data);
            EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, {
                ...data,
                sender: data.username
            });
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling message:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleRoomUpdate(data: any) {
        try {
            console.log('[CHAT_SOCKET] Room update:', data);
            EventBus.publish(Constants.EVENTS.ROOM_CHANGED, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleErrorMessage(error: any) {
        console.error('[CHAT_SOCKET] Socket error:', error);
        ErrorHandler.handle(new Error(error.error));
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
        this.requestRooms();
    }

    public createRoom(name: string) {
        this.socket.emit('createRoom', { name });
    }

    public requestRooms() {
        console.log('[CHAT_SOCKET] Requesting rooms');
        this.socket.emit('requestRooms');
    }

    private handleRoomList(rooms: any[]) {
        try {
            console.log('[CHAT_SOCKET] Received room list:', rooms);
            EventBus.publish(Constants.EVENTS.ROOMS_UPDATED, rooms);
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling room list:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleRoomCreated(room: any) {
        console.log('[CHAT_SOCKET] Room created:', room);
        EventBus.publish(Constants.EVENTS.ROOM_CREATED, room);
    }
} 
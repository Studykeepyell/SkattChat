import { SocketService } from '../../../core/socketService';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { ErrorHandler } from '../../../core/errorHandler';
import { StorageService } from '../../../core/storageService';
import { ChatMessage, ChatRoom } from '../types';
import { Socket } from 'socket.io-client';
import { HttpService } from '../../../core/httpService';

export class ChatSocketHandler {
    private static instance: ChatSocketHandler;
    private socket: Socket | null = null;
    private currentRoom: string | null = null;

    private constructor() {
        // Get auth data from storage
        const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        
        console.log('[CHAT_SOCKET] Auth data:', { token: !!token, userId });
        
        if (!token || !userId) {
            console.error('[CHAT_SOCKET] Missing authentication data', { hasToken: !!token, hasUserId: !!userId });
            window.location.href = '/pages/login.html';
            throw new Error('Authentication required');
        }

        // Remove Bearer prefix if present
        const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
        console.log('[CHAT_SOCKET] Token cleaned:', { 
            originalLength: token.length,
            cleanedLength: cleanToken.length,
            hasBearer: token.startsWith('Bearer')
        });

        // Initialize socket with auth data
        this.socket = SocketService.initialize(cleanToken);
        
        if (!this.socket) {
            throw new Error('Failed to initialize socket');
        }
        
        // Set auth data in socket with clean token
        this.socket.auth = { token: cleanToken, userId };
        
        // Set up token refresh handling
        this.socket.on('connect_error', async (error) => {
            console.log('[CHAT_SOCKET] Connection error:', error);
            
            if (error.message === 'Authentication failed' || error.message.includes('jwt expired')) {
                try {
                    // Try to refresh the token
                    const response = await HttpService.post('/api/auth/refresh-token', {
                        refreshToken: StorageService.get('refreshToken')
                    });

                    if (response.success && response.accessToken) {
                        // Update token in storage and socket
                        const newToken = response.accessToken;
                        StorageService.set(Constants.STORAGE_KEYS.AUTH_TOKEN, `Bearer ${newToken}`);
                        
                        // Clean and set the new token
                        const cleanNewToken = newToken.replace(/^Bearer\s+/i, '').trim();
                        
                        if (this.socket && this.socket.auth && typeof this.socket.auth === 'object') {
                            (this.socket.auth as { token: string }).token = cleanNewToken;
                            
                            // Reconnect socket with new token
                            this.socket.connect();
                        } else {
                            throw new Error('Socket or auth not properly initialized');
                        }
                    } else {
                        // If refresh failed, redirect to login
                        console.error('[CHAT_SOCKET] Token refresh failed');
                        this.redirectToLogin();
                    }
                } catch (refreshError) {
                    console.error('[CHAT_SOCKET] Error refreshing token:', refreshError);
                    this.redirectToLogin();
                }
            }
        });
        
        this.initialize();
    }

    private redirectToLogin() {
        // Clear all auth data
        StorageService.remove(Constants.STORAGE_KEYS.AUTH_TOKEN);
        StorageService.remove(Constants.STORAGE_KEYS.USER_ID);
        StorageService.remove('refreshToken');
        StorageService.remove('authData');
        StorageService.remove('currentRoom');
        
        // Redirect to login page
        window.location.href = '/pages/login.html';
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

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (this.currentRoom && this.socket) {
                const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
                if (userId) {
                    // Emit leave room event before page unload
                    this.socket.emit('leaveRoom', { roomId: this.currentRoom, userId });
                }
                this.leaveRoom(this.currentRoom);
            }
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.currentRoom) {
                const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
                if (userId && this.socket) {
                    this.socket.emit('leaveRoom', { roomId: this.currentRoom, userId });
                }
            } else if (document.visibilityState === 'visible' && this.currentRoom) {
                const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
                if (userId && this.socket) {
                    this.socket.emit('joinRoom', { roomId: this.currentRoom, userId });
                }
            }
        });
    }

    private setupEventHandlers() {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        const handlers = {
            'message': this.handleMessage.bind(this),
            'roomUpdate': this.handleRoomUpdate.bind(this),
            'errorMessage': this.handleErrorMessage.bind(this),
            'connect': this.handleConnect.bind(this),
            'connect_error': this.handleError.bind(this),
            'roomList': this.handleRoomList.bind(this),
            'roomCreated': this.handleRoomCreated.bind(this),
            'messageHistory': this.handleMessageHistory.bind(this),
            'userJoined': this.handleUserJoined.bind(this),
            'userLeft': this.handleUserLeft.bind(this),
            'userDisconnected': this.handleUserLeft.bind(this),
            'disconnect': this.handleDisconnect.bind(this)
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            this.socket?.off(event);
            this.socket?.on(event, handler);
        });
    }

    public setCurrentRoom(roomId: string | null) {
        this.currentRoom = roomId;
    }

    public getCurrentRoom(): string | null {
        return this.currentRoom;
    }

    public async sendMessage(content: string, messageType: 'text' | 'gif' = 'text', gifUrl?: string): Promise<boolean> {
        try {
            if (messageType === 'text' && !content.trim()) {
                console.log('[CHAT_SOCKET] Cannot send empty message');
                return false;
            }

            if (!this.currentRoom) {
                console.error('[CHAT_SOCKET] No room selected');
                ErrorHandler.handle(new Error('Please select a chat room first'));
                return false;
            }

            if (!this.socket?.connected) {
                console.error('[CHAT_SOCKET] Socket not connected');
                ErrorHandler.handle(new Error('Connection lost. Please refresh the page.'));
                return false;
            }

            // Get user info from multiple possible sources
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            let username = '';

            // Try getting username from different storage locations
            const userProfile = StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE);
            const authData = StorageService.get('authData');
            const directUsername = StorageService.get('username');

            try {
                if (userProfile) {
                    username = JSON.parse(userProfile).username;
                }
            } catch (e) {
                console.log('[CHAT_SOCKET] Error parsing user profile:', e);
            }

            if (!username && authData) {
                try {
                    username = JSON.parse(authData).username;
                } catch (e) {
                    console.log('[CHAT_SOCKET] Error parsing auth data:', e);
                }
            }

            if (!username) {
                username = directUsername || '';
            }

            if (!userId || !username) {
                const error = new Error('User information not found. Please try logging in again.');
                console.error('[CHAT_SOCKET] User info not found. UserId:', userId, 'Username:', username);
                ErrorHandler.handle(error);
                return false;
            }

            const messageData: ChatMessage = {
                username,
                userId,
                message: content,
                timestamp: new Date().toISOString(),
                messageType,
                ...(messageType === 'gif' ? { gifUrl } : {})
            };

            console.log('[CHAT_SOCKET] Sending message:', messageData);
            
            return new Promise((resolve) => {
                if (!this.socket) {
                    ErrorHandler.handle(new Error('Socket not initialized'));
                    resolve(false);
                    return;
                }

                this.socket.emit('message', { ...messageData, roomId: this.currentRoom }, (error: any) => {
                    if (error) {
                        console.error('[CHAT_SOCKET] Error sending message:', error);
                        ErrorHandler.handle(new Error(error.message || 'Failed to send message'));
                        resolve(false);
                    } else {
                        // Publish message locally for immediate UI update
                        EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, messageData);
                        resolve(true);
                    }
                });
            });

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

            if (!this.socket) {
                throw new Error('Socket not initialized');
            }

            // If we're in a room already, leave it first
            if (this.currentRoom) {
                await this.leaveRoom(this.currentRoom);
            }

            this.setCurrentRoom(roomId);
            StorageService.set('currentRoom', roomId);
            this.socket.emit('joinRoom', { roomId, userId });

        } catch (error) {
            console.error('[CHAT_SOCKET] Error joining room:', error);
            ErrorHandler.handle(error);
        }
    }

    public async leaveRoom(roomId: string) {
        try {
            console.log('[CHAT_SOCKET] Leaving room:', roomId);
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            if (this.socket && userId) {
                this.socket.emit('leaveRoom', { roomId, userId });
                this.setCurrentRoom(null);
                StorageService.remove('currentRoom');
            }
        } catch (error) {
            console.error('[CHAT_SOCKET] Error leaving room:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleMessage(message: ChatMessage & { shouldNotify?: boolean }) {
        try {
            console.log('[CHAT_SOCKET] Received message:', message);
            
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            
            // Only process notifications if the message is from someone else
            if (message.userId !== currentUserId) {
                console.log('[CHAT_SOCKET] Processing notification for message:', message);

                // Find the room element regardless of current room
                const roomElement = document.querySelector(`[data-room-id="${message.roomId}"]`);
                
                // If we have this room in our list
                if (roomElement) {
                    // Play notification sound
                    console.log('[CHAT_SOCKET] Playing notification sound');
                    const audio = new Audio('C:/Users/skyji/Skattchat/electron/dist/assets/skattchat.promot.guitar.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(err => {
                        console.error('[CHAT_SOCKET] Error playing notification:', err);
                        const fallbackAudio = new Audio('/assets/skattchat.promot.guitar.mp3');
                        fallbackAudio.volume = 0.5;
                        fallbackAudio.play().catch(err2 => 
                            console.error('[CHAT_SOCKET] Error playing fallback notification:', err2)
                        );
                    });

                    // Add visual notification if not in the room
                    if (message.roomId !== this.currentRoom) {
                        console.log('[CHAT_SOCKET] Adding visual notification for room:', message.roomId);
                        if (!roomElement.classList.contains('active')) {
                            roomElement.classList.remove('new-message'); // Remove if exists
                            void (roomElement as HTMLElement).offsetWidth; // Trigger reflow
                            roomElement.classList.add('new-message');
                        }
                    }
                }
            }
            
            EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, message);
            
            // Update room's last message time
            const updateData = {
                roomId: message.roomId,
                lastMessageTime: new Date().toISOString(),
                lastMessage: message
            };
            EventBus.publish(Constants.EVENTS.ROOM_UPDATED, updateData);
            
            // Request updated room list to refresh timestamps
            this.requestRooms();
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling message:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleRoomUpdate(room: ChatRoom) {
        try {
            console.log('[CHAT_SOCKET] Room update:', room);
            // Only update lastMessageTime if there's a new message
            if (typeof room.lastMessage === 'object' && room.lastMessage?.timestamp) {
                room.lastMessageTime = room.lastMessage.timestamp;
            }
            EventBus.publish(Constants.EVENTS.ROOM_CHANGED, room);
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
        if (error.message === 'Authentication failed' || error.message.includes('jwt expired')) {
            this.redirectToLogin();
        } else {
            ErrorHandler.handle(error);
        }
    }

    private requestInitialData() {
        this.requestRooms();
    }

    public createRoom(name: string) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        this.socket.emit('createRoom', { name });
    }

    public requestRooms() {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        console.log('[CHAT_SOCKET] Requesting rooms');
        this.socket.emit('requestRooms');
    }

    private handleRoomList(rooms: ChatRoom[]) {
        try {
            console.log('[CHAT_SOCKET] Received room list:', rooms);
            // Ensure each room has lastMessageTime set from either lastMessage object or string
            const updatedRooms = rooms.map(room => {
                if (!room.lastMessageTime) {
                    // Handle case where lastMessage is a timestamp string
                    if (typeof room.lastMessage === 'string') {
                        return { ...room, lastMessageTime: room.lastMessage };
                    }
                    // Handle case where lastMessage is an object with timestamp
                    else if (room.lastMessage?.timestamp) {
                        return { ...room, lastMessageTime: room.lastMessage.timestamp };
                    }
                    // Fallback to updatedAt if available
                    else if (room.updatedAt) {
                        return { ...room, lastMessageTime: room.updatedAt };
                    }
                }
                return room;
            });
            EventBus.publish(Constants.EVENTS.ROOMS_UPDATED, updatedRooms);
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling room list:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleRoomCreated(room: ChatRoom) {
        console.log('[CHAT_SOCKET] Room created:', room);
        EventBus.publish(Constants.EVENTS.ROOM_CREATED, room);
    }

    private handleMessageHistory(messages: ChatMessage[]) {
        try {
            console.log('[CHAT_SOCKET] Received message history:', messages);
            if (!Array.isArray(messages)) {
                console.error('[CHAT_SOCKET] Expected array of messages but got:', typeof messages);
                return;
            }
            console.log('[CHAT_SOCKET] Publishing message history to UI:', messages);
            EventBus.publish(Constants.EVENTS.MESSAGES_LOADED, messages);
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling message history:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleUserJoined(data: { userId: string, timestamp: string, activeUsers: string[] }) {
        try {
            console.log('[CHAT_SOCKET] User joined:', data);
            // Only emit user joined event for participant count
            EventBus.publish(Constants.EVENTS.USER_JOINED_ROOM, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleUserLeft(data: { userId: string, timestamp: string }) {
        try {
            console.log('[CHAT_SOCKET] User left/disconnected:', data);
            // Always emit since the server only sends events for the current room
            EventBus.publish(Constants.EVENTS.USER_LEFT_ROOM, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleDisconnect = () => {
        console.log('[CHAT_SOCKET] Disconnected from server');
        if (this.currentRoom) {
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            // Emit user left event when disconnected
            this.handleUserLeft({
                userId: userId || '',
                timestamp: new Date().toISOString()
            });
            // Also emit leaveRoom event
            if (userId && this.socket) {
                this.socket.emit('leaveRoom', { roomId: this.currentRoom, userId });
            }
        }
    };
} 
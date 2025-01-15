import { SocketService } from '../../../core/socketService';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { ErrorHandler } from '../../../core/errorHandler';
import { StorageService } from '../../../core/storageService';
import { ChatMessage, ChatRoom } from '../types';
import { Socket } from 'socket.io-client';

export class ChatSocketHandler {
    private static instance: ChatSocketHandler;
    private socket: Socket | null = null;
    private currentRoom: string | null = null;

    private constructor() {
        // Get auth data from storage with proper parsing
        const authData = StorageService.get('authData', true) || {};
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
        
        if (!this.socket) {
            throw new Error('Failed to initialize socket');
        }
        
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
            'messageHistory': this.handleMessageHistory.bind(this)
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

            this.setCurrentRoom(roomId);
            StorageService.set('currentRoom', roomId);
            this.socket.emit('joinRoom', { roomId });

        } catch (error) {
            console.error('[CHAT_SOCKET] Error joining room:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleMessage(message: ChatMessage) {
        try {
            console.log('[CHAT_SOCKET] Received message:', message);
            EventBus.publish(Constants.EVENTS.MESSAGE_RECEIVED, message);
            
            // Update room's last message time
            if (this.currentRoom) {
                const updateData = {
                    roomId: this.currentRoom,
                    lastMessageTime: new Date().toISOString(),
                    lastMessage: message
                };
                EventBus.publish(Constants.EVENTS.ROOM_UPDATED, updateData);
            }
            
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
            if (!room.lastMessageTime && typeof room.lastMessage === 'object' && room.lastMessage?.timestamp) {
                room.lastMessageTime = room.lastMessage.timestamp;
            }
            EventBus.publish(Constants.EVENTS.ROOM_CHANGED, { roomId: room._id || room.roomId });
            // Also update room list to reflect changes
            this.requestRooms();
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
} 
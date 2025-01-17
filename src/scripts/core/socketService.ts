import { io, Socket, ManagerOptions } from 'socket.io-client';
import { Constants } from './constants';
import { API_CONFIG } from './api.config';
import { ErrorHandler } from './errorHandler';
import { Transport } from 'engine.io-client';

interface SocketOptions {
    auth?: {
        token: string;
        userId?: string;
    };
    transports?: string[];
    autoConnect?: boolean;
}

interface TransportError {
    message: string;
    type: string;
    description?: any;
}

export class SocketService {
    private static socket: Socket | null = null;
    private static connectionAttempts = 0;
    private static readonly MAX_RECONNECTION_ATTEMPTS = 5;
    private static currentTransportType: string | null = null;

    static initialize(token?: string) {
        try {
            if (!this.socket) {
                const userId = localStorage.getItem(Constants.STORAGE_KEYS.USER_ID);
                const storedToken = token || localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
                
                console.log('[SOCKET] Initializing socket service:', {
                    hasToken: !!storedToken,
                    hasUserId: !!userId,
                    url: API_CONFIG.SOCKET_URL,
                    env: process.env.NODE_ENV
                });

                const options: Partial<ManagerOptions & SocketOptions> = {
                    transports: ['polling', 'websocket'],
                    autoConnect: true,
                    reconnection: true,
                    reconnectionAttempts: this.MAX_RECONNECTION_ATTEMPTS,
                    reconnectionDelay: 1000,
                    timeout: 20000,
                    path: '/socket.io/',
                    withCredentials: true,
                    forceNew: true
                };

                if (storedToken && userId) {
                    // Clean token if it hasn't been cleaned already
                    const cleanToken = storedToken.startsWith('Bearer ') 
                        ? storedToken.replace(/^Bearer\s+/i, '').trim()
                        : storedToken;

                    options.auth = { token: cleanToken, userId };
                    console.log('[SOCKET] Setting auth data:', {
                        tokenLength: cleanToken.length,
                        userId,
                        tokenPrefix: cleanToken.substring(0, 10) + '...'
                    });
                } else {
                    console.warn('[SOCKET] Missing auth data:', { 
                        hasToken: !!storedToken, 
                        hasUserId: !!userId 
                    });
                }

                console.log('[SOCKET] Creating socket with options:', {
                    ...options,
                    auth: options.auth ? {
                        hasToken: !!options.auth.token,
                        hasUserId: !!options.auth.userId
                    } : 'missing'
                });

                this.socket = io(API_CONFIG.SOCKET_URL, options);
                this.setupBaseHandlers();
            }
            return this.socket;
        } catch (error) {
            console.error('[SOCKET] Error initializing socket:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    static getSocket(): Socket | null {
        return this.socket;
    }

    private static setupBaseHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected successfully:', {
                id: this.socket?.id,
                connected: this.socket?.connected,
                transport: this.socket?.io?.engine?.transport?.name
            });
            this.connectionAttempts = 0;
            this.currentTransportType = this.socket?.io?.engine?.transport?.name || null;
        });

        this.socket?.io?.engine?.on?.('error', (err: string | Error) => {
            console.error('Transport error:', {
                error: err,
                currentTransport: this.currentTransportType,
                fallbackAvailable: this.socket?.io?.engine?.transport?.name !== 'polling'
            });
        });

        this.socket?.io?.engine?.on?.('upgrade', (transport: Transport) => {
            console.log('Transport upgraded:', {
                from: this.currentTransportType,
                to: transport.name
            });
            this.currentTransportType = transport.name;
        });

        this.socket.on('connect_error', (error) => {
            this.connectionAttempts++;
            console.error('Socket connection error:', {
                error,
                attempt: this.connectionAttempts,
                maxAttempts: this.MAX_RECONNECTION_ATTEMPTS,
                transport: this.currentTransportType
            });
            
            if (this.connectionAttempts >= this.MAX_RECONNECTION_ATTEMPTS) {
                console.error('Max reconnection attempts reached, stopping reconnection');
                this.socket?.close();
            }
            
            ErrorHandler.handle(error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', {
                reason,
                wasConnected: this.socket?.connected,
                attempts: this.connectionAttempts,
                lastTransport: this.currentTransportType
            });
            this.currentTransportType = null;
        });

        this.socket.on('error', (error: Error) => {
            console.error('Socket error:', {
                error,
                wasConnected: this.socket?.connected,
                attempts: this.connectionAttempts,
                transport: this.currentTransportType
            });
            ErrorHandler.handle(error);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('Socket reconnection attempt:', {
                attemptNumber,
                currentTransport: this.currentTransportType
            });
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', {
                error,
                currentTransport: this.currentTransportType
            });
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed', {
                lastTransport: this.currentTransportType
            });
        });
    }

    static emit(event: string, data: any) {
        if (!this.socket) {
            console.error('Attempted to emit event without socket:', event);
            throw new Error('Socket not initialized');
        }
        console.log('Emitting socket event:', { 
            event, 
            hasData: !!data,
            transport: this.currentTransportType
        });
        this.socket.emit(event, data);
    }

    static on(event: string, callback: (data: any) => void) {
        if (!this.socket) {
            console.error('Attempted to listen to event without socket:', event);
            throw new Error('Socket not initialized');
        }
        console.log('Registering socket event listener:', {
            event,
            transport: this.currentTransportType
        });
        this.socket.on(event, callback);
    }

    static disconnect() {
        if (this.socket) {
            console.log('Disconnecting socket:', {
                id: this.socket.id,
                wasConnected: this.socket.connected,
                lastTransport: this.currentTransportType
            });
            this.socket.disconnect();
            this.socket = null;
            this.connectionAttempts = 0;
            this.currentTransportType = null;
        }
    }
} 
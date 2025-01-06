import { io, Socket, ManagerOptions } from 'socket.io-client';
import { Constants } from './constants';
import { API_CONFIG } from './api.config';
import { ErrorHandler } from './errorHandler';

interface SocketOptions {
    auth?: {
        token: string;
    };
    transports?: string[];
    autoConnect?: boolean;
}

export class SocketService {
    private static socket: Socket | null = null;

    static initialize(token?: string) {
        if (!this.socket) {
            const options: Partial<ManagerOptions & SocketOptions> = {
                transports: ['websocket'],
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: Constants.TIMEOUTS.SOCKET_RECONNECT
            };

            if (token) {
                options.auth = { token };
            }

            this.socket = io(API_CONFIG.SOCKET_URL, options);
            this.setupBaseHandlers();
        }
        return this.socket;
    }

    private static setupBaseHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error: Error) => {
            ErrorHandler.handle(error);
        });
    }

    static emit(event: string, data: any) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        this.socket.emit(event, data);
    }

    static on(event: string, callback: (data: any) => void) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }
        this.socket.on(event, callback);
    }

    static disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
} 
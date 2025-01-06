import { io, Socket } from 'socket.io-client';
import { Constants } from './constants.js';

export class SocketService {
    private static instance: Socket;

    static initialize(): Socket {
        if (!this.instance) {
            this.instance = io({
                reconnection: true,
                reconnectionAttempts: Constants.TIMEOUTS.SOCKET_RECONNECT,
                auth: {
                    token: localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN)
                }
            });

            this.setupBaseHandlers();
        }
        return this.instance;
    }

    private static setupBaseHandlers() {
        this.instance.on('connect', () => {
            console.log('Socket connected successfully');
            this.instance.emit('authenticate', {
                token: localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN),
                userId: localStorage.getItem(Constants.STORAGE_KEYS.USER_ID)
            });
        });

        this.instance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    static getInstance(): Socket {
        if (!this.instance) {
            return this.initialize();
        }
        return this.instance;
    }
} 
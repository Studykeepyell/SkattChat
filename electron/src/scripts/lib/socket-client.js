import { io as socketIO } from 'socket.io-client';

export function createSocket(url, options = {}) {
    try {
        return socketIO(url, {
            transports: ['websocket'],
            withCredentials: true,
            ...options
        });
    } catch (error) {
        console.error('Failed to create socket connection:', error);
        throw error;
    }
}
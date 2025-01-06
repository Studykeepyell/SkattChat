// Base API configuration used throughout the application
export const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    SOCKET_URL: 'http://localhost:3000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout'
        },
        CHAT: {
            SEND: '/api/chat/send',
            MESSAGES: (roomId: string) => `/api/chat/messages/${roomId}`,
            ROOMS: '/api/chat/rooms',
            MARK_READ: (roomId: string) => `/api/chat/rooms/${roomId}/read`
        },
        FRIEND_REQUESTS: {
            SEND: '/api/friends/requests/send',
            ACCEPT: '/api/friends/requests/accept',
            REJECT: '/api/friends/requests/reject',
            LIST: '/api/friends/requests'
        },
        USER: {
            PROFILE: '/api/users/profile',
            UPDATE: '/api/users/update'
        }
    },
    HEADERS: {
        'Content-Type': 'application/json'
    },
    SOCKET: {
        EVENTS: {
            CONNECT: 'connect',
            DISCONNECT: 'disconnect',
            MESSAGE: 'message',
            JOIN_ROOM: 'join_room',
            LEAVE_ROOM: 'leave_room'
        }
    }
}; 
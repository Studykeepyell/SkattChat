// Base API configuration used throughout the application
export const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    SOCKET_URL: 'http://localhost:3000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout',
            VERIFY: '/api/auth/verify'
        },
        CHAT: {
            SEND: '/api/chat/send',
            MESSAGES: (roomId: string) => `/api/chat/messages/${roomId}`,
            ROOMS: '/api/chat/rooms',
            JOIN_ROOM: (roomId: string) => `/api/chat/rooms/${roomId}/join`,
            MARK_READ: (roomId: string) => `/api/chat/rooms/${roomId}/read`
        },
        FRIEND_REQUESTS: {
            SEND: '/api/friends/requests/send',
            ACCEPT: '/api/friends/requests/accept',
            REJECT: '/api/friends/requests/reject',
            LIST: '/api/friends/requests',
            FRIENDS: (userId: string) => `/api/friends/${userId}/list`
        },
        USER: {
            PROFILE: '/api/users/profile',
            UPDATE: '/api/users/update'
        }
    },
    HEADERS: {
        'Content-Type': 'application/json'
    }
}; 
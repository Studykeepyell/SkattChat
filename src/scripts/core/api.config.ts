// Base API configuration used throughout the application
export const API_CONFIG = {
    BASE_URL: process.env.API_URL || 'http://localhost:3000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout',
            VERIFY: '/api/auth/verify'
        },
        CHAT: {
            SEND: '/api/chat/send',
            FETCH_MESSAGES: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
            FETCH_ROOMS: '/api/chat/rooms',
            MARK_READ: (roomId: string) => `/api/chat/rooms/${roomId}/read`,
            JOIN_ROOM: (roomId: string) => `/api/chat/rooms/${roomId}/join`,
            UPDATE_PROFILE_IMAGE: (roomId: string) => `/api/chat/rooms/${roomId}/profile-image`,
            CREATE_ROOM: '/api/chat/rooms/create'
        },
        FRIEND_REQUESTS: {
            SEND: '/api/friends/requests/send',
            ACCEPT: '/api/friends/requests/accept',
            DECLINE: '/api/friends/requests/decline',
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
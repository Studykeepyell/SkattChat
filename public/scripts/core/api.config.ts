// Base API configuration used throughout the application
export const API_CONFIG = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout'
        },
        CHAT: {
            SEND: '/api/chat/send',
            MESSAGES: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
            ROOMS: '/api/chat/rooms',
            MARK_READ: (roomId: string) => `/api/chat/rooms/${roomId}/read`
        },
        FRIEND_REQUESTS: {
            // Match backend routes exactly
            SEND: (receiverId: string) => `/api/friendRequests/send/${receiverId}`,
            RESPOND: '/api/friendRequests/respond',
            PENDING: (userId: string) => `/api/friendRequests/requests/${userId}`,
            FRIENDS: (userId: string) => `/api/friendRequests/friends/${userId}`,
            ROOMS: (userId: string) => `/api/friendRequests/rooms/${userId}`
        },
        USER: {
            PROFILE: '/api/users/profile'
        }
    },
    HEADERS: {
        JSON: { 'Content-Type': 'application/json' }
    },
    SOCKET: {
        EVENTS: {
            CONNECT: 'connect',
            DISCONNECT: 'disconnect',
            MESSAGE: 'message',
            JOIN_ROOM: 'joinRoom',
            ROOM_UPDATE: 'roomUpdate',
            ROOM_LIST: 'roomList',
            REQUEST_ROOMS: 'requestRooms',
            FRIEND_REQUEST_RECEIVED: 'friendRequestReceived',
            FRIEND_REQUEST_ACCEPTED: 'friendRequestAccepted',
            FRIEND_LIST_UPDATED: 'friendListUpdated'
        }
    }
}; 
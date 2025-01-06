// Application-wide constants
export const Constants = {
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_ID: 'user_id',
        USER_PROFILE: 'user_profile'
    },
    EVENTS: {
        AUTH_CHANGE: 'auth:change',
        MESSAGE_RECEIVED: 'message:received',
        FRIEND_REQUEST: 'friend:request',
        ROOM_CREATED: 'room:created',
        ROOM_UPDATED: 'room:updated',
        ROOMS_UPDATED: 'rooms:updated',
        FRIEND_REQUEST_SENT: 'friend:request:sent',
        FRIEND_REQUEST_RECEIVED: 'friend:request:received',
        FRIEND_REQUEST_ACCEPTED: 'friend:request:accepted',
        FRIEND_REQUEST_RESPONDED: 'friend:request:responded',
        FRIEND_LIST_UPDATED: 'friend:list:updated',
        SEND_MESSAGE: 'send:message',
        PROFILE_UPDATE: 'profile:update'
    },
    TIMEOUTS: {
        API_REQUEST: 30000,
        SOCKET_RECONNECT: 5000
    }
}; 
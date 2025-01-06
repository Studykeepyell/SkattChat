// Application-wide constants
export const Constants = {
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_ID: 'userId',
        USER_PROFILE: 'userProfile'
    },
    EVENTS: {
        AUTH_CHANGE: 'authStateChanged',
        MESSAGE_RECEIVED: 'messageReceived',
        FRIEND_REQUEST: 'friendRequest',
        ROOM_CREATED: 'roomCreated',
        ROOM_UPDATED: 'roomUpdated',
        ROOMS_UPDATED: 'roomsUpdated',
        FRIEND_REQUEST_SENT: 'friendRequestSent',
        FRIEND_REQUEST_RECEIVED: 'friendRequestReceived',
        FRIEND_REQUEST_ACCEPTED: 'friendRequestAccepted',
        FRIEND_REQUEST_RESPONDED: 'friendRequestResponded',
        FRIEND_LIST_UPDATED: 'friendListUpdated',
        SEND_MESSAGE: 'sendMessage'
    },
    TIMEOUTS: {
        API_REQUEST: 30000,
        SOCKET_RECONNECT: 5000
    }
}; 
// Application-wide constants
export const Constants = {
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_ID: 'user_id',
        USER_PROFILE: 'user_profile'
    },
    EVENTS: {
        // Auth Events
        AUTH_CHANGE: 'authChange',
        LOGIN_SUCCESS: 'loginSuccess',
        LOGIN_FAILED: 'loginFailed',
        LOGOUT: 'logout',
        PROFILE_UPDATE: 'profileUpdate',
        PROFILE_IMAGE_UPDATED: 'profileImageUpdated',
        
        // Chat Events
        MESSAGE_RECEIVED: 'messageReceived',
        MESSAGES_LOADED: 'messagesLoaded',
        MESSAGES_CLEARED: 'messagesCleared',
        JOIN_ROOM: 'joinRoom',
        LEAVE_ROOM: 'leaveRoom',
        ROOM_JOINED: 'roomJoined',
        ROOM_LEFT: 'roomLeft',
        ROOM_UPDATED: 'roomUpdated',
        UPDATE_ROOM_PROFILE: 'updateRoomProfile',
        
        // Socket Events
        CONNECT: 'socket:connect',
        DISCONNECT: 'socket:disconnect',
        CONNECT_ERROR: 'socket:connect_error',
        
        // Friend Events
        FRIEND_REQUEST: 'friend:request',
        FRIEND_REQUEST_ACCEPTED: 'friend:request:accepted',
        FRIEND_REQUEST_REJECTED: 'friend:request:rejected',
        FRIEND_LIST_UPDATE: 'friend:list:update',
        FRIEND_REMOVED: 'friend:removed',
        
        // UI Events
        SHOW_NOTIFICATION: 'ui:show_notification',
        HIDE_NOTIFICATION: 'ui:hide_notification',
        SHOW_MODAL: 'ui:show_modal',
        HIDE_MODAL: 'ui:hide_modal',
        UPDATE_UI: 'ui:update',
        
        // Room Events
        ROOM_CHANGED: 'ROOM_CHANGED',
        ROOMS_UPDATED: 'roomsUpdated',
        ROOM_CREATED: 'roomCreated',
        
        // Message Events
        MESSAGE_SENT: 'message:sent',
        SEND_MESSAGE: 'message:send'
    },
    TIMEOUTS: {
        API_REQUEST: 30000,
        SOCKET_RECONNECT: 5000
    }
}; 
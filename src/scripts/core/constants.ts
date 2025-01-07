// Application-wide constants
export const Constants = {
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_ID: 'user_id',
        USER_PROFILE: 'user_profile'
    },
    EVENTS: {
        // Auth Events
        AUTH_CHANGE: 'auth:change',
        LOGIN_SUCCESS: 'login:success',
        LOGIN_FAILED: 'login:failed',
        LOGOUT: 'logout',
        PROFILE_UPDATE: 'auth:profile_update',
        
        // Chat Events
        SEND_MESSAGE: 'chat:send_message',
        MESSAGE_RECEIVED: 'chat:message_received',
        JOIN_ROOM: 'chat:join_room',
        LEAVE_ROOM: 'chat:leave_room',
        ROOM_CREATED: 'chat:room_created',
        ROOM_UPDATED: 'chat:room_updated',
        ROOMS_UPDATED: 'chat:rooms_updated',
        REQUEST_ROOMS: 'chat:request_rooms',
        ROOM_LIST: 'chat:room_list',
        
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
        UPDATE_UI: 'ui:update'
    },
    TIMEOUTS: {
        API_REQUEST: 30000,
        SOCKET_RECONNECT: 5000
    }
}; 
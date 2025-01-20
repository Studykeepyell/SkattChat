// Application-wide constants
export const Constants = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://skattchat.online' 
        : 'http://localhost:3001',
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_ID: 'userId',
        USER_PROFILE: 'userProfile',
        USERNAME: 'username',
        REFRESH_TOKEN: 'refreshToken'
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
        USER_JOINED_ROOM: 'userJoinedRoom',
        USER_LEFT_ROOM: 'userLeftRoom',
        
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
        SEND_MESSAGE: 'message:send',
        
        // Video Call Events
        LOCAL_STREAM_READY: 'local-stream-ready',
        MIC_TOGGLE: 'mic-toggle',
        VIDEO_TOGGLE: 'video-toggle',
        
        // Theme Events
        THEME_CHANGE: 'themeChange'
    },
    TIMEOUTS: {
        API_REQUEST: 30000,
        SOCKET_RECONNECT: 5000
    },
    ENDPOINTS: {
        ROOM: {
            PROFILE_IMAGE: (roomId: string) => `/api/files/rooms/${roomId}/profile-image`
        }
    }
}; 
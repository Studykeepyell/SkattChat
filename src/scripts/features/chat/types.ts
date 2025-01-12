export interface ChatMessage {
    username: string;
    userId: string;
    message: string;
    timestamp: string;
    sender?: string;
    content?: string;
}

export interface ChatRoom {
    _id?: string;
    roomId?: string;
    name?: string;
    roomName?: string;
    isPrivate?: boolean;
    participants?: Array<{
        username: string;
        avatar?: string;
    }>;
    activeUsers?: Array<any>;
    lastMessageTime?: string;
    updatedAt: string;
}

export interface ChatParticipant {
    username: string;
    avatar?: string;
}

export interface MessageData {
    username: string;
    userId: string;
    content: string;
    timestamp: string;
}

export interface RoomDisplayData {
    displayName: string;
    roomId: string;
    profileImage: string;
    lastActivity?: string;
} 
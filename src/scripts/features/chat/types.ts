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
    participants?: ChatParticipant[];
    activeUsers?: Array<any>;
    lastMessageTime?: string;
    updatedAt: string;
}

export interface ChatParticipant {
    _id: string;
    username: string;
    profileImage?: {
        data: string;
        contentType: string;
    };
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
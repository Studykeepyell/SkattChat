export interface ChatMessage {
    username: string;
    userId: string;
    message: string;
    timestamp: string;
    sender?: string;
    content?: string;
    messageType?: 'text' | 'gif';
    gifUrl?: string;
}

export interface ChatRoom {
    _id?: string;
    roomId?: string;
    name?: string;
    type: string;
    members: Array<{
        _id: string;
        username: string;
        profileImage?: {
            data: string;
            contentType: string;
        };
    }>;
    description?: string;
    hostId?: string;
    memberProfiles: {
        userId: string;
        role: 'host' | 'moderator' | 'member';
        username?: string;
        profileImage?: {
            data: string;
            contentType: string;
        };
    }[];
    messages?: string[];
    unreadCounts?: {
        userId: string;
        count: number;
    }[];
    lastMessage?: {
        content: string;
        sender: string;
        timestamp: Date;
    } | string;
    settings?: {
        allowNewMembers: boolean;
        maxMembers: number;
        isModerated: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
    participants?: Array<{
        _id: string;
        username: string;
        profileImage?: {
            data: string;
            contentType: string;
        };
    }>;
    lastMessageTime?: string | Date;
    isPrivate?: boolean;
    roomName?: string;
    activeUsers?: string[];
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
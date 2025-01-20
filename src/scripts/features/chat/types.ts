export interface ChatMessage {
    id?: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
    messageType?: 'text' | 'gif';
    gifUrl?: string;
    roomId?: string;
    content?: string;
    sender?: string;
}

export interface ChatRoom {
    _id?: string;
    roomId?: string;
    type?: 'private' | 'public';
    name?: string;
    roomName?: string;
    description?: string;
    hostId?: string;
    profileImage?: {
        data: string;
        contentType: string;
    };
    members?: any[];
    memberProfiles?: {
        userId: string;
        username?: string;
        role?: 'host' | 'moderator' | 'member';
        profileImage?: {
            data: string;
            contentType: string;
        };
    }[];
    messages?: string[];
    lastMessage?: {
        content: string;
        sender: string;
        timestamp: string;
    } | string;
    lastMessageTime?: string;
    activeUsers?: string[];
    participants?: any[];
    settings?: {
        allowNewMembers: boolean;
        maxMembers: number;
        isModerated: boolean;
    };
    createdAt?: string;
    updatedAt?: string;
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
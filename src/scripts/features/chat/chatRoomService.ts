import { ErrorHandler } from '../../core/errorHandler';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { StorageService } from '../../core/storageService';
import { ChatSocketHandler } from './chatSocketHandler';

export interface ChatRoomData {
    name: string;
    roomId: string;
    lastMessageTime?: string;
    updatedAt: string;
}

export class ChatRoomService {
    private roomList: HTMLElement | null;
    private createRoomBtn: HTMLElement | null;
    private socketHandler: ChatSocketHandler;

    constructor() {
        this.roomList = null;
        this.createRoomBtn = null;
        this.socketHandler = ChatSocketHandler.getInstance();
    }

    initialize() {
        try {
            console.log('[CHAT_ROOM] Starting initialization...');
            this.setupElements();
            this.setupEventListeners();
            
            // Request initial room list
            console.log('[CHAT_ROOM] Requesting initial room list');
            this.socketHandler.requestRooms();
            
            console.log('[CHAT_ROOM] Initialization complete');
        } catch (error) {
            console.error('[CHAT_ROOM] Error during initialization:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    private setupElements() {
        this.roomList = document.getElementById('roomList');
        this.createRoomBtn = document.getElementById('createRoomBtn');

        if (!this.roomList || !this.createRoomBtn) {
            throw new Error('Required chat room elements not found');
        }
    }

    private setupEventListeners() {
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', this.handleCreateRoom.bind(this));
        }

        // Listen for room-related events
        EventBus.subscribe(Constants.EVENTS.ROOM_CREATED, (data: any) => {
            console.log('[CHAT_ROOM] Room created event received:', data);
            this.handleRoomCreated(data);
        });
        
        EventBus.subscribe(Constants.EVENTS.ROOMS_UPDATED, (rooms: any[]) => {
            console.log('[CHAT_ROOM] Rooms updated event received:', rooms);
            this.displayRooms(rooms);
        });

        // Request rooms when joining chat page
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[CHAT_ROOM] Page loaded, requesting rooms');
            this.socketHandler.requestRooms();
        });
    }

    private displayRooms(rooms: any[]) {
        if (!this.roomList) return;
        console.log('[CHAT_ROOM] Displaying rooms:', rooms);

        // Get current user info
        const userProfile = StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || {};
        const authData = JSON.parse(StorageService.get('authData') || '{}');
        const currentUsername = (
            userProfile.username || 
            authData.username || 
            StorageService.get('username') || 
            ''
        ).toLowerCase();

        console.log('[CHAT_ROOM] Current user:', currentUsername);

        this.roomList.innerHTML = '';
        rooms.forEach(room => {
            console.log('[CHAT_ROOM] Processing room:', room);
            const roomElement = this.createRoomElement(room, currentUsername);
            this.roomList?.appendChild(roomElement);
        });
    }

    private createRoomElement(room: any, currentUsername: string): HTMLElement {
        console.log('[CHAT_ROOM] Creating element for room:', room);
        
        if (!room) {
            console.error('[CHAT_ROOM] Invalid room object');
            return document.createElement('div');
        }

        const div = document.createElement('div');
        div.className = 'chat-room';
        
        // Get room ID without splitting
        const roomId = room._id || room.roomId;
        console.log('[CHAT_ROOM] Using room ID:', roomId);

        let displayName = room.name;
        let profileImage = '../assets/images/default-profile.jpg';

        // For private chats, find the other participant
        if (room.isPrivate && room.participants) {
            console.log('[CHAT_ROOM] Private room participants:', room.participants);
            const otherParticipant = room.participants.find(
                (participant: any) => participant.username?.toLowerCase() !== currentUsername
            );
            if (otherParticipant) {
                console.log('[CHAT_ROOM] Found other participant:', otherParticipant);
                displayName = otherParticipant.username;
                profileImage = otherParticipant.avatar || profileImage;
            }
        } else if (room.name?.includes('Chat Room for')) {
            const namesText = room.name.split('Chat Room for ')[1];
            if (namesText) {
                const names = namesText.split(' and ').map((name: string) => name.trim());
                const otherUser = names.find((name: string) => name.toLowerCase() !== currentUsername);
                if (otherUser) {
                    displayName = otherUser;
                }
            }
        }

        div.innerHTML = `
            <img src="${profileImage}" alt="${displayName}'s avatar" class="profile-image">
            <div class="room-info">
                <div class="room-name">${displayName}</div>
                <div class="room-timestamp">${this.formatLastActivity(room.lastActivity || room.updatedAt)}</div>
            </div>
        `;

        if (!roomId) {
            console.error('[CHAT_ROOM] No room ID found in room object:', room);
            return div;
        }

        div.setAttribute('data-room-id', roomId);
        div.addEventListener('click', () => {
            console.log('[CHAT_ROOM] Room clicked, ID:', roomId);
            EventBus.publish(Constants.EVENTS.JOIN_ROOM, roomId);
        });

        return div;
    }

    private formatLastActivity(timestamp: string | number | Date): string {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days > 0) {
            return `${days}d ago`;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) {
            return `${hours}h ago`;
        }
        
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes > 0) {
            return `${minutes}m ago`;
        }
        
        return 'Just now';
    }

    private async handleCreateRoom() {
        try {
            const name = prompt('Enter room name:');
            if (!name) return;

            this.socketHandler.createRoom(name);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleRoomCreated(data: any) {
        this.socketHandler.requestRooms();
    }
} 
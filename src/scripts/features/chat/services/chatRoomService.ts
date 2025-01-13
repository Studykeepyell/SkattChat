import { ErrorHandler } from '../../../core/errorHandler';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { StorageService } from '../../../core/storageService';
import { ChatSocketHandler } from './chatSocketHandler';
import { ChatRoom, RoomDisplayData } from '../types';
import { API_CONFIG } from '../../../core/api.config';

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
        EventBus.subscribe(Constants.EVENTS.ROOM_CREATED, (room: ChatRoom) => {
            console.log('[CHAT_ROOM] Room created event received:', room);
            this.handleRoomCreated(room);
        });
        
        EventBus.subscribe(Constants.EVENTS.ROOMS_UPDATED, (rooms: ChatRoom[]) => {
            console.log('[CHAT_ROOM] Rooms updated event received:', rooms);
            this.displayRooms(rooms);
        });

        // Subscribe to profile image updates
        EventBus.subscribe(Constants.EVENTS.PROFILE_IMAGE_UPDATED, (userId: string) => {
            console.log('[CHAT_ROOM] Profile image updated for user:', userId);
            this.updateRoomProfileImage(userId);
        });

        // Request rooms when joining chat page
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[CHAT_ROOM] Page loaded, requesting rooms');
            this.socketHandler.requestRooms();
        });
    }

    private displayRooms(rooms: ChatRoom[]) {
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

        // Sort rooms by last message time, most recent first
        const sortedRooms = [...rooms].sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        this.roomList.innerHTML = '';
        sortedRooms.forEach(room => {
            console.log('[CHAT_ROOM] Processing room:', room);
            const roomElement = this.createRoomElement(room, currentUsername);
            this.roomList?.appendChild(roomElement);
        });
    }

    private createRoomElement(room: ChatRoom, currentUsername: string): HTMLElement {
        console.log('[CHAT_ROOM] Creating element for room:', room);
        
        if (!room) {
            console.error('[CHAT_ROOM] Invalid room object');
            return document.createElement('div');
        }

        const roomData: RoomDisplayData = this.getRoomDisplayData(room, currentUsername);
        const div = document.createElement('div');
        div.className = 'chat-room';
        div.setAttribute('data-room-id', roomData.roomId); // Add room ID for easy lookup
        
        // Add active class if this is the current room
        if (this.socketHandler.getCurrentRoom() === roomData.roomId) {
            div.classList.add('active');
        }
        
        // Add profile image
        const profileImg = document.createElement('img');
        profileImg.className = 'room-profile-image';
        profileImg.src = roomData.profileImage;
        profileImg.onerror = () => {
            profileImg.src = '/assets/images/default-avatar.svg';
        };

        // Create room content container
        const roomContent = document.createElement('div');
        roomContent.className = 'room-content';

        // Add room name
        const roomName = document.createElement('div');
        roomName.className = 'room-name';
        roomName.textContent = roomData.displayName;

        // Add timestamp if available
        if (roomData.lastActivity) {
            const timestamp = document.createElement('div');
            timestamp.className = 'room-timestamp';
            timestamp.textContent = roomData.lastActivity;
            div.appendChild(timestamp);
        }

        // Add click handler
        div.addEventListener('click', () => {
            // Remove active class from all rooms
            const allRooms = document.querySelectorAll('.chat-room');
            allRooms.forEach(room => room.classList.remove('active'));
            
            // Add active class to clicked room
            div.classList.add('active');
            
            EventBus.publish(Constants.EVENTS.JOIN_ROOM, roomData.roomId);
        });

        // Assemble the elements
        roomContent.appendChild(roomName);
        div.appendChild(profileImg);
        div.appendChild(roomContent);

        return div;
    }

    private getRoomDisplayData(room: ChatRoom, currentUsername: string): RoomDisplayData {
        const roomId = room._id || room.roomId || '';
        let displayName = room.name || room.roomName || '';
        let profileImage = '/assets/images/default-avatar.svg';
        let lastActivity = room.lastMessageTime ? this.formatLastActivity(room.lastMessageTime) : undefined;

        // For private chats, find the other participant
        if (room.isPrivate && room.participants) {
            const otherParticipant = room.participants.find(
                participant => participant.username?.toLowerCase() !== currentUsername?.toLowerCase()
            );
            if (otherParticipant) {
                displayName = otherParticipant.username;
                // Check if participant has profile image data
                if (otherParticipant.profileImage?.data) {
                    profileImage = `${API_CONFIG.BASE_URL}/api/users/${otherParticipant._id}/profile-image?${Date.now()}`;
                }
            }
        } else if (displayName.includes('Chat Room for')) {
            const namesText = displayName.split('Chat Room for ')[1];
            if (namesText) {
                const names = namesText.split(' and ').map(name => name.trim());
                const otherUser = names.find(name => name.toLowerCase() !== currentUsername?.toLowerCase());
                if (otherUser) {
                    displayName = otherUser;
                }
            }
        }

        return {
            displayName: displayName || 'General Chat',
            roomId,
            profileImage,
            lastActivity
        };
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

    private handleRoomCreated(data: ChatRoom) {
        this.socketHandler.requestRooms();
    }

    private updateRoomProfileImage(userId: string) {
        // Request updated room list to get latest participant data
        this.socketHandler.requestRooms();
    }

    private findRoomById(roomId: string | null, rooms: ChatRoom[]): ChatRoom | undefined {
        if (!roomId) return undefined;
        return rooms.find(room => (room._id || room.roomId) === roomId);
    }
} 
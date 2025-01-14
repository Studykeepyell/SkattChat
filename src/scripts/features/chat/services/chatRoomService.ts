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

    // Initialization
    public initialize() {
        try {
            console.log('[CHAT_ROOM] Starting initialization...');
            this.setupElements();
            this.setupEventListeners();
            this.requestInitialRooms();
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

    // Event Handling
    private setupEventListeners() {
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', this.handleCreateRoom.bind(this));
        }

        EventBus.subscribe(Constants.EVENTS.ROOM_CREATED, this.handleRoomCreated.bind(this));
        EventBus.subscribe(Constants.EVENTS.ROOMS_UPDATED, this.displayRooms.bind(this));
        EventBus.subscribe(Constants.EVENTS.PROFILE_IMAGE_UPDATED, this.handleProfileUpdate.bind(this));

        document.addEventListener('DOMContentLoaded', this.requestInitialRooms.bind(this));
    }

    private requestInitialRooms() {
        console.log('[CHAT_ROOM] Requesting initial room list');
        this.socketHandler.requestRooms();
    }

    // Room Display
    private displayRooms(rooms: ChatRoom[]) {
        if (!this.roomList) return;
        console.log('[CHAT_ROOM] Displaying rooms:', rooms);

        const currentUsername = this.getCurrentUsername();
        const sortedRooms = this.sortRoomsByActivity(rooms);

        this.roomList.innerHTML = '';
        sortedRooms.forEach(room => {
            console.log('[CHAT_ROOM] Processing room:', room);
            const roomElement = this.createRoomElement(room, currentUsername);
            this.roomList?.appendChild(roomElement);
        });
    }

    private getCurrentUsername(): string {
        const userProfile = StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || {};
        const authData = JSON.parse(StorageService.get('authData') || '{}');
        return (
            userProfile.username || 
            authData.username || 
            StorageService.get('username') || 
            ''
        ).toLowerCase();
    }

    private sortRoomsByActivity(rooms: ChatRoom[]): ChatRoom[] {
        return [...rooms].sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });
    }

    // Room Element Creation
    private createRoomElement(room: ChatRoom, currentUsername: string): HTMLElement {
        const roomData = this.getRoomDisplayData(room, currentUsername);
        const div = document.createElement('div');
        div.className = 'chat-room';
        div.setAttribute('data-room-id', roomData.roomId);

        if (this.socketHandler.getCurrentRoom() === roomData.roomId) {
            div.classList.add('active');
        }

        const profileImg = this.createProfileImage(room, currentUsername, roomData);
        const roomContent = this.createRoomContent(room, roomData);

        div.addEventListener('click', () => this.handleRoomClick(div, roomData.roomId));

        div.appendChild(profileImg);
        div.appendChild(roomContent);

        return div;
    }

    private createProfileImage(room: ChatRoom, currentUsername: string, roomData: RoomDisplayData): HTMLImageElement {
        const profileImg = document.createElement('img');
        profileImg.className = 'room-profile-image';
        
        if (room.type === 'private' && room.members) {
            const otherParticipant = room.members.find(
                member => member.username?.toLowerCase() !== currentUsername?.toLowerCase()
            );
            
            if (otherParticipant?.profileImage?.data) {
                // Use the base64 data directly from the room data
                console.log('[CHAT_ROOM] Using embedded profile image for:', otherParticipant.username);
                profileImg.src = otherParticipant.profileImage.data;
            } else if (otherParticipant?._id) {
                // Fallback to API endpoint if no embedded data
                console.log('[CHAT_ROOM] Falling back to API endpoint for:', otherParticipant._id);
                profileImg.src = `${API_CONFIG.BASE_URL}/api/users/${otherParticipant._id}/profile-image?${Date.now()}`;
            } else {
                profileImg.src = '/assets/images/default-avatar.svg';
            }
        } else {
            profileImg.src = roomData.profileImage;
        }

        profileImg.onerror = ((e: Event | string) => {
            const target = e instanceof Event ? e.target as HTMLImageElement : null;
            console.error('[CHAT_ROOM] Error loading profile image:', target?.src);
            profileImg.src = '/assets/images/default-avatar.svg';
        }) as OnErrorEventHandler;

        return profileImg;
    }

    private createRoomContent(room: ChatRoom, roomData: RoomDisplayData): HTMLElement {
        const roomContent = document.createElement('div');
        roomContent.className = 'room-content';

        const roomInfo = document.createElement('div');
        roomInfo.className = 'room-info';

        const roomNameContainer = document.createElement('div');
        roomNameContainer.className = 'room-name-container';

        const roomName = document.createElement('div');
        roomName.className = 'room-name';
        roomName.textContent = roomData.displayName;

        roomNameContainer.appendChild(roomName);

        const lastMessage = document.createElement('div');
        lastMessage.className = 'last-message';
        if (typeof room.lastMessage === 'object' && room.lastMessage?.content) {
            lastMessage.textContent = room.lastMessage.content;
        }

        roomInfo.appendChild(roomNameContainer);
        roomInfo.appendChild(lastMessage);

        const timestampContainer = document.createElement('div');
        timestampContainer.className = 'timestamp-container';
        
        // Try different sources for the timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'room-timestamp';
        
        let timeToShow = room.lastMessageTime || 
                        (typeof room.lastMessage === 'string' ? room.lastMessage : room.lastMessage?.timestamp) || 
                        room.updatedAt;
                        
        if (timeToShow) {
            timestamp.textContent = this.formatLastActivity(new Date(timeToShow));
            timestampContainer.appendChild(timestamp);
        }

        roomContent.appendChild(roomInfo);
        roomContent.appendChild(timestampContainer);

        return roomContent;
    }

    private formatLastActivity(date: string | Date): string {
        try {
            const now = new Date();
            const messageDate = date instanceof Date ? date : new Date(date);
            const diff = now.getTime() - messageDate.getTime();
            
            // If more than 24 hours ago, show the date
            if (diff > 24 * 60 * 60 * 1000) {
                return messageDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }
            
            // If more than an hour ago, show hours
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours > 0) {
                return messageDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }
            
            // If less than an hour ago, show minutes
            const minutes = Math.floor(diff / (1000 * 60));
            if (minutes > 0) {
                return `${minutes} min`;
            }
            
            return 'now';
        } catch (error) {
            console.error('[CHAT_ROOM] Error formatting timestamp:', error);
            return '';
        }
    }

    private handleRoomClick(roomElement: HTMLElement, roomId: string) {
        const allRooms = document.querySelectorAll('.chat-room');
        allRooms.forEach(room => room.classList.remove('active'));
        roomElement.classList.add('active');
        EventBus.publish(Constants.EVENTS.JOIN_ROOM, roomId);
    }

    // Room Data Processing
    private getRoomDisplayData(room: ChatRoom, currentUsername: string): RoomDisplayData {
        const roomId = room._id || room.roomId || '';
        let displayName = room.name || room.roomName || '';
        let profileImage = '/assets/images/default-avatar.svg';
        let lastActivity = room.lastMessageTime ? this.formatLastActivity(room.lastMessageTime) : undefined;

        if (room.type === 'private' && room.members) {
            const otherParticipant = room.members.find(
                member => member.username?.toLowerCase() !== currentUsername?.toLowerCase()
            );
            if (otherParticipant) {
                displayName = otherParticipant.username;
                if (otherParticipant.profileImage?.data) {
                    profileImage = otherParticipant.profileImage.data;
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

    // Event Handlers
    private async handleCreateRoom() {
        try {
            const name = prompt('Enter room name:');
            if (!name) return;
            this.socketHandler.createRoom(name);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private handleRoomCreated() {
        this.socketHandler.requestRooms();
    }

    private handleProfileUpdate(userId: string) {
        this.socketHandler.requestRooms();
    }
} 
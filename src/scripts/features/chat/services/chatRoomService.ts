import { ErrorHandler } from '../../../core/errorHandler';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { StorageService } from '../../../core/storageService';
import { ChatSocketHandler } from './chatSocketHandler';
import { ChatRoom, RoomDisplayData } from '../types';
import { API_CONFIG } from '../../../core/api.config';
import { HttpService } from '../../../core/httpService';

export class ChatRoomService {
    private roomList: HTMLElement | null;
    private createRoomBtn: HTMLElement | null;
    private socketHandler: ChatSocketHandler;
    private readonly DEFAULT_AVATAR = '/assets/images/default-avatar.svg';
    private isInitialized: boolean = false;

    constructor() {
        this.roomList = null;
        this.createRoomBtn = null;
        this.socketHandler = ChatSocketHandler.getInstance();
    }

    // Initialization
    public initialize() {
        try {
            if (this.isInitialized) {
                console.log('[CHAT_ROOM] Already initialized, skipping...');
                return;
            }
            console.log('[CHAT_ROOM] Starting initialization...');
            this.setupElements();
            this.setupEventListeners();
            // Only request rooms if document is already loaded
            if (document.readyState === 'complete') {
                this.requestInitialRooms();
            }
            this.isInitialized = true;
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
            // Remove any existing click listeners first
            this.createRoomBtn.removeEventListener('click', this.handleCreateRoom);
            this.createRoomBtn.addEventListener('click', this.handleCreateRoom);
        }

        // Unsubscribe from existing events first
        EventBus.unsubscribe(Constants.EVENTS.ROOM_CREATED, this.handleRoomCreated.bind(this));
        EventBus.unsubscribe(Constants.EVENTS.ROOMS_UPDATED, this.displayRooms.bind(this));
        EventBus.unsubscribe(Constants.EVENTS.PROFILE_IMAGE_UPDATED, this.handleProfileUpdate.bind(this));

        // Subscribe to events
        EventBus.subscribe(Constants.EVENTS.ROOM_CREATED, this.handleRoomCreated.bind(this));
        EventBus.subscribe(Constants.EVENTS.ROOMS_UPDATED, this.displayRooms.bind(this));
        EventBus.subscribe(Constants.EVENTS.PROFILE_IMAGE_UPDATED, this.handleProfileUpdate.bind(this));
        
        // Add listener for page navigation to re-enable all rooms
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        window.addEventListener('beforeunload', this.handleBeforeUnload);

        // Only add DOMContentLoaded if document isn't already loaded
        if (document.readyState !== 'complete') {
            document.removeEventListener('DOMContentLoaded', this.requestInitialRooms.bind(this));
            document.addEventListener('DOMContentLoaded', this.requestInitialRooms.bind(this));
        }
    }

    private handleBeforeUnload = () => {
        const allRooms = document.querySelectorAll('.chat-room');
        allRooms.forEach(room => {
            const roomElement = room as HTMLElement;
            roomElement.classList.remove('disabled');
            roomElement.style.pointerEvents = '';
            roomElement.style.opacity = '';
        });
    }

    // Event Handlers
    private handleCreateRoom = async () => {
        try {
            // Remove any existing modals first
            const existingModal = document.querySelector('.create-room-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create and show modal
            const modal = this.createRoomModal();
            document.body.appendChild(modal);

            // Load friends list
            await this.loadFriendsIntoModal(modal);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private createRoomModal(): HTMLElement {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modal = document.createElement('div');
        modal.className = 'create-room-modal';
        modal.style.cssText = `
            background: white;
            width: 400px;
            height: 90vh;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="display: flex; flex-direction: column; height: 100%;">
                <div class="modal-header" style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
                    <h2 style="margin: 0; font-size: 20px;">Create New Room</h2>
                </div>
                <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 16px;">
                    <div class="room-name-section" style="margin-bottom: 20px;">
                        <input type="text" id="roomNameInput" placeholder="Enter room name" class="room-name-input" style="width: 90%; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; margin: 0 auto; display: block;">
                    </div>
                    <div class="friends-section" style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                        <h3 style="margin: 0 0 12px 0;">Select Friends</h3>
                        <div id="friendsList" class="friends-list" style="flex: 1; overflow-y: auto; width: 90%;"></div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 16px; border-top: 1px solid #e0e0e0; display: flex; justify-content: center; gap: 16px;">
                    <button id="cancelBtn" class="cancel-btn" style="flex: 1; max-width: 160px; padding: 8px 16px; border: 1px solid #e0e0e0; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="createRoomSubmit" class="create-btn" style="flex: 1; max-width: 160px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Create Room</button>
                </div>
            </div>
        `;

        const cleanup = () => {
            // Remove any lingering styles from body
            document.body.style.cssText = '';
            
            // Remove any lingering styles from content
            const content = document.querySelector('.content');
            if (content instanceof HTMLElement) {
                content.style.cssText = '';
            }
            
            // Remove any lingering styles from room-select
            const roomSelect = document.querySelector('.room-select');
            if (roomSelect instanceof HTMLElement) {
                roomSelect.style.cssText = '';
            }
            
            // Remove the overlay
            overlay.remove();
        };

        // Add event listeners
        const cancelBtn = modal.querySelector('#cancelBtn');
        cancelBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            cleanup();
        });

        const createBtn = modal.querySelector('#createRoomSubmit');
        createBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await this.handleRoomSubmit(modal);
            cleanup();
        });

        // Close modal when clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
            }
        });

        // Stop propagation on modal click to prevent closing when clicking inside
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        overlay.appendChild(modal);
        return overlay;
    }

    private async loadFriendsIntoModal(modal: HTMLElement) {
        const friendsList = modal.querySelector('#friendsList');
        if (!friendsList) return;

        try {
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            if (!userId) throw new Error('User ID not found');

            // Get friends list from API
            const response = await HttpService.get(API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.FRIENDS(userId));
            const friends = response.friends || [];

            // Create friend items
            friends.forEach((friend: any) => {
                const friendItem = document.createElement('div');
                friendItem.className = 'friend-item';
                friendItem.setAttribute('data-user-id', friend._id);
                friendItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #e0e0e0;
                    transition: background-color 0.2s;
                    width: 100%;
                `;
                
                const profileImage = friend.profileImage?.data || this.DEFAULT_AVATAR;
                
                friendItem.innerHTML = `
                    <img src="${profileImage}" alt="${friend.username}" 
                         style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;" 
                         onerror="this.src='${this.DEFAULT_AVATAR}'">
                    <span style="flex: 1;">${friend.username}</span>
                `;

                friendItem.addEventListener('click', () => {
                    friendItem.classList.toggle('selected');
                    if (friendItem.classList.contains('selected')) {
                        friendItem.style.backgroundColor = '#f0f7ff';
                    } else {
                        friendItem.style.backgroundColor = '';
                    }
                });

                friendsList.appendChild(friendItem);
            });
        } catch (error) {
            ErrorHandler.handle(error);
            friendsList.innerHTML = '<p>Failed to load friends list</p>';
        }
    }

    private async handleRoomSubmit(modal: HTMLElement) {
        const roomNameInput = modal.querySelector('#roomNameInput') as HTMLInputElement;
        const selectedFriends = modal.querySelectorAll('.friend-item.selected');
        
        const roomName = roomNameInput?.value.trim();
        if (!roomName) {
            alert('Please enter a room name');
            return;
        }

        const memberIds = Array.from(selectedFriends).map(friend => 
            (friend as HTMLElement).getAttribute('data-user-id')
        ).filter(id => id) as string[];

        try {
            modal.remove(); // Remove modal first to prevent double-clicks
            await this.socketHandler.createRoom(roomName, memberIds);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    public requestInitialRooms() {
        console.log('[CHAT_ROOM] Requesting initial room list');
        this.socketHandler.requestRooms();
    }

    // Room Display
    private displayRooms(rooms: ChatRoom[]) {
        if (!this.roomList) return;
        console.log('[CHAT_ROOM] Displaying rooms:', rooms);

        // Debounce the room display to prevent multiple rapid updates
        if (this._displayRoomsTimeout) {
            clearTimeout(this._displayRoomsTimeout);
        }

        this._displayRoomsTimeout = setTimeout(() => {
            const currentUsername = this.getCurrentUsername();
            const sortedRooms = this.sortRoomsByActivity(rooms);

            this.roomList!.innerHTML = '';
            sortedRooms.forEach(room => {
                console.log('[CHAT_ROOM] Processing room:', room);
                const roomElement = this.createRoomElement(room, currentUsername);
                this.roomList?.appendChild(roomElement);
            });
        }, 100); // Small delay to batch multiple updates
    }

    private _displayRoomsTimeout: NodeJS.Timeout | null = null;

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

        const isCurrentRoom = this.socketHandler.getCurrentRoom() === roomData.roomId;
        if (isCurrentRoom) {
            div.classList.add('active');
            div.classList.add('disabled');
            div.style.pointerEvents = 'none';
            div.style.opacity = '0.7';
        }

        const profileImg = this.createProfileImage(room, currentUsername, roomData);
        const roomContent = this.createRoomContent(room, roomData);

        if (!isCurrentRoom) {
            div.addEventListener('click', () => this.handleRoomClick(div, roomData.roomId));
        }

        div.appendChild(profileImg);
        div.appendChild(roomContent);

        return div;
    }

    private createProfileImage(room: ChatRoom, currentUsername: string, roomData: RoomDisplayData): HTMLImageElement {
        const profileImg = document.createElement('img');
        profileImg.className = 'room-profile-image';
        
        if (room.type === 'private' && room.members) {
            // First try to find the other participant in members array
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            const otherParticipant = room.members.find(
                member => member._id?.toString() !== currentUserId
            );
            
            console.log('[CHAT_ROOM] Found other participant:', otherParticipant);
            
            if (otherParticipant?.profileImage?.data) {
                // Use the base64 data directly from the room data
                console.log('[CHAT_ROOM] Using embedded profile image for:', otherParticipant.username);
                if (otherParticipant.profileImage.data.startsWith('data:')) {
                    profileImg.src = otherParticipant.profileImage.data;
                } else {
                    profileImg.src = `data:${otherParticipant.profileImage.contentType || 'image/jpeg'};base64,${otherParticipant.profileImage.data}`;
                }
            } else if (otherParticipant?._id) {
                // Fallback to API endpoint if no embedded data
                console.log('[CHAT_ROOM] Falling back to API endpoint for:', otherParticipant._id);
                const imageUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.PROFILE_IMAGE(otherParticipant._id.toString())}?${Date.now()}`;
                console.log('[CHAT_ROOM] Profile image URL:', imageUrl);
                profileImg.src = imageUrl;
            } else {
                profileImg.src = this.DEFAULT_AVATAR;
            }
        } else {
            profileImg.src = roomData.profileImage || this.DEFAULT_AVATAR;
        }

        profileImg.onerror = ((e: Event | string) => {
            const target = e instanceof Event ? e.target as HTMLImageElement : null;
            console.error('[CHAT_ROOM] Error loading profile image:', target?.src);
            profileImg.src = this.DEFAULT_AVATAR;
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
        
        const timestamp = document.createElement('div');
        timestamp.className = 'room-timestamp';
        
        // Prioritize last message timestamp
        let timeToShow = null;
        if (typeof room.lastMessage === 'object' && room.lastMessage?.timestamp) {
            timeToShow = room.lastMessage.timestamp;
        } else if (room.lastMessageTime) {
            timeToShow = room.lastMessageTime;
        }
                        
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
        allRooms.forEach(room => {
            const element = room as HTMLElement;
            element.classList.remove('active', 'disabled');
            element.style.pointerEvents = '';
            element.style.opacity = '';
        });
        
        roomElement.classList.add('active', 'disabled');
        roomElement.style.pointerEvents = 'none';
        roomElement.style.opacity = '0.7';
        
        EventBus.publish(Constants.EVENTS.JOIN_ROOM, roomId);
    }

    // Room Data Processing
    private getOtherParticipantUsername(room: ChatRoom): string {
        if (!room.type || room.type !== 'private' || !room.roomId) {
            return room.name || room.roomName || 'General Chat';
        }

        const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        console.log('[CHAT_ROOM] Current user ID:', currentUserId);
        
        // Extract user IDs from room ID for private chats
        // Format: private_chat_userId1_userId2
        const roomIdParts = room.roomId.split('_');
        if (roomIdParts.length !== 4) {
            console.error('[CHAT_ROOM] Invalid room ID format:', room.roomId);
            return room.name || 'Unknown User';
        }

        const user1Id = roomIdParts[2];
        const user2Id = roomIdParts[3];
        console.log('[CHAT_ROOM] Room users:', user1Id, user2Id);
        
        // Find which ID is not the current user's
        const otherUserId = user1Id === currentUserId ? user2Id : user1Id;
        console.log('[CHAT_ROOM] Other user ID:', otherUserId);

        // Get current user's profile
        const userProfile = JSON.parse(StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || '{}');
        const currentUsername = userProfile.username;
        console.log('[CHAT_ROOM] Current username from profile:', currentUsername);

        // If we have a room name in format "User1 & User2", extract the other username
        if (room.name && room.name.includes(' & ')) {
            console.log('[CHAT_ROOM] Room name contains &:', room.name);
            const [user1Name, user2Name] = room.name.split(' & ').map(name => name.trim());
            console.log('[CHAT_ROOM] Room name parts:', { user1Name, user2Name });
            
            // Return the name that's not the current user's
            if (currentUsername) {
                if (user1Name.toLowerCase() === currentUsername.toLowerCase()) {
                    return user2Name;
                } else if (user2Name.toLowerCase() === currentUsername.toLowerCase()) {
                    return user1Name;
                }
            }
            
            // If we couldn't match the current username, return the second name
            // This is a reasonable fallback since the room name is usually formatted as "CurrentUser & OtherUser"
            return user2Name;
        }

        // If we have memberProfiles, use that as a backup
        if (room.memberProfiles) {
            const otherParticipant = room.memberProfiles.find(
                member => member.userId.toString() === otherUserId
            );
            if (otherParticipant?.username) {
                console.log('[CHAT_ROOM] Found username in memberProfiles:', otherParticipant.username);
                return otherParticipant.username;
            }
        }

        // If we still don't have a name but have a room name without "&", use it
        if (room.name && !room.name.includes(' & ')) {
            return room.name;
        }

        console.error('[CHAT_ROOM] Could not determine other participant name. Room data:', room);
        return 'Unknown User';
    }

    private getRoomDisplayData(room: ChatRoom, currentUsername: string): RoomDisplayData {
        const roomId = room._id || room.roomId || '';
        let displayName = '';
        let profileImage = '/dist/assets/images/default-avatar.svg';
        let lastActivity = room.lastMessageTime ? this.formatLastActivity(room.lastMessageTime) : undefined;

        // Check if it's a private chat (either explicitly marked or has exactly 2 members)
        const isPrivateChat = room.type === 'private' || (room.members?.length === 2);
        
        if (isPrivateChat) {
            displayName = this.getOtherParticipantUsername(room);
            
            // Set profile image if available
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            const otherParticipant = room.memberProfiles?.find(
                member => member.userId.toString() !== currentUserId
            );
            
            if (otherParticipant?.profileImage?.data) {
                if (otherParticipant.profileImage.data.startsWith('data:')) {
                    profileImage = otherParticipant.profileImage.data;
                } else {
                    profileImage = `data:${otherParticipant.profileImage.contentType || 'image/jpeg'};base64,${otherParticipant.profileImage.data}`;
                }
            }
        } else {
            // For non-private rooms, use the room name
            displayName = room.name || room.roomName || 'General Chat';
        }

        return {
            displayName,
            roomId,
            profileImage,
            lastActivity
        };
    }

    // Event Handlers
    private handleRoomCreated() {
        // Room list will be updated by the socket event, no need to request again
        console.log('[CHAT_ROOM] Room created event received');
    }

    private handleProfileUpdate(userId: string) {
        this.socketHandler.requestRooms();
    }

    private handleRoomList(rooms: ChatRoom[]) {
        try {
            console.log('[CHAT_SOCKET] Received room list:', rooms);
            // Ensure each room has lastMessageTime set from either lastMessage object or string
            const updatedRooms = rooms.map(room => {
                if (!room.lastMessageTime) {
                    // Handle case where lastMessage is a timestamp string
                    if (typeof room.lastMessage === 'string') {
                        return { ...room, lastMessageTime: room.lastMessage };
                    }
                    // Handle case where lastMessage is an object with timestamp
                    else if (room.lastMessage?.timestamp) {
                        return { ...room, lastMessageTime: room.lastMessage.timestamp };
                    }
                    // Fallback to updatedAt if available
                    else if (room.updatedAt) {
                        return { ...room, lastMessageTime: room.updatedAt };
                    }
                }
                return room;
            });
            EventBus.publish(Constants.EVENTS.ROOMS_UPDATED, updatedRooms);
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling room list:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleMessageHistory(messages: any[]) {
        try {
            console.log('[CHAT_SOCKET] Received message history:', messages);
            if (!Array.isArray(messages)) {
                console.error('[CHAT_SOCKET] Expected array of messages but got:', typeof messages);
                return;
            }
            console.log('[CHAT_SOCKET] Publishing message history to UI:', messages);
            EventBus.publish(Constants.EVENTS.MESSAGES_LOADED, messages);
        } catch (error) {
            console.error('[CHAT_SOCKET] Error handling message history:', error);
            ErrorHandler.handle(error);
        }
    }

    private handleUserJoined(data: { userId: string, timestamp: string, activeUsers: string[] }) {
        try {
            console.log('[CHAT_SOCKET] User joined:', data);
            // Only emit user joined event for participant count
            EventBus.publish(Constants.EVENTS.USER_JOINED_ROOM, data);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }
} 
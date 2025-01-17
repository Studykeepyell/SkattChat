import { ErrorHandler } from '../../../core/errorHandler';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { StorageService } from '../../../core/storageService';
import { API_CONFIG } from '../../../core/api.config';
import { ChatService } from './chatService';
import { MessageService } from '../messageService';
import { ChatMessage, ChatRoom } from '../types';

export class ChatUIService {
    private messageInput: HTMLInputElement | null;
    private chatForm: HTMLFormElement | null;
    private messagesContainer: HTMLElement | null;
    private chatHeading: HTMLElement | null;
    private roomList: HTMLElement | null;
    private sendButton: HTMLButtonElement | null;
    private chatService: ChatService;
    private messageService: MessageService;
    private currentRoom: string | null;

    constructor() {
        this.messageInput = null;
        this.chatForm = null;
        this.messagesContainer = null;
        this.chatHeading = null;
        this.roomList = null;
        this.sendButton = null;
        this.currentRoom = null;
        this.chatService = ChatService.getInstance();
        this.messageService = this.chatService['messageService'];
    }

    public initialize() {
        try {
            console.log('[CHAT_UI] Starting initialization...');
            // Wait for message input component to be ready
            setTimeout(() => {
                this.setupElements();
                this.setupEventListeners();
                this.setupMessageHandlers();
                console.log('[CHAT_UI] Initialization complete');
            }, 0);
        } catch (error) {
            console.error('[CHAT_UI] Error during initialization:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    private setupElements() {
        // Wait for elements to be available in DOM
        const maxAttempts = 10;
        let attempts = 0;
        
        const trySetup = () => {
            this.messageInput = document.querySelector('.message-input') as HTMLInputElement;
            this.chatForm = document.querySelector('form') as HTMLFormElement;
            this.messagesContainer = document.getElementById('messages');
            this.chatHeading = document.getElementById('chat-heading');
            this.roomList = document.getElementById('roomList');
            this.sendButton = document.querySelector('.send-button') as HTMLButtonElement;

            if (!this.messageInput || !this.chatForm || !this.messagesContainer || !this.roomList) {
                attempts++;
                if (attempts < maxAttempts) {
                    console.log('[CHAT_UI] Retrying element setup...');
                    setTimeout(trySetup, 100);
                } else {
                    throw new Error('Required chat UI elements not found after multiple attempts');
                }
                return;
            }
            
            this.setupEventListeners();
        };

        trySetup();
    }

    private messagesLoadedHandler = (messages: ChatMessage[]) => {
        console.log('[CHAT_UI] Loading initial messages:', messages);
        this.messageService.clearMessages();
        // Sort messages by timestamp before displaying
        const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        sortedMessages.forEach(message => {
            this.messageService.addChatMessage(message);
        });
    };

    private roomChangedHandler = (room: ChatRoom) => {
        this.updateRoomDisplay(room);
    };

    private setupMessageHandlers() {
        // First remove any existing handlers
        EventBus.unsubscribe(Constants.EVENTS.MESSAGES_LOADED, this.messagesLoadedHandler);
        EventBus.unsubscribe(Constants.EVENTS.ROOM_CHANGED, this.roomChangedHandler);
        EventBus.unsubscribe(Constants.EVENTS.USER_JOINED_ROOM, this.handleUserJoinedRoom);
        EventBus.unsubscribe(Constants.EVENTS.USER_LEFT_ROOM, this.handleUserLeftRoom);

        // Subscribe to message events
        EventBus.subscribe(Constants.EVENTS.MESSAGES_LOADED, this.messagesLoadedHandler);
        EventBus.subscribe(Constants.EVENTS.ROOM_CHANGED, this.roomChangedHandler);
        EventBus.subscribe(Constants.EVENTS.USER_JOINED_ROOM, this.handleUserJoinedRoom);
        EventBus.subscribe(Constants.EVENTS.USER_LEFT_ROOM, this.handleUserLeftRoom);
    }

    private handleUserJoinedRoom = (data: { userId: string, timestamp: string, activeUsers: string[] }) => {
        console.log('[CHAT_UI] User joined:', data);
        if (data.activeUsers) {
            this.updateParticipantCount(data.activeUsers);
        }
    };

    private handleUserLeftRoom = (data: { userId: string, timestamp: string, activeUsers: string[] }) => {
        console.log('[CHAT_UI] User left:', data);
        if (data.activeUsers) {
            this.updateParticipantCount(data.activeUsers);
        }
    };

    private updateParticipantCount(activeUsers: string[]) {
        const participantSpan = document.querySelector('.participant-count');
        if (participantSpan) {
            const count = activeUsers.length;
            participantSpan.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
            console.log('[CHAT_UI] Participant count updated to:', count);
        }
    }

    private handleSubmit = async (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!this.messageInput?.value.trim() || !this.currentRoom) {
            return;
        }

        const messageContent = this.messageInput.value.trim();
        this.messageInput.value = '';  // Clear immediately
        this.messageInput.focus();

        try {
            const success = await this.chatService.handleMessageSend(messageContent);
            if (success) {
                // Request room list update after successful message send
                this.chatService.requestRoomUpdate();
            }
        } catch (error) {
            console.error('[CHAT_UI] Error sending message:', error);
            ErrorHandler.handle(error);
        }
    };

    private handleKeyPress = async (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            
            if (!this.messageInput?.value.trim() || !this.currentRoom) {
                return;
            }

            const messageContent = this.messageInput.value.trim();
            this.messageInput.value = '';  // Clear immediately
            this.messageInput.focus();

            try {
                const success = await this.chatService.handleMessageSend(messageContent);
                if (success) {
                    // Request room list update after successful message send
                    this.chatService.requestRoomUpdate();
                }
            } catch (error) {
                console.error('[CHAT_UI] Error sending message:', error);
                ErrorHandler.handle(error);
            }
        }
    };

    private setupEventListeners() {
        if (this.chatForm) {
            // Remove old event listeners if they exist
            this.chatForm.removeEventListener('submit', this.handleSubmit);
            this.chatForm.addEventListener('submit', this.handleSubmit);
        }
        if (this.messageInput) {
            // Remove old event listeners if they exist
            this.messageInput.removeEventListener('keypress', this.handleKeyPress);
            this.messageInput.addEventListener('keypress', this.handleKeyPress);
        }

        // Listen for custom message-sent event from MessageInput component
        document.getElementById('message-input-root')?.addEventListener('message-sent', (e) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.message) {
                this.chatService.handleMessageSend(customEvent.detail.message);
            }
        });

        // Add profile image update handler
        EventBus.subscribe(Constants.EVENTS.UPDATE_ROOM_PROFILE, this.handleProfileImageUpdate.bind(this));

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.currentRoom) {
                // Request updated room data when page becomes visible
                this.chatService.requestRoomUpdate();
            }
        });

        // Add styles for GIF messages
        const style = document.createElement('style');
        style.textContent = `
            .message-gif {
                max-width: 300px;
                border-radius: 8px;
                overflow: hidden;
                margin: 4px 0;
            }
            .message-gif img {
                width: 100%;
                height: auto;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    private async handleProfileImageUpdate(data: { roomId: string, targetUserId: string, imageData: string, contentType: string }) {
        try {
            const { roomId, targetUserId, imageData, contentType } = data;
            await this.chatService.updateRoomProfileImage(roomId, targetUserId, imageData, contentType);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    public clearMessages() {
        this.messageService.clearMessages();
    }

    private scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    private getOtherParticipantUsername(room: ChatRoom): string {
        // If we have a room name in format "User1 & User2", extract the other username
        const roomName = room.name || room.roomName;
        if (roomName && roomName.includes(' & ')) {
            console.log('[CHAT_UI] Room name contains &:', roomName);
            const [user1Name, user2Name] = roomName.split(' & ').map(name => name.trim());
            console.log('[CHAT_UI] Room name parts:', { user1Name, user2Name });
            
            // Get current user's profile
            const userProfile = JSON.parse(StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || '{}');
            const currentUsername = userProfile.username;
            console.log('[CHAT_UI] Current username from profile:', currentUsername);
            
            // Return the name that's not the current user's
            if (currentUsername) {
                if (user1Name.toLowerCase() === currentUsername.toLowerCase()) {
                    return user2Name;
                } else if (user2Name.toLowerCase() === currentUsername.toLowerCase()) {
                    return user1Name;
                }
            }
            
            // If we couldn't match the current username, return the second name
            return user2Name;
        }

        // If we have members array, try to find the other participant
        if (room.members && Array.isArray(room.members)) {
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            const otherParticipant = room.members.find(
                member => member._id?.toString() !== currentUserId
            );
            if (otherParticipant?.username) {
                return otherParticipant.username;
            }
        }

        // If we still don't have a name but have a room name without "&", use it
        if (roomName && !roomName.includes(' & ')) {
            return roomName;
        }

        console.error('[CHAT_UI] Could not determine other participant name. Room data:', room);
        return 'Unknown User';
    }

    public updateRoomDisplay(room: ChatRoom) {
        try {
            console.log('[CHAT_UI] Updating room display, full room data:', JSON.stringify(room, null, 2));
            
            if (!room) {
                console.error('[CHAT_UI] No room data provided');
                return;
            }
            
            const newRoomId = room._id || room.roomId || null;
            const isRoomChange = this.currentRoom !== newRoomId;
            
            // Store current room ID
            this.currentRoom = newRoomId;
            console.log('[CHAT_UI] Current room ID:', this.currentRoom);

            // Get current user info
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);

            // Update active users count and determine if private chat
            const activeUsers = room.activeUsers || [];
            this.updateParticipantCount(activeUsers);
            
            // Check if it's a private chat based on room ID format
            const isPrivateChat = room.type === 'private' || 
                                room.roomId?.startsWith('private_chat_') || 
                                (room.members?.length === 2);

            // Update chat heading with room name and participant count
            if (!this.chatHeading) {
                throw new Error('Chat heading element not found');
            }
            
            console.log('[CHAT_UI] Participants:', room.members || room.participants || room.activeUsers);
            
            // Find or create the heading elements
            let headingTitle = this.chatHeading.querySelector('h2');
            let participantSpan = this.chatHeading.querySelector('.participant-count');
            let profileImage = this.chatHeading.querySelector('.room-profile-image') as HTMLImageElement;
            let lastActivitySpan = this.chatHeading.querySelector('.last-activity');
            
            if (!headingTitle) {
                headingTitle = document.createElement('h2');
                this.chatHeading.appendChild(headingTitle);
            }
            
            if (!participantSpan) {
                participantSpan = document.createElement('span');
                participantSpan.className = 'participant-count';
                this.chatHeading.appendChild(participantSpan);
            }

            if (!profileImage) {
                profileImage = document.createElement('img');
                profileImage.className = 'room-profile-image';
                profileImage.onerror = () => {
                    profileImage.src = '/dist/assets/images/default-avatar.svg';
                };
                this.chatHeading.insertBefore(profileImage, headingTitle);
            }

            if (!lastActivitySpan) {
                lastActivitySpan = document.createElement('span');
                lastActivitySpan.className = 'last-activity';
                this.chatHeading.appendChild(lastActivitySpan);
            }
            
            // For private chats, find the other participant
            if (isPrivateChat) {
                console.log('[CHAT_UI] Processing private room');
                const displayName = this.getOtherParticipantUsername(room);
                headingTitle.textContent = displayName;
                
                // Try to get profile image from members if available
                if (room.members) {
                    const otherParticipant = room.members.find(
                        member => member._id?.toString() !== currentUserId
                    );
                    
                    if (otherParticipant?.profileImage?.data) {
                        if (otherParticipant.profileImage.data.startsWith('data:')) {
                            profileImage.src = otherParticipant.profileImage.data;
                        } else {
                            profileImage.src = `data:${otherParticipant.profileImage.contentType || 'image/jpeg'};base64,${otherParticipant.profileImage.data}`;
                        }
                    } else if (otherParticipant?._id) {
                        const imageUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.PROFILE_IMAGE(otherParticipant._id.toString())}?${Date.now()}`;
                        console.log('[CHAT_UI] Profile image URL:', imageUrl);
                        profileImage.src = imageUrl;
                    } else {
                        profileImage.src = '/dist/assets/images/default-avatar.svg';
                    }
                } else {
                    // If no members data, try to get user ID from room ID
                    const roomIdParts = room.roomId?.split('_') || [];
                    if (roomIdParts.length === 4) {
                        const otherUserId = roomIdParts[2] === currentUserId ? roomIdParts[3] : roomIdParts[2];
                        const imageUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER.PROFILE_IMAGE(otherUserId)}?${Date.now()}`;
                        console.log('[CHAT_UI] Profile image URL from room ID:', imageUrl);
                        profileImage.src = imageUrl;
                    } else {
                        profileImage.src = '/dist/assets/images/default-avatar.svg';
                    }
                }
            } else {
                // For non-private rooms, use room name and default image
                headingTitle.textContent = room.name || room.roomName || 'General Chat';
                profileImage.src = '/dist/assets/images/default-avatar.svg';
            }

            this.updateParticipantCount(activeUsers);

            // Update last activity
            if (room.lastMessageTime) {
                const lastActivity = this.formatLastActivity(room.lastMessageTime);
                lastActivitySpan.textContent = lastActivity;
            } else {
                lastActivitySpan.textContent = '';
            }

            // Only clear messages when actually switching rooms
            if (isRoomChange) {
                console.log('[CHAT_UI] Room changed, clearing messages');
                this.clearMessages();
            }
        } catch (error) {
            console.error('[CHAT_UI] Error updating room display:', error);
            ErrorHandler.handle(error);
        }
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
} 
import { ErrorHandler } from '../../../core/errorHandler';
import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';
import { StorageService } from '../../../core/storageService';
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
        sortedMessages.forEach(message => this.messageService.addChatMessage(message));
    };

    private roomChangedHandler = (room: ChatRoom) => {
        this.updateRoomDisplay(room);
    };

    private setupMessageHandlers() {
        // First remove any existing handlers
        EventBus.unsubscribe(Constants.EVENTS.MESSAGES_LOADED, this.messagesLoadedHandler);
        EventBus.unsubscribe(Constants.EVENTS.ROOM_CHANGED, this.roomChangedHandler);

        // Subscribe to message events
        EventBus.subscribe(Constants.EVENTS.MESSAGES_LOADED, this.messagesLoadedHandler);
        EventBus.subscribe(Constants.EVENTS.ROOM_CHANGED, this.roomChangedHandler);
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
            const userProfile = JSON.parse(StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || '{}');
            const authData = JSON.parse(StorageService.get('authData') || '{}');
            const currentUserId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            const currentUsername = (
                userProfile.username || 
                authData.username || 
                StorageService.get('username') || 
                ''
            ).toLowerCase();

            // Determine if this is a private chat (2 participants or contains "Chat Room for")
            const participantCount = room.participants?.length || room.activeUsers?.length || 0;
            const isPrivateChat = participantCount === 2 || (room.name?.includes('Chat Room for') || false);

            // For private chats, update profile images
            if (isPrivateChat && room.participants && isRoomChange) {
                console.log('[CHAT_UI] Processing private room for profile updates');
                const otherParticipant = room.participants.find(
                    participant => participant.username?.toLowerCase() !== currentUsername
                );
                
                if (otherParticipant && otherParticipant.profileImage) {
                    // Update other participant's profile image in room
                    EventBus.publish(Constants.EVENTS.UPDATE_ROOM_PROFILE, {
                        roomId: newRoomId,
                        targetUserId: otherParticipant._id,
                        imageData: otherParticipant.profileImage.data,
                        contentType: otherParticipant.profileImage.contentType || 'image/jpeg'
                    });
                }

                // Also update current user's profile image in room
                if (userProfile.profileImage) {
                    EventBus.publish(Constants.EVENTS.UPDATE_ROOM_PROFILE, {
                        roomId: newRoomId,
                        targetUserId: currentUserId,
                        imageData: userProfile.profileImage.data,
                        contentType: userProfile.profileImage.contentType || 'image/jpeg'
                    });
                }
            }
            
            // Update chat heading with room name and participant count
            const chatHeading = document.getElementById('chat-heading');
            
            if (!chatHeading) {
                throw new Error('Chat heading element not found');
            }
            
            console.log('[CHAT_UI] Participants:', room.participants || room.activeUsers);
            
            // Get room name using the same logic as chat room list
            let displayName = room.name || room.roomName;
            console.log('[CHAT_UI] Initial display name:', displayName);
            
            // For private chats, find the other participant
            if (isPrivateChat && room.participants) {
                console.log('[CHAT_UI] Processing private room');
                const otherParticipant = room.participants.find(
                    participant => participant.username?.toLowerCase() !== currentUsername
                );
                if (otherParticipant) {
                    console.log('[CHAT_UI] Found other participant:', otherParticipant);
                    displayName = otherParticipant.username;
                }
            } else if (displayName?.includes('Chat Room for')) {
                console.log('[CHAT_UI] Processing "Chat Room for" format');
                const namesText = displayName.split('Chat Room for ')[1];
                if (namesText) {
                    const names = namesText.split(' and ').map(name => name.trim());
                    console.log('[CHAT_UI] Names from room name:', names);
                    const otherUser = names.find(name => name.toLowerCase() !== currentUsername);
                    if (otherUser) {
                        displayName = otherUser;
                    }
                }
            }

            // If no display name was set, use default
            if (!displayName) {
                console.log('[CHAT_UI] No display name found, using default');
                displayName = 'General Chat';
            }

            console.log('[CHAT_UI] Final display name:', displayName);

            // Find or create the heading elements
            let headingTitle = chatHeading.querySelector('h2');
            let participantSpan = chatHeading.querySelector('.participant-count');
            let profileImage = chatHeading.querySelector('.room-profile-image') as HTMLImageElement;
            let lastActivitySpan = chatHeading.querySelector('.last-activity');
            
            if (!headingTitle) {
                headingTitle = document.createElement('h2');
                chatHeading.appendChild(headingTitle);
            }
            
            if (!participantSpan) {
                participantSpan = document.createElement('span');
                participantSpan.className = 'participant-count';
                chatHeading.appendChild(participantSpan);
            }

            if (!profileImage) {
                profileImage = document.createElement('img');
                profileImage.className = 'room-profile-image';
                profileImage.onerror = () => {
                    profileImage.src = '/assets/images/default-avatar.svg';
                };
                chatHeading.insertBefore(profileImage, headingTitle);
            }

            if (!lastActivitySpan) {
                lastActivitySpan = document.createElement('span');
                lastActivitySpan.className = 'last-activity';
                chatHeading.appendChild(lastActivitySpan);
            }
            
            // Update the content
            headingTitle.textContent = displayName;
            participantSpan.textContent = `${participantCount} participant${participantCount !== 1 ? 's' : ''}`;

            // Update profile image for private chats
            if (isPrivateChat && room.participants) {
                const otherParticipant = room.participants.find(
                    participant => participant.username?.toLowerCase() !== currentUsername
                );
                if (otherParticipant?.profileImage?.data) {
                    profileImage.src = `data:${otherParticipant.profileImage.contentType};base64,${otherParticipant.profileImage.data}`;
                } else {
                    profileImage.src = '/assets/images/default-avatar.svg';
                }
            }

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
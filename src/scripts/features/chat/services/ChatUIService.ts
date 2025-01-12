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
            this.setupElements();
            this.setupEventListeners();
            this.setupMessageHandlers();
            console.log('[CHAT_UI] Initialization complete');
        } catch (error) {
            console.error('[CHAT_UI] Error during initialization:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    private setupElements() {
        this.messageInput = document.getElementById('messageInput') as HTMLInputElement;
        this.chatForm = document.getElementById('chat-form') as HTMLFormElement;
        this.messagesContainer = document.getElementById('messages');
        this.chatHeading = document.getElementById('chat-heading');
        this.roomList = document.getElementById('roomList');
        this.sendButton = document.getElementById('send-button') as HTMLButtonElement;

        if (!this.messageInput || !this.chatForm || !this.messagesContainer || !this.roomList) {
            throw new Error('Required chat UI elements not found');
        }
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
            // Remove any existing event listeners
            this.chatForm.removeEventListener('submit', this.handleSubmit);
            this.sendButton?.removeEventListener('click', this.handleSubmit);
            this.messageInput?.removeEventListener('keypress', this.handleKeyPress);

            // Add event listeners
            this.chatForm.addEventListener('submit', this.handleSubmit);
            this.sendButton?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleSubmit(e);
            });
            this.messageInput?.addEventListener('keypress', this.handleKeyPress);
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
            
            // Update chat heading with room name and participant count
            const chatHeading = document.getElementById('chat-heading');
            
            if (!chatHeading) {
                throw new Error('Chat heading element not found');
            }
            
            const participantCount = room.participants?.length || room.activeUsers?.length || 0;
            console.log('[CHAT_UI] Participants:', room.participants || room.activeUsers);
            
            // Get room name using the same logic as chat room list
            let displayName = room.name || room.roomName;
            console.log('[CHAT_UI] Initial display name:', displayName);
            
            // Try multiple locations for username
            const userProfile = StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || {};
            const authData = JSON.parse(StorageService.get('authData') || '{}');
            const currentUsername = (
                userProfile.username || 
                authData.username || 
                StorageService.get('username') || 
                ''
            ).toLowerCase();
            
            console.log('[CHAT_UI] Current username:', currentUsername);
            
            // For private chats, find the other participant
            if (room.isPrivate && room.participants) {
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
            
            if (!headingTitle) {
                headingTitle = document.createElement('h2');
                chatHeading.appendChild(headingTitle);
            }
            
            if (!participantSpan) {
                participantSpan = document.createElement('span');
                participantSpan.className = 'participant-count';
                chatHeading.appendChild(participantSpan);
            }
            
            // Update the content
            headingTitle.textContent = displayName;
            participantSpan.textContent = `${participantCount} participant${participantCount !== 1 ? 's' : ''}`;

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
} 
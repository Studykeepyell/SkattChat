import { ErrorHandler } from '../../core/errorHandler';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { StorageService } from '../../core/storageService';
import { ChatService } from './chatService';

export class ChatUIService {
    private messageInput: HTMLInputElement | null;
    private chatForm: HTMLFormElement | null;
    private messagesContainer: HTMLElement | null;
    private chatHeading: HTMLElement | null;
    private roomList: HTMLElement | null;
    private sendButton: HTMLButtonElement | null;
    private chatService: ChatService;
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
        this.initialize();
    }

    initialize() {
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

    private setupMessageHandlers() {
        // Subscribe to message events
        EventBus.subscribe(Constants.EVENTS.MESSAGE_RECEIVED, (message: any) => {
            this.displayMessage(message);
        });

        // Subscribe to room change events
        EventBus.subscribe(Constants.EVENTS.ROOM_CHANGED, (room: any) => {
            this.updateRoomDisplay(room);
        });
    }

    private setupEventListeners() {
        if (this.chatForm) {
            // Form submit handler
            this.chatForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (this.messageInput?.value.trim()) {
                    await this.chatService.handleMessageSend(this.messageInput.value.trim());
                    this.messageInput.value = '';
                    this.messageInput.focus();
                }
            });
            
            // Send button click handler
            this.sendButton?.addEventListener('click', async (event) => {
                event.preventDefault();
                if (this.messageInput?.value.trim()) {
                    await this.chatService.handleMessageSend(this.messageInput.value.trim());
                    this.messageInput.value = '';
                    this.messageInput.focus();
                }
            });

            // Enter key handler
            this.messageInput?.addEventListener('keypress', async (event: KeyboardEvent) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (this.messageInput?.value.trim()) {
                        await this.chatService.handleMessageSend(this.messageInput.value.trim());
                        this.messageInput.value = '';
                        this.messageInput.focus();
                    }
                }
            });
        }
    }

    displayMessage(message: any) {
        if (!this.messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // Format timestamp
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        
        // Create message content with sender and timestamp
        messageElement.innerHTML = `
            <span class="message-sender">${message.sender || 'Unknown'}:</span>
            <span class="message-content">${message.content}</span>
            <span class="message-time">${timestamp}</span>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    clearMessages() {
        console.log('[CHAT_UI] Clearing messages');
        if (this.messagesContainer) {
            while (this.messagesContainer.firstChild) {
                this.messagesContainer.removeChild(this.messagesContainer.firstChild);
            }
        }
    }

    private scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    updateRoomDisplay(room: any) {
        try {
            console.log('[CHAT_UI] Updating room display:', room);
            
            if (!room) {
                console.error('[CHAT_UI] No room data provided');
                return;
            }
            
            // Store current room ID
            this.currentRoom = room._id || room.roomId;
            
            // Update chat heading with room name and participant count
            const chatHeading = document.getElementById('chat-heading');
            
            if (!chatHeading) {
                throw new Error('Chat heading element not found');
            }
            
            const participantCount = room.participants?.length || 0;
            
            // Get room name - for private chats, extract friend's name
            let displayName = room.name || 'Chat Room';
            
            // Try multiple locations for username
            const userProfile = StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE) || {};
            const authData = JSON.parse(StorageService.get('authData') || '{}');
            const directUsername = StorageService.get('username');
            
            const currentUsername = (
                userProfile.username || 
                authData.username || 
                directUsername || 
                ''
            ).toLowerCase();
            
            console.log('[CHAT_UI] Current username:', currentUsername);
            
            if (room.isPrivate && room.participants) {
                // Find the other participant (not the current user)
                const otherParticipant = room.participants.find(
                    (participant: any) => participant.username?.toLowerCase() !== currentUsername
                );
                if (otherParticipant) {
                    displayName = otherParticipant.username;
                }
            } else if (displayName.includes('Chat Room for')) {
                // Remove the prefix and split the names
                const namesText = displayName.split('Chat Room for ')[1];
                
                if (namesText) {
                    const names = namesText.split(' and ').map((name: string) => name.trim());
                    
                    // Find the name that's not the current user's name (case-insensitive)
                    const otherUser = names.find((name: string) => name.toLowerCase() !== currentUsername);
                    
                    if (otherUser) {
                        displayName = otherUser;
                    }
                }
            }
            
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
            
            console.log('[CHAT_UI] Updated room display:', { displayName, participantCount });

            // Clear existing messages when switching rooms
            this.clearMessages();
        } catch (error) {
            console.error('[CHAT_UI] Error updating room display:', error);
            ErrorHandler.handle(error);
        }
    }
} 
import { ErrorHandler } from '../../core/errorHandler';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';

export class ChatUIService {
    private messageInput: HTMLInputElement | null;
    private chatForm: HTMLFormElement | null;
    private messagesContainer: HTMLElement | null;
    private chatHeading: HTMLElement | null;
    private currentRoom: string | null;

    constructor() {
        this.messageInput = null;
        this.chatForm = null;
        this.messagesContainer = null;
        this.chatHeading = null;
        this.currentRoom = null;
    }

    initialize() {
        try {
            console.log('[CHAT_UI] Starting initialization...');
            this.setupElements();
            this.setupEventListeners();
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

        if (!this.messageInput || !this.chatForm || !this.messagesContainer) {
            throw new Error('Required chat UI elements not found');
        }
    }

    private setupEventListeners() {
        if (this.chatForm) {
            this.chatForm.addEventListener('submit', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.handleSubmit(event);
            });
            
            // Add send button click handler
            const sendButton = document.getElementById('send-button');
            if (sendButton) {
                sendButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.handleSubmit(event);
                });
            }

            // Add enter key handler for the input
            this.messageInput?.addEventListener('keypress', (event: KeyboardEvent) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.handleSubmit(event);
                }
            });
        }
    }

    private handleSubmit(event: Event) {
        if (!this.messageInput?.value.trim()) return;

        const messageContent = this.messageInput.value.trim();
        console.log('[CHAT_UI] Sending message:', { content: messageContent, roomId: this.currentRoom });

        EventBus.publish(Constants.EVENTS.SEND_MESSAGE, {
            content: messageContent,
            roomId: this.currentRoom
        });

        this.messageInput.value = '';
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
        console.log('[CHAT_UI] Updating room display:', room);
        
        // Store current room ID
        this.currentRoom = room._id || room.roomId;
        
        // Update chat heading
        if (this.chatHeading) {
            this.chatHeading.textContent = room.name || 'Chat Room';
        }

        // Clear existing messages when switching rooms
        this.clearMessages();
    }
} 
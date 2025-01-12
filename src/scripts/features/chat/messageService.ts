import { fetchProfileImage, formatTimestamp, formatMessageDate, formatMessageTime } from '../../utils/utils';
import { ErrorHandler } from '../../core/errorHandler';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { StorageService } from '../../core/storageService';
import { ChatMessage, MessageData } from './types';

export class MessageService {
    constructor() {
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        // Handle single messages
        EventBus.subscribe(Constants.EVENTS.MESSAGE_RECEIVED, (message: ChatMessage) => {
            console.log('[MESSAGE_SERVICE] Received single message:', message);
            this.addChatMessage(message);
        });

        // Handle message history - just clear and set messages directly
        EventBus.subscribe(Constants.EVENTS.MESSAGES_LOADED, (messages: ChatMessage[]) => {
            console.log('[MESSAGE_SERVICE] Received message history:', messages);
            const messagesList = document.getElementById('messages');
            if (!messagesList) {
                throw new Error("Error: 'messages' element not found.");
            }
            
            // Clear existing messages
            this.clearMessages();
            
            // Sort messages by timestamp
            const sortedMessages = messages.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            // Create all message elements first
            const allElements: HTMLElement[] = [];
            let lastMessageDate: string | null = null;

            sortedMessages.forEach(message => {
                const messageData: MessageData = {
                    username: message.sender || message.username || 'Unknown',
                    userId: message.userId,
                    content: message.content || message.message || '',
                    timestamp: message.timestamp || new Date().toISOString()
                };

                const elements = this.createMessageElement(messageData, lastMessageDate);
                if (elements) {
                    allElements.push(...elements);
                    // Update lastMessageDate if a date separator was added
                    const dateSeparator = elements.find(el => el.className === 'date-separator');
                    if (dateSeparator) {
                        lastMessageDate = dateSeparator.textContent;
                    }
                }
            });

            // Append all elements at once
            allElements.forEach(element => messagesList.appendChild(element));
            messagesList.scrollTop = messagesList.scrollHeight;
        });
    }

    async addChatMessage(data: ChatMessage) {
        try {
            console.log('[MESSAGE_SERVICE] Adding message:', data);
            const messagesList = document.getElementById('messages');
            if (!messagesList) {
                throw new Error("Error: 'messages' element not found.");
            }

            // Extract message data, handling both formats
            const messageData: MessageData = {
                username: data.sender || data.username || 'Unknown',
                userId: data.userId,
                content: data.content || data.message || '',
                timestamp: data.timestamp || new Date().toISOString()
            };

            console.log('[MESSAGE_SERVICE] Formatted message data:', messageData);

            const lastDateSeparator = messagesList.querySelector('.date-separator:last-of-type')
            const lastMessageDate = lastDateSeparator ? lastDateSeparator.textContent : null;
            
            const elements = this.createMessageElement(messageData, lastMessageDate);
            if (!elements) {
                throw new Error('Failed to create message element');
            }

            elements.forEach(element => messagesList.appendChild(element));
            messagesList.scrollTop = messagesList.scrollHeight;
        } catch (error) {
            console.error('[MESSAGE_SERVICE] Error adding message:', error);
            ErrorHandler.handle(error);
        }
    }

    clearMessages() {
        console.log('[MESSAGE_SERVICE] Clearing messages');
        const messagesList = document.getElementById('messages');
        if (messagesList) {
            while (messagesList.firstChild) {
                messagesList.removeChild(messagesList.firstChild);
            }
        }
    }

    private createMessageElement(data: MessageData, lastMessageDate: string | null): HTMLElement[] {
        const { username, userId, content, timestamp } = data;
        const elements: HTMLElement[] = [];
        const currentMessageDate = formatMessageDate(timestamp);

        // Get current user's username
        const authData = StorageService.get('authData');
        const currentUsername = authData ? JSON.parse(authData).username : '';
        const isCurrentUser = username.toLowerCase() === currentUsername?.toLowerCase();

        // Add date separator if needed
        if (currentMessageDate !== lastMessageDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.textContent = currentMessageDate;
            elements.push(dateSeparator);
        }

        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${isCurrentUser ? 'message-right' : 'message-left'}`;

        // Add profile image
        const profileImg = document.createElement('img');
        profileImg.className = 'profile-image';
        profileImg.src = `/api/users/${userId}/profile-image?${Date.now()}`; // Add timestamp to prevent caching
        profileImg.onerror = () => {
            profileImg.src = '/assets/images/default-avatar.svg';
        };

        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Add username and timestamp
        const header = document.createElement('div');
        header.className = 'message-header';
        
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'username';
        usernameSpan.textContent = username;
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'timestamp';
        timestampSpan.textContent = formatMessageTime(timestamp);

        // Order username and timestamp based on message alignment
        if (isCurrentUser) {
            header.appendChild(timestampSpan);
            header.appendChild(usernameSpan);
        } else {
            header.appendChild(usernameSpan);
            header.appendChild(timestampSpan);
        }
        messageContent.appendChild(header);

        // Add message text
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = content;
        messageContent.appendChild(messageText);

        // Add elements in the correct order based on alignment
        if (isCurrentUser) {
            messageContainer.appendChild(messageContent);
            messageContainer.appendChild(profileImg);
        } else {
            messageContainer.appendChild(profileImg);
            messageContainer.appendChild(messageContent);
        }
        elements.push(messageContainer);

        return elements;
    }
} 
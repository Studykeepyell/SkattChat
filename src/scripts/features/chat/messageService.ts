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
                const messageData: MessageData & Partial<ChatMessage> = {
                    username: message.sender || message.username || 'Unknown',
                    userId: message.userId,
                    content: message.content || message.message || '',
                    timestamp: message.timestamp || new Date().toISOString(),
                    messageType: message.messageType,
                    gifUrl: message.gifUrl
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
            const messageData: MessageData & Partial<ChatMessage> = {
                username: data.sender || data.username || 'Unknown',
                userId: data.userId,
                content: data.content || data.message || '',
                timestamp: data.timestamp || new Date().toISOString(),
                messageType: data.messageType,
                gifUrl: data.gifUrl
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
        const messageDate = new Date(timestamp);
        const now = new Date();
        
        // Format date divider
        let dateDividerText = '';
        const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            dateDividerText = 'Today';
        } else if (diffDays === 1) {
            dateDividerText = 'Yesterday';
        } else {
            dateDividerText = messageDate.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit'
            });
        }

        // Get current user's username
        const authData = StorageService.get('authData');
        const currentUsername = authData ? JSON.parse(authData).username : '';
        const isCurrentUser = username.toLowerCase() === currentUsername?.toLowerCase();

        // Add date separator if needed
        if (dateDividerText !== lastMessageDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.textContent = dateDividerText;
            elements.push(dateSeparator);
        }

        // Create message container with absolute positioning
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${isCurrentUser ? 'message-right' : 'message-left'}`;
        messageContainer.style.position = 'relative';
        messageContainer.style.width = '100%';
        messageContainer.style.marginBottom = '16px';

        // Add profile image
        const profileImg = document.createElement('img');
        profileImg.className = 'profile-image';
        profileImg.src = `/api/users/${userId}/profile-image?${Date.now()}`; // Add timestamp to prevent caching
        profileImg.style.width = '40px';
        profileImg.style.height = '40px';
        profileImg.style.borderRadius = '50%';
        profileImg.style.position = 'absolute';
        profileImg.style[isCurrentUser ? 'right' : 'left'] = '0';
        profileImg.style.top = '0';
        
        profileImg.onerror = () => {
            profileImg.src = '/assets/images/default-avatar.svg';
        };

        // Create message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.style.maxWidth = '70%';
        messageContent.style.margin = isCurrentUser ? '0 50px 0 auto' : '0 auto 0 50px';
        messageContent.style.backgroundColor = isCurrentUser ? '#0084ff' : '#f0f0f0';
        messageContent.style.color = isCurrentUser ? '#fff' : '#000';
        messageContent.style.borderRadius = '18px';
        messageContent.style.padding = '10px 15px';
        messageContent.style.position = 'relative';

        // Add username
        const usernameSpan = document.createElement('div');
        usernameSpan.className = 'username';
        usernameSpan.textContent = username;
        usernameSpan.style.fontSize = '12px';
        usernameSpan.style.marginBottom = '4px';
        usernameSpan.style.color = isCurrentUser ? '#fff' : '#666';

        // Add message text or GIF
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Check if this is a GIF message
        if ((data as ChatMessage).messageType === 'gif' && (data as ChatMessage).gifUrl) {
            const gifContainer = document.createElement('div');
            gifContainer.className = 'message-gif';
            gifContainer.style.maxWidth = '300px';
            gifContainer.style.borderRadius = '8px';
            gifContainer.style.overflow = 'hidden';
            gifContainer.style.margin = '4px 0';

            const gifImage = document.createElement('img');
            gifImage.src = (data as ChatMessage).gifUrl!;
            gifImage.alt = 'GIF';
            gifImage.style.width = '100%';
            gifImage.style.height = 'auto';
            gifImage.style.display = 'block';

            gifContainer.appendChild(gifImage);
            messageText.appendChild(gifContainer);
        } else if ((data as ChatMessage).messageType !== 'gif') {
            messageText.textContent = content;
            messageText.style.wordBreak = 'break-word';
        }

        // Add timestamp
        const timestampSpan = document.createElement('div');
        timestampSpan.className = 'timestamp';
        timestampSpan.textContent = messageDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        timestampSpan.style.fontSize = '11px';
        timestampSpan.style.marginTop = '4px';
        timestampSpan.style.color = isCurrentUser ? 'rgba(255,255,255,0.7)' : '#999';
        timestampSpan.style.textAlign = isCurrentUser ? 'right' : 'left';

        // Assemble message content
        messageContent.appendChild(usernameSpan);
        messageContent.appendChild(messageText);
        messageContent.appendChild(timestampSpan);

        // Add elements to container
        messageContainer.appendChild(profileImg);
        messageContainer.appendChild(messageContent);
        elements.push(messageContainer);

        return elements;
    }
} 
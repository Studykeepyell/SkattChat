import { fetchProfileImage, formatTimestamp, formatMessageDate, formatMessageTime } from '../../utils/utils.js';
import { ErrorHandler } from '../../core/errorHandler.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';

export class MessageService {
    async addChatMessage(data: { 
        username: string, 
        userId?: string, 
        content: string, 
        timestamp: string 
    }) {
        try {
            const messagesList = document.getElementById('messages');
            if (!messagesList) {
                throw new Error("Error: 'messages' element not found.");
            }

            const lastDateSeparator = messagesList.querySelector('.date-separator:last-of-type')
            const lastMessageDate = lastDateSeparator ? lastDateSeparator.textContent : null;
            
            const elements = this.createMessageElement(data, lastMessageDate);
            if (!elements) {
                throw new Error('Failed to create message element');
            }

            elements.forEach(element => messagesList.appendChild(element));
            messagesList.scrollTop = messagesList.scrollHeight;
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private createMessageElement(data: { 
        username: string, 
        userId?: string, 
        content: string, 
        timestamp: string 
    }, lastMessageDate: string | null) {
        const { username, userId, content, timestamp } = data;
        const elements: HTMLElement[] = [];
        const currentMessageDate = formatMessageDate(timestamp);

        // Add date separator if needed
        if (currentMessageDate !== lastMessageDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.textContent = currentMessageDate;
            elements.push(dateSeparator);
        }

        // Create message container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Add profile image
        const profileImg = document.createElement('img');
        profileImg.className = 'profile-image';
        profileImg.src = '/default-profile.jpg'; // Default image
        if (userId) {
            fetchProfileImage(userId).then(imgUrl => profileImg.src = imgUrl);
        }
        messageContainer.appendChild(profileImg);

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

        header.appendChild(usernameSpan);
        header.appendChild(timestampSpan);
        messageContent.appendChild(header);

        // Add message text
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = content;
        messageContent.appendChild(messageText);

        messageContainer.appendChild(messageContent);
        elements.push(messageContainer);

        return elements;
    }
} 
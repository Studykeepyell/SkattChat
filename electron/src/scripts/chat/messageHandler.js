// messageHandler.js
export const createMessageHandler = () => {
    const messagesList = document.getElementById('messages');
    
    return {
        addMessage: (data) => {
            if (!messagesList) return;
            
            const { username, content, timestamp } = data;
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <span class="username">${username}</span>
                <span class="content">${content}</span>
                <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
            `;
            
            messagesList.appendChild(messageElement);
            messagesList.scrollTop = messagesList.scrollHeight;
        }
    };
};
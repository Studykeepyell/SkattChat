document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Function to add a new chat message to the messages container
    function addChatMessage(data) {
        console.log('Adding chat message:', data); // Confirm the function is called

        // Create the main message container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        // Create the character picture container
        const characterPicture = document.createElement('div');
        characterPicture.className = 'character-picture';

        // Create the bubble wrapper
        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'buble-wrapper';

        // Create the speech bubble
        const speechBubble = document.createElement('div');
        speechBubble.className = 'speech-bubble';

        // Create the message content
        const messageContent = document.createElement('div');
        messageContent.className = 'message';
        messageContent.textContent = `${data.username}: ${data.message}`;

        // Create the lower text (timestamp)
        const lowerText = document.createElement('div');
        lowerText.className = 'lower-tex';
        lowerText.textContent = formatTimestamp(data.timestamp);

        // Append elements to form the structure
        speechBubble.appendChild(messageContent);
        bubbleWrapper.appendChild(speechBubble);
        messageContainer.appendChild(characterPicture);
        messageContainer.appendChild(bubbleWrapper);
        messageContainer.appendChild(lowerText);

        // Append the new message container to the messages list
        const messagesList = document.getElementById('messages');
        if (messagesList) {
            messagesList.appendChild(messageContainer);
            console.log('Message successfully appended to messages list'); // Confirm message is appended
        } else {
            console.warn('Messages container not found.');
        }
    }

    // Utility function to format the timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (isNaN(date)) {
            return 'Invalid Date';
        }
        const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options) + ', ' + date.toLocaleTimeString(undefined, options);
    }

    // Event listeners and socket.io handling code go here
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('messageForm');
    const deleteAllMessagesButton = document.getElementById('deleteAllMessages');
    const messagesList = document.getElementById('messages');

    if (chatForm) {
        chatForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
                socket.emit('chat message', {
                    username: localStorage.getItem('username'),
                    message: message,
                    timestamp: Date.now()
                });
                messageInput.value = '';
            }
        });
    }

    if (deleteAllMessagesButton) {
        deleteAllMessagesButton.addEventListener('click', function() {
            if (messagesList) {
                messagesList.innerHTML = '';
                socket.emit('clear messages');
            }
        });
    }

    socket.on('chat message', function(data) {
        addChatMessage(data);
    });

    socket.on('clear messages', function() {
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    });

    socket.on('chat history', function(messages) {
        if (messagesList) {
            messagesList.innerHTML = '';
            messages.forEach((msg) => {
                addChatMessage(msg);
            });
        }
    });
});

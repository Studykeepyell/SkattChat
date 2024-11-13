const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    let lastMessageDate = ''; // Track the date of the last message to group messages by date
    const messagesList = document.getElementById('messages');

    if (!messagesList) {
        console.warn("The 'messages' container element was not found.");
        return;
    }

    function addChatMessage(data) {
        console.log('Adding chat message:', data);

        const messageDate = formatMessageDate(data.timestamp);
        
        if (messageDate !== lastMessageDate) {
            // Create a new date header when the date changes
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = messageDate;
            messagesList.appendChild(dateHeader); // Append date header to messages list
            lastMessageDate = messageDate; // Update the last message date
        }

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';

        const userInfoContainer = document.createElement('div');
        userInfoContainer.className = 'user-info-container';

        const characterPicture = document.createElement('div');
        characterPicture.className = 'character-picture';

        const username = document.createElement('h2');
        username.className = 'username';
        username.textContent = data.username;

        const timeText = document.createElement('h4');
        timeText.className = 'timestamp';
        timeText.textContent = formatTimestamp(data.timestamp);

        userInfoContainer.appendChild(characterPicture);
        userInfoContainer.appendChild(username);
        userInfoContainer.appendChild(timeText);

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = data.message;

        messageContainer.appendChild(userInfoContainer);
        messageContainer.appendChild(messageContent);

        messagesList.appendChild(messageContainer);
        console.log('Message successfully appended to messages list');


    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (isNaN(date)) {
            return 'Invalid Date';
        }
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString(undefined, options);
    }

    function formatMessageDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    }

    // Chat form submission and event listeners go here...

    socket.on('chat message', function(data) {
        addChatMessage(data);
    });

    socket.on('clear messages', function() {
        if (messagesList) {
            messagesList.innerHTML = '';
            lastMessageDate = ''; // Reset the last message date
        }
    });

    socket.on('chat history', function(messages) {
        if (messagesList) {
            messagesList.innerHTML = '';
            lastMessageDate = ''; // Reset last message date for new history load
            messages.forEach((msg) => {
                addChatMessage(msg);
            });
        }
    });

});

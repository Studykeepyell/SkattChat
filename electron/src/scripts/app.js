document.addEventListener('DOMContentLoaded', () => {
    // Taskbar navigation
    const setupTaskbarNavigation = () => {
        document.querySelectorAll('.taskbar button[data-target]').forEach((button) => {
            button.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                if (target) window.location.href = target;
            });
        });
    };

    // Bubble menu handler
    const setupBubbleMenu = () => {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const bubbleMenu = document.getElementById('bubble-menu');

        if (hamburgerMenu && bubbleMenu) {
            hamburgerMenu.addEventListener('click', () => {
                bubbleMenu.classList.toggle('active');
                bubbleMenu.setAttribute('aria-hidden', !bubbleMenu.classList.contains('active'));
            });
        }
    };

    // Dark mode handler
    const setupDarkMode = () => {
        const darkModeButton = document.getElementById('darkModeButton');
        if (darkModeButton) {
            darkModeButton.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            });
        }

        // Load saved dark mode preference
        if (JSON.parse(localStorage.getItem('darkMode'))) {
            document.body.classList.add('dark-mode');
        }
    };

    // Emoji picker handler
    const setupEmojiPicker = () => {
        const emojiButton = document.getElementById('emoji-button');
        const emojiPicker = document.getElementById('emoji-picker');
        const messageInput = document.getElementById('messageInput');

        emojiButton?.addEventListener('click', () => {
            emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        });

        document.querySelectorAll('.emoji').forEach((emoji) => {
            emoji.addEventListener('click', () => {
                messageInput.value += emoji.textContent;
                emojiPicker.style.display = 'none';
            });
        });
    };

    // Profile image handler
    const loadProfileImage = () => {
        const savedImage = sessionStorage.getItem('profileImage');
        if (savedImage) {
            const profileImg = document.getElementById('taskbar-profile-img');
            if (profileImg) profileImg.src = savedImage;
        }
    };

    // Initialize all UI components
    setupTaskbarNavigation();
    setupBubbleMenu();
    setupDarkMode();
    setupEmojiPicker();
    loadProfileImage();
});
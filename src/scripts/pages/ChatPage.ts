import { ChatModule } from '../features/chat/index.js';
import { FriendModule } from '../features/friend/index.js';
import { SocketService } from '../core/socketService.js';
import { ErrorHandler } from '../core/errorHandler.js';
import { Constants } from '../core/constants.js';
import { EventBus } from '../core/eventBus.js';

export class ChatPage {
    private chatModule!: ChatModule;
    private friendModule!: FriendModule;

    constructor() {
        this.initialize();
    }

    private initialize() {
        try {
            this.initializeCore();
            this.initializeModules();
            this.setupEventListeners();
            this.setupUI();
            this.loadSavedSettings();
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private loadSavedSettings() {
        // Load dark mode preference
        const isDarkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }

        // Load profile image
        const savedImage = sessionStorage.getItem("profileImage");
        if (savedImage) {
            const profileImg = document.getElementById("taskbar-profile-img");
            if (profileImg) {
                (profileImg as HTMLImageElement).src = savedImage;
            }
        }
    }

    private initializeCore() {
        // Initialize socket connection
        SocketService.initialize();
        
        // Check authentication status
        const isAuthenticated = !!localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
        EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { isAuthenticated });
    }

    private initializeModules() {
        this.chatModule = new ChatModule();
        this.friendModule = new FriendModule();

        this.chatModule.initialize();
        this.friendModule.initialize();
    }

    private setupUI() {
        this.setupTaskbarNavigation();
        this.setupHamburgerMenu();
        this.setupEmojiPicker();
        this.setupDarkMode();
    }

    private setupEventListeners() {
        EventBus.subscribe(Constants.EVENTS.AUTH_CHANGE, this.handleAuthChange.bind(this));
    }

    private handleAuthChange({ isAuthenticated }: { isAuthenticated: boolean }) {
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const shouldShow = element.getAttribute('data-auth') === (isAuthenticated ? 'true' : 'false');
            (element as HTMLElement).style.display = shouldShow ? 'block' : 'none';
        });
    }

    // UI Methods moved from scripts.ts
    private setupTaskbarNavigation() {
        document.querySelectorAll(".taskbar button[data-target]").forEach(button => {
            button.addEventListener("click", () => {
                const targetPage = button.getAttribute("data-target");
                if (targetPage) {
                    window.location.href = targetPage;
                }
            });
        });
    }

    private setupHamburgerMenu() {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const bubbleMenu = document.getElementById('bubble-menu');

        hamburgerMenu?.addEventListener('click', (event) => {
            event.stopPropagation();
            bubbleMenu?.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!hamburgerMenu?.contains(event.target as Node) && !bubbleMenu?.contains(event.target as Node)) {
                bubbleMenu?.classList.remove('active');
            }
        });
    }

    private setupEmojiPicker() {
        const emojiButton = document.getElementById("emoji-button");
        const emojiPicker = document.getElementById("emoji-picker");
        const messageInput = document.getElementById("messageInput") as HTMLInputElement;

        emojiButton?.addEventListener("click", () => {
            if (emojiPicker) {
                emojiPicker.style.display = 
                    emojiPicker.style.display === "none" ? "block" : "none";
            }
        });

        document.querySelectorAll(".emoji").forEach((emoji) => {
            emoji.addEventListener("click", () => {
                if (messageInput && emojiPicker) {
                    messageInput.value += emoji.textContent;
                    emojiPicker.style.display = "none";
                }
            });
        });
    }

    private setupDarkMode() {
        const darkModeButton = document.getElementById('darkModeButton');
        darkModeButton?.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        });
    }
}

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatPage();
    });
} else {
    new ChatPage();
}

// Make this file a module
export {};
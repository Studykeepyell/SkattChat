import { ChatModule } from '../features/chat/index';
import { FriendModule } from '../features/friend/index';
import { SocketService } from '../core/socketService';
import { ErrorHandler } from '../core/errorHandler';
import { Constants } from '../core/constants';
import { EventBus } from '../core/eventBus';
import { StorageService } from '../core/storageService';

export class ChatPage {
    private chatModule!: ChatModule;
    private friendModule!: FriendModule;
    private currentUser: any;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            await this.checkAuthentication();
            this.initializeCore();
            this.initializeModules();
            this.setupEventListeners();
            this.setupUI();
            this.loadSavedSettings();
            this.loadUserProfile();
        } catch (error) {
            ErrorHandler.handle(error);
            // Redirect to login if there's an authentication error
            window.location.href = '../pages/login.html';
        }
    }

    private async checkAuthentication() {
        const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        
        if (!token || !userId) {
            throw new Error('Not authenticated');
        }

        this.currentUser = {
            id: userId,
            token: token,
            profile: StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE)
        };
    }

    private loadUserProfile() {
        if (this.currentUser?.profile) {
            // Update profile image
            const profileImg = document.getElementById("taskbar-profile-img") as HTMLImageElement;
            if (profileImg && this.currentUser.profile.avatar) {
                profileImg.src = this.currentUser.profile.avatar;
            }

            // Update username if displayed
            const usernameElement = document.getElementById("username-display");
            if (usernameElement && this.currentUser.profile.username) {
                usernameElement.textContent = this.currentUser.profile.username;
            }
        }
    }

    private loadSavedSettings() {
        // Load dark mode preference
        const isDarkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    private initializeCore() {
        // Initialize socket connection with auth token
        SocketService.initialize(this.currentUser.token);
        
        // Publish authentication status
        EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
            isAuthenticated: true,
            user: this.currentUser
        });
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
        EventBus.subscribe(Constants.EVENTS.PROFILE_UPDATE, this.handleProfileUpdate.bind(this));
    }

    private handleAuthChange({ isAuthenticated, user }: { isAuthenticated: boolean, user?: any }) {
        if (!isAuthenticated) {
            // Handle logout
            window.location.href = '../pages/login.html';
            return;
        }

        if (user) {
            this.currentUser = user;
            this.loadUserProfile();
        }
    }

    private handleProfileUpdate(profile: any) {
        if (this.currentUser) {
            this.currentUser.profile = profile;
            StorageService.set(Constants.STORAGE_KEYS.USER_PROFILE, profile);
            this.loadUserProfile();
        }
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
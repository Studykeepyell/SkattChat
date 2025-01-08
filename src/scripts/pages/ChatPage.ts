import { ChatModule } from '../features/chat/index';
import { FriendModule } from '../features/friend/index';
import { SocketService } from '../core/socketService';
import { ErrorHandler } from '../core/errorHandler';
import { Constants } from '../core/constants';
import { EventBus } from '../core/eventBus';
import { StorageService } from '../core/storageService';
import { ChatUIService } from '../features/chat/chatUIService';

export class ChatPage {
    private chatModule!: ChatModule;
    private friendModule!: FriendModule;
    private currentUser: any;

    constructor() {
        this.initialize().catch(error => {
            console.error('Failed to initialize chat page:', error);
            window.location.href = 'login.html';
        });
    }

    private async initialize() {
        try {
            console.log('Starting chat page initialization...');
            
            // Check authentication first
            const isAuthenticated = await this.checkAuthentication();
            if (!isAuthenticated) {
                console.log('Authentication check failed, redirecting to login...');
                window.location.href = 'login.html';
                return;
            }

            console.log('Authentication successful, initializing components...');
            
            // Initialize components
            this.initializeCore();
            this.initializeModules();
            this.setupEventListeners();
            this.setupUI();
            this.loadSavedSettings();
            await this.loadUserProfile();

            // Initialize chat UI service
            const chatUIService = new ChatUIService();

            console.log('Chat page initialization complete');
        } catch (error) {
            console.error('Error during chat page initialization:', error);
            ErrorHandler.handle(error);
            window.location.href = 'login.html';
        }
    }

    private async checkAuthentication(): Promise<boolean> {
        try {
            const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            
            console.log('Auth check - Token exists:', !!token);
            console.log('Auth check - UserID exists:', !!userId);

            if (!token || !userId) {
                return false;
            }

            this.currentUser = {
                id: userId,
                token: token,
                profile: StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE)
            };

            return true;
        } catch (error) {
            console.error('Error during authentication check:', error);
            return false;
        }
    }

    private async loadUserProfile() {
        try {
            if (!this.currentUser?.profile) {
                console.log('No user profile found');
                return;
            }

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
        } catch (error) {
            console.error('Error loading user profile:', error);
            ErrorHandler.handle(error);
        }
    }

    private loadSavedSettings() {
        try {
            // Load dark mode preference
            const isDarkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
        } catch (error) {
            console.error('Error loading saved settings:', error);
            ErrorHandler.handle(error);
        }
    }

    private initializeCore() {
        try {
            // Initialize socket connection with auth token
            if (!this.currentUser?.token) {
                throw new Error('No auth token available for socket connection');
            }
            
            SocketService.initialize(this.currentUser.token);
            
            // Publish authentication status
            EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
                isAuthenticated: true,
                user: this.currentUser
            });
        } catch (error) {
            console.error('Error initializing core services:', error);
            throw error;
        }
    }

    private initializeModules() {
        try {
            console.log('[CHAT] Creating chat module...');
            this.chatModule = new ChatModule();
            
            console.log('[CHAT] Creating friend module...');
            this.friendModule = new FriendModule();

            console.log('[CHAT] Initializing chat module...');
            this.chatModule.initialize();
            
            console.log('[CHAT] Initializing friend module...');
            this.friendModule.initialize();
            
            console.log('[CHAT] All modules initialized successfully');
        } catch (error) {
            console.error('[CHAT] Error initializing modules:', error);
            if (error instanceof Error) {
                console.error('[CHAT] Error details:', error.message);
                console.error('[CHAT] Stack trace:', error.stack);
            }
            throw error;
        }
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
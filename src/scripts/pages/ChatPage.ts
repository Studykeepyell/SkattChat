import { FriendModule } from '../features/friend/index';
import { SocketService } from '../core/socketService';
import { ErrorHandler } from '../core/errorHandler';
import { Constants } from '../core/constants';
import { EventBus } from '../core/eventBus';
import { TaskbarService } from '../features/layout/TaskbarService';
import { ThemeService } from '../features/layout/ThemeService';
import { MenuService } from '../features/layout/MenuService';
import { ChatAuthService } from '../features/chat/services/ChatAuthService';
import { ProfileService } from '../features/chat/services/ProfileService';
import { EmojiService } from '../features/chat/services/EmojiService';
import { ChatUIService } from '../features/chat/services/ChatUIService';
import { ChatService } from '../features/chat/services/chatService';
import { ChatRoomService } from '../features/chat/services/chatRoomService';
import { ChatSocketHandler } from '../features/chat/services/chatSocketHandler';

export class ChatPage {
    private friendModule!: FriendModule;
    private services!: {
        auth: ChatAuthService;
        profile: ProfileService;
        taskbar: TaskbarService;
        theme: ThemeService;
        menu: MenuService;
        emoji: EmojiService;
        ui: ChatUIService;
        chat: ChatService;
        room: ChatRoomService;
        socket: ChatSocketHandler;
    };

    constructor() {
        this.initialize().catch(error => {
            console.error('Failed to initialize chat page:', error);
            window.location.href = 'login.html';
        });
    }

    private async initialize() {
        try {
            console.log('Starting chat page initialization...');
            
            // Initialize services
            this.initializeServices();
            
            // Check authentication first
            const isAuthenticated = await this.services.auth.checkAuthentication();
            if (!isAuthenticated) {
                console.log('Authentication check failed, redirecting to login...');
                window.location.href = 'login.html';
                return;
            }

            console.log('Authentication successful, initializing components...');
            
            // Initialize components and setup
            this.initializeCore();
            this.initializeFriendModule();
            this.setupEventListeners();
            await this.services.profile.loadUserProfile();

            // Initialize UI services
            this.services.taskbar.initialize();
            this.services.theme.initialize();
            this.services.menu.initialize();
            this.services.emoji.initialize();
            this.services.ui.initialize();

            // Initialize chat services
            this.services.socket.initialize();
            this.services.room.initialize();

            console.log('Chat page initialization complete');
        } catch (error) {
            console.error('Error during chat page initialization:', error);
            ErrorHandler.handle(error);
            window.location.href = 'login.html';
        }
    }

    private initializeServices(): void {
        const auth = new ChatAuthService();
        const chat = ChatService.getInstance();
        const socket = ChatSocketHandler.getInstance();
        
        this.services = {
            auth,
            profile: new ProfileService(auth.getCurrentUser()),
            taskbar: new TaskbarService(),
            theme: new ThemeService(),
            menu: new MenuService(),
            emoji: new EmojiService(),
            ui: new ChatUIService(),
            chat,
            socket,
            room: new ChatRoomService()
        };
    }

    private initializeCore() {
        try {
            const currentUser = this.services.auth.getCurrentUser();
            if (!currentUser?.token) {
                throw new Error('No auth token available for socket connection');
            }
            
            SocketService.initialize(currentUser.token);
            
            EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
                isAuthenticated: true,
                user: currentUser
            });
        } catch (error) {
            console.error('Error initializing core services:', error);
            throw error;
        }
    }

    private initializeFriendModule() {
        try {
            console.log('[CHAT] Creating friend module...');
            this.friendModule = new FriendModule();

            console.log('[CHAT] Initializing friend module...');
            this.friendModule.initialize();
            
            console.log('[CHAT] Friend module initialized successfully');
        } catch (error) {
            console.error('[CHAT] Error initializing friend module:', error);
            if (error instanceof Error) {
                console.error('[CHAT] Error details:', error.message);
                console.error('[CHAT] Stack trace:', error.stack);
            }
            throw error;
        }
    }

    private setupEventListeners() {
        EventBus.subscribe(Constants.EVENTS.AUTH_CHANGE, this.services.auth.handleAuthChange.bind(this.services.auth));
        EventBus.subscribe(Constants.EVENTS.PROFILE_UPDATE, this.services.profile.handleProfileUpdate.bind(this.services.profile));
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
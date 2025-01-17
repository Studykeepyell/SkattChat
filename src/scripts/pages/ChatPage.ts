// Core imports
import { SocketService } from '../core/socketService';
import { ErrorHandler } from '../core/errorHandler';
import { Constants } from '../core/constants';
import { EventBus } from '../core/eventBus';

// Layout services
import { TaskbarService } from '../features/layout/TaskbarService';
import { ThemeService } from '../features/layout/ThemeService';
import { MenuService } from '../features/layout/MenuService';

// Chat services
import { ChatAuthService } from '../features/chat/services/ChatAuthService';
import { ProfileService } from '../features/chat/services/ProfileService';
import { ChatUIService } from '../features/chat/services/ChatUIService';
import { ChatService } from '../features/chat/services/chatService';
import { ChatRoomService } from '../features/chat/services/chatRoomService';
import { ChatSocketHandler } from '../features/chat/services/chatSocketHandler';

// UI Components
import { MessageInputService } from '../features/chat/services/MessageInputService';
import { EmojiService } from '../features/chat/services/EmojiService';

// Friend module
import { FriendModule } from '../features/friend/index';
import { ChatRoom } from '../features/chat/types';

export class ChatPage {
    private static instance: ChatPage;
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
        messageInput: MessageInputService;
    };

    private constructor() {}

    public static async init(): Promise<ChatPage> {
        if (!ChatPage.instance) {
            ChatPage.instance = new ChatPage();
            await ChatPage.instance.initialize();
        }
        return ChatPage.instance;
    }

    private async initialize() {
        try {
            console.log('Starting chat page initialization...');
            
            const auth = new ChatAuthService();
            const isAuthenticated = await auth.checkAuthentication();
            
            if (!isAuthenticated) {
                console.log('Authentication check failed, redirecting to login...');
                window.location.href = 'login.html';
                return;
            }

            this.initializeServices(auth);
            this.initializeCore();
            await this.initializeComponents();

        } catch (error) {
            console.error('Error during chat page initialization:', error);
            ErrorHandler.handle(error);
            window.location.href = 'login.html';
        }
    }

    private async initializeComponents() {
        try {
            // Initialize socket first
            console.log('Initializing socket handler...');
            this.services.socket.initialize();

            // Initialize UI services
            console.log('Initializing UI services...');
            this.services.taskbar.initialize();
            this.services.theme.initialize();
            this.services.menu.initialize();
            this.services.ui.initialize();

            // Initialize chat room service after socket is ready
            console.log('Initializing chat room service...');
            this.services.room.initialize();

            // Initialize friend module
            console.log('Initializing friend module...');
            this.initializeFriendModule();
            
            // Setup event listeners
            this.setupEventListeners();

            // Load user profile
            console.log('Loading user profile...');
            await this.services.profile.loadUserProfile();

            // Initialize message input last
            const messageInputRoot = document.getElementById('message-input-root');
            if (messageInputRoot) {
                this.services.messageInput = new MessageInputService(messageInputRoot);
                this.services.emoji.initialize();
            }

            console.log('Chat page initialization complete');
        } catch (error) {
            console.error('Error during component initialization:', error);
            throw error;
        }
    }

    private initializeServices(auth: ChatAuthService): void {
        const chat = ChatService.getInstance();
        const socket = ChatSocketHandler.getInstance();
        
        this.services = {
            auth,
            profile: new ProfileService(auth.getCurrentUser()),
            taskbar: new TaskbarService(),
            theme: new ThemeService(),
            menu: new MenuService(),
            ui: new ChatUIService(),
            chat,
            socket,
            room: new ChatRoomService(),
            emoji: new EmojiService(),
            messageInput: {} as MessageInputService // Will be initialized later
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
        // Core events
        EventBus.subscribe(Constants.EVENTS.AUTH_CHANGE, this.services.auth.handleAuthChange.bind(this.services.auth));
        EventBus.subscribe(Constants.EVENTS.PROFILE_UPDATE, this.services.profile.handleProfileUpdate.bind(this.services.profile));
        
        // Room events
        EventBus.subscribe(Constants.EVENTS.ROOM_CHANGED, (room: ChatRoom) => {
            if (room.lastMessage) {
                this.services.room.requestInitialRooms();
            }
        });
    }
}

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ChatPage.init().catch(error => {
            console.error('Failed to initialize chat page:', error);
            window.location.href = 'login.html';
        });
    });
} else {
    ChatPage.init().catch(error => {
        console.error('Failed to initialize chat page:', error);
        window.location.href = 'login.html';
    });
}

// Make this file a module
export {};
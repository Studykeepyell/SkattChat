import { FriendModule } from '../features/friend/index';
import { ErrorHandler } from '../core/errorHandler';
import { HttpService } from '../core/httpService';
import { API_CONFIG } from '../core/api.config';
import { StorageService } from '../core/storageService';
import { Constants } from '../core/constants';
import { TaskbarService } from '../features/layout/TaskbarService';
import { MenuService } from '../features/layout/MenuService';
import { ThemeService } from '../features/layout/ThemeService';
import { EventBus } from '../core/eventBus';

interface FriendRequestResponse {
    success: boolean;
    message?: string;
}

export class FriendsPage {
    private static instance: FriendsPage;
    private friendModule!: FriendModule;
    private searchForm!: HTMLFormElement | null;
    private searchInput!: HTMLInputElement | null;
    private resultsContainer!: HTMLElement | null;
    private requestsContainer!: HTMLElement | null;
    private readonly DEFAULT_PROFILE = '/dist/assets/images/default-avatar.svg';
    private services!: {
        taskbar: TaskbarService;
        menu: MenuService;
        theme: ThemeService;
    };

    private constructor() {}

    public static async init(): Promise<FriendsPage> {
        if (!FriendsPage.instance) {
            FriendsPage.instance = new FriendsPage();
            await FriendsPage.instance.initialize();
        }
        return FriendsPage.instance;
    }

    private async initialize() {
        try {
            // Check if user is authenticated
            const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);

            if (!token || !userId) {
                window.location.href = '/dist/pages/login.html';
                return;
            }

            console.log('Starting friends page initialization...');
            await this.initializeComponents();
            console.log('Friends page initialization complete');
        } catch (error) {
            console.error('Error during friends page initialization:', error);
            ErrorHandler.handle(error);
            window.location.href = '/dist/pages/login.html';
        }
    }

    private async initializeComponents() {
        try {
            // Initialize services
            console.log('Initializing services...');
            this.initializeServices();

            // Load profile image and setup listener
            console.log('Loading profile image...');
            this.loadProfileImage();
            this.setupProfileUpdateListener();

            // Initialize friend module
            console.log('Initializing friend module...');
            this.friendModule = new FriendModule();
            this.friendModule.initialize();

            // Setup UI elements
            console.log('Setting up UI elements...');
            this.setupElements();
            this.setupEventListeners();

            // Load initial data
            console.log('Loading initial data...');
            await this.loadFriendRequests();
        } catch (error) {
            console.error('Error during component initialization:', error);
            throw error;
        }
    }

    private initializeServices(): void {
        this.services = {
            taskbar: new TaskbarService(),
            menu: new MenuService(),
            theme: new ThemeService()
        };

        // Initialize all services
        Object.values(this.services).forEach(service => service.initialize());
    }

    private setupElements() {
        this.searchForm = document.getElementById('searchForm') as HTMLFormElement;
        this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
        this.resultsContainer = document.getElementById('resultsContainer');
        this.requestsContainer = document.getElementById('requestsContainer');
    }

    private setupEventListeners() {
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', this.handleSearch.bind(this));
        }
    }

    private async handleSearch(event: Event) {
        event.preventDefault();
        if (!this.searchInput?.value) return;
        
        try {
            await this.searchUsers(this.searchInput.value);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private async searchUsers(query: string) {
        if (!this.resultsContainer) return;
        this.resultsContainer.innerHTML = '';

        try {
            const friends = await this.fetchFriends();
            const response = await HttpService.get(`/api/users/search?q=${query}`);
            
            if (!response.success) {
                throw new Error(response.message || 'No users found');
            }

            this.displaySearchResults(response.users, friends);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private async fetchFriends() {
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        if (!userId) {
            throw new Error('User ID not found');
        }

        try {
            // Temporarily return empty array until backend endpoint is ready
            return [];
            // TODO: Uncomment when backend endpoint is ready
            // const response = await HttpService.get(`/api/users/${userId}/friends`);
            // return response.friends || [];
        } catch (error) {
            ErrorHandler.handle(error);
            return [];
        }
    }

    private displaySearchResults(users: any[], friends: string[]) {
        if (!this.resultsContainer) return;

        users.sort((a: any, b: any) => {
            const aIsFriend = friends.includes(a._id);
            const bIsFriend = friends.includes(b._id);
            return (bIsFriend ? 1 : 0) - (aIsFriend ? 1 : 0);
        });

        users.forEach(user => {
            const userBox = this.createUserBox(user, friends.includes(user._id));
            this.resultsContainer?.appendChild(userBox);
        });
    }

    private createUserBox(user: any, isFriend: boolean): HTMLElement {
        const userBox = document.createElement('div');
        userBox.className = 'box';

        const userImage = document.createElement('img');
        const profileImagePath = user.profileImage?.data 
            ? `${API_CONFIG.BASE_URL}/api/users/${user._id}/profile-image` 
            : this.DEFAULT_PROFILE;
        userImage.src = profileImagePath;
        userImage.alt = 'User profile';
        userImage.onerror = () => {
            userImage.src = this.DEFAULT_PROFILE;
        };

        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerText = user.username;

        userBox.appendChild(userImage);
        userBox.appendChild(userInfo);

        if (!isFriend) {
            const addButton = document.createElement('button');
            addButton.innerText = 'Add Friend';
            addButton.onclick = async () => {
                addButton.disabled = true;
                addButton.innerText = 'Sending...';
                try {
                    const response = await this.friendModule.sendFriendRequest(user._id);
                    if (response?.success) {
                        addButton.innerText = 'Request Sent';
                        addButton.style.backgroundColor = '#4CAF50';
                    } else {
                        addButton.innerText = 'Add Friend';
                        addButton.disabled = false;
                    }
                } catch (error) {
                    addButton.innerText = 'Add Friend';
                    addButton.disabled = false;
                    ErrorHandler.handle(error);
                }
            };
            userBox.appendChild(addButton);
        } else {
            const friendStatus = document.createElement('span');
            friendStatus.innerText = 'Friend';
            userBox.appendChild(friendStatus);
        }

        return userBox;
    }

    private async loadFriendRequests() {
        if (!this.requestsContainer) return;

        try {
            const requests = await this.friendModule.loadFriendRequests();
            this.displayFriendRequests(requests);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private displayFriendRequests(requests: any[]) {
        if (!this.requestsContainer) return;
        this.requestsContainer.innerHTML = '';

        if (requests.length === 0) {
            this.requestsContainer.innerHTML = '<p class="no-requests">No pending friend requests</p>';
            return;
        }

        requests.forEach(request => {
            const requestBox = this.createRequestBox(request);
            this.requestsContainer?.appendChild(requestBox);
        });
    }

    private createRequestBox(request: any): HTMLElement {
        const requestBox = document.createElement('div');
        requestBox.className = 'box';

        const userImage = document.createElement('img');
        const profileImagePath = request.sender.profileImage?.data ? 
            `/api/users/${request.sender._id}/profile-image` : this.DEFAULT_PROFILE;
        userImage.src = profileImagePath;
        userImage.alt = 'User profile';
        userImage.onerror = () => {
            userImage.src = this.DEFAULT_PROFILE;
        };

        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerText = request.sender.username;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const acceptButton = document.createElement('button');
        acceptButton.className = 'accept-button';
        acceptButton.innerText = 'Accept';
        acceptButton.onclick = async () => {
            try {
                await this.friendModule.respondToFriendRequest(request._id, 'accepted');
                requestBox.remove();
                this.loadFriendRequests(); // Refresh the list
            } catch (error) {
                ErrorHandler.handle(error);
            }
        };

        const declineButton = document.createElement('button');
        declineButton.className = 'decline-button';
        declineButton.innerText = 'Decline';
        declineButton.onclick = async () => {
            try {
                await this.friendModule.respondToFriendRequest(request._id, 'declined');
                requestBox.remove();
            } catch (error) {
                ErrorHandler.handle(error);
            }
        };

        buttonContainer.appendChild(acceptButton);
        buttonContainer.appendChild(declineButton);

        requestBox.appendChild(userImage);
        requestBox.appendChild(userInfo);
        requestBox.appendChild(buttonContainer);

        return requestBox;
    }

    private loadProfileImage(): void {
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        if (userId) {
            const taskbarProfileImg = document.getElementById('taskbar-profile-img') as HTMLImageElement;
            if (taskbarProfileImg) {
                const imageUrl = `${API_CONFIG.BASE_URL}/api/users/${userId}/profile-image?${Date.now()}`;
                console.log('Loading profile image from:', imageUrl);
                taskbarProfileImg.src = imageUrl;
                taskbarProfileImg.onerror = () => {
                    console.log('Profile image load failed, using default');
                    taskbarProfileImg.src = this.DEFAULT_PROFILE;
                };
            }
        }
    }

    private setupProfileUpdateListener(): void {
        // Listen for profile updates from other components
        EventBus.subscribe(Constants.EVENTS.PROFILE_UPDATE, (profile: any) => {
            console.log('Profile update received:', profile);
            const taskbarProfileImg = document.getElementById('taskbar-profile-img') as HTMLImageElement;
            if (taskbarProfileImg && profile.profileImage) {
                taskbarProfileImg.src = profile.profileImage;
            }
        });
    }
}

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        FriendsPage.init().catch(error => {
            console.error('Failed to initialize friends page:', error);
            window.location.href = '/dist/pages/login.html';
        });
    });
} else {
    FriendsPage.init().catch(error => {
        console.error('Failed to initialize friends page:', error);
        window.location.href = '/dist/pages/login.html';
    });
} 
import { FriendModule } from '../features/friend/index';
import { ErrorHandler } from '../core/errorHandler';
import { HttpService } from '../core/httpService';
import { API_CONFIG } from '../core/api.config';
import { StorageService } from '../core/storageService';

interface FriendRequestResponse {
    success: boolean;
    message?: string;
}

export class FriendsPage {
    private friendModule!: FriendModule;
    private searchForm!: HTMLFormElement | null;
    private searchInput!: HTMLInputElement | null;
    private resultsContainer!: HTMLElement | null;

    constructor() {
        this.initialize();
    }

    private initialize() {
        try {
            this.friendModule = new FriendModule();
            this.setupElements();
            this.setupEventListeners();
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private setupElements() {
        this.searchForm = document.getElementById('searchForm') as HTMLFormElement;
        this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
        this.resultsContainer = document.getElementById('resultsContainer');
    }

    private setupEventListeners() {
        this.searchForm?.addEventListener('submit', this.handleSearch.bind(this));
        this.setupNavigationListeners();
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
                throw new Error('No users found');
            }

            this.displaySearchResults(response.users, friends);
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private async fetchFriends() {
        const userId = StorageService.get('userId');
        if (!userId) {
            throw new Error('User ID not found');
        }

        try {
            const response = await HttpService.get(
                API_CONFIG.ENDPOINTS.FRIEND_REQUESTS.FRIENDS(userId)
            );
            return response.friends.map((friend: any) => friend._id);
        } catch (error) {
            ErrorHandler.handle(error);
            return [];
        }
    }

    private displaySearchResults(users: any[], friends: string[]) {
        if (!this.resultsContainer) return;

        // Sort users: friends first
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
        userImage.src = user.profileImage || '../assets/images/default-profile.png';
        userImage.alt = 'User profile';
        userImage.onerror = () => {
            userImage.src = '../assets/images/default-profile.png';
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
                    const response = await this.sendFriendRequest(user._id);
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

    private async sendFriendRequest(receiverId: string): Promise<FriendRequestResponse> {
        try {
            const response = await this.friendModule.sendFriendRequest(receiverId);
            return response as FriendRequestResponse;
        } catch (error) {
            ErrorHandler.handle(error);
            return { success: false, message: 'Failed to send friend request' };
        }
    }

    private setupNavigationListeners() {
        const navigationConfig = {
            'chat': '/pages/chat.html',
            'friends': '/pages/addFriend.html',
            'account': '/pages/account.html',
            'settings': '/pages/settings.html',
            'help': '/pages/help.html'
        };

        document.querySelectorAll('.taskbar-button').forEach(button => {
            const target = button.getAttribute('data-target');
            if (target && target in navigationConfig) {
                button.addEventListener('click', () => {
                    window.location.href = navigationConfig[target as keyof typeof navigationConfig];
                });
            }
        });
    }
} 
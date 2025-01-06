import { FriendModule } from '../features/friend/index';
import { ErrorHandler } from '../core/errorHandler';
import { HttpService } from '../core/httpService';
import { API_CONFIG } from '../core/api.config';
import { StorageService } from '../core/storageService';

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

        const userInfo = document.createElement('div');
        userInfo.innerText = user.username;

        userBox.appendChild(userImage);
        userBox.appendChild(userInfo);

        if (!isFriend) {
            const addButton = document.createElement('button');
            addButton.innerText = 'Add Friend';
            addButton.onclick = () => this.sendFriendRequest(user._id);
            userBox.appendChild(addButton);
        } else {
            const friendStatus = document.createElement('span');
            friendStatus.innerText = 'Friend';
            userBox.appendChild(friendStatus);
        }

        return userBox;
    }

    private async sendFriendRequest(receiverId: string) {
        try {
            const response = await this.friendModule.sendFriendRequest(receiverId);
            if (response?.success) {
                alert('Friend request sent successfully.');
            }
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private setupNavigationListeners() {
        document.querySelectorAll('.taskbar-button').forEach(button => {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-target');
                if (target) window.location.href = target;
            });
        });
    }
} 
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
    private requestsContainer!: HTMLElement | null;
    private readonly DEFAULT_PROFILE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIj48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=';

    constructor() {
        this.initialize();
    }

    private initialize() {
        try {
            // Check if user is authenticated
            const token = StorageService.get('token');
            const userId = StorageService.get('userId');

            if (!token || !userId) {
                window.location.href = '/dist/pages/login.html';
                return;
            }

            this.friendModule = new FriendModule();
            this.friendModule.initialize();
            this.setupElements();
            this.setupEventListeners();
            this.loadFriendRequests(); // Load initial friend requests
        } catch (error) {
            ErrorHandler.handle(error);
        }
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
        const userId = StorageService.get('userId');
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
        const profileImagePath = user.profileImage?.data ? `/api/users/${user._id}/profile-image` : this.DEFAULT_PROFILE;
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
}

document.addEventListener('DOMContentLoaded', () => {
    new FriendsPage();
}); 
import { ErrorHandler } from '../core/errorHandler';
import { StorageService } from '../core/storageService';
import { HttpService } from '../core/httpService';
import { API_CONFIG } from '../core/api.config';
import { AuthService } from '../features/auth/authService';
import { EventBus } from '../core/eventBus';
import { Constants } from '../core/constants';

export class AccountPage {
    private fileInput!: HTMLInputElement;
    private profileImg!: HTMLImageElement;
    private uploadForm!: HTMLFormElement;
    private usernameInput!: HTMLInputElement;
    private saveButton!: HTMLElement;
    private logoutButton!: HTMLElement;
    private backButton!: HTMLElement;
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
        this.initialize();
    }

    private initialize() {
        try {
            this.setupElements();
            this.loadSavedData();
            this.setupEventListeners();
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private setupElements() {
        this.fileInput = document.getElementById('upload-img') as HTMLInputElement;
        this.profileImg = document.getElementById('profile-img') as HTMLImageElement;
        this.uploadForm = document.getElementById('upload-form') as HTMLFormElement;
        this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.saveButton = document.getElementById('save-profile') as HTMLElement;
        this.logoutButton = document.getElementById('logout') as HTMLElement;
        this.backButton = document.querySelector('.back-to-home') as HTMLElement;

        if (!this.fileInput || !this.profileImg || !this.uploadForm || 
            !this.usernameInput || !this.saveButton || !this.logoutButton || !this.backButton) {
            throw new Error('Required elements not found');
        }
    }

    private loadSavedData() {
        // Load profile image
        const userId = StorageService.get('userId');
        if (userId && this.profileImg) {
            this.profileImg.src = `/api/users/${userId}/profile-image?${Date.now()}`; // Add timestamp to prevent caching
            this.profileImg.style.display = 'block';
            this.profileImg.onerror = () => {
                // Fallback to default avatar if image fails to load
                this.profileImg.src = '/assets/images/default-avatar.svg';
            };
        }

        // Load username
        const savedUsername = StorageService.get('username');
        if (savedUsername && this.usernameInput) {
            this.usernameInput.value = savedUsername;
        }
    }

    private setupEventListeners() {
        this.setupImagePreview();
        this.setupImageUpload();
        this.setupProfileSave();
        this.setupNavigation();
    }

    private setupNavigation() {
        // Setup logout
        this.logoutButton.addEventListener('click', async () => {
            try {
                this.authService.logout();
                window.location.href = '../pages/login.html';
            } catch (error) {
                ErrorHandler.handle(error);
            }
        });

        // Setup back button
        this.backButton.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    private setupImagePreview() {
        this.fileInput?.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file && this.profileImg) {
                // Create a blob URL for preview
                const objectUrl = URL.createObjectURL(file);
                this.profileImg.src = objectUrl;
                
                // Clean up the URL when the image loads
                this.profileImg.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                };
            }
        });
    }

    private setupImageUpload() {
        // Trigger upload when file is selected
        this.fileInput?.addEventListener('change', async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                alert("Please select a file first.");
                return;
            }

            try {
                const userId = StorageService.get('userId');
                const formData = new FormData();
                formData.append('profileImage', file);

                const response = await HttpService.upload(`/api/users/${userId}/profile-image`, formData);

                if (response.success) {
                    // Update profile page image
                    if (this.profileImg) {
                        this.profileImg.src = `${API_CONFIG.BASE_URL}/api/users/${userId}/profile-image?${Date.now()}`;
                    }

                    // Update taskbar profile image
                    const taskbarProfileImg = document.getElementById('taskbar-profile-img') as HTMLImageElement;
                    if (taskbarProfileImg) {
                        taskbarProfileImg.src = `${API_CONFIG.BASE_URL}/api/users/${userId}/profile-image?${Date.now()}`;
                    }

                    alert('Profile image uploaded successfully!');
                    
                    // Notify other components about the profile update
                    EventBus.publish(Constants.EVENTS.PROFILE_UPDATE, { 
                        ...JSON.parse(StorageService.get('userProfile') || '{}'),
                        profileImage: `${API_CONFIG.BASE_URL}/api/users/${userId}/profile-image`
                    });
                } else {
                    throw new Error(response.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                ErrorHandler.handle(error);
            }
        });
    }

    private setupProfileSave() {
        this.saveButton?.addEventListener('click', async () => {
            try {
                const userId = StorageService.get('userId');
                if (!userId || !this.usernameInput) {
                    throw new Error('Missing user data');
                }

                const username = this.usernameInput.value;
                
                // Only send username in the update request
                const response = await HttpService.put(
                    `/api/users/${userId}`,
                    { username }
                );

                if (response.success) {
                    StorageService.set('username', username);
                    alert('Profile saved successfully!');
                } else {
                    throw new Error(response.message || 'Failed to save profile');
                }
            } catch (error) {
                ErrorHandler.handle(error);
            }
        });
    }
}

// Initialize account page
new AccountPage(); 
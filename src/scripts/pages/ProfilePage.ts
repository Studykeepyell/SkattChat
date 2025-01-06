import { ErrorHandler } from '../core/errorHandler.js';
import { StorageService } from '../core/storageService.js';
import { HttpService } from '../core/httpService.js';
import { API_CONFIG } from '../core/api.config.js';

export class ProfilePage {
    private fileInput!: HTMLInputElement;
    private profileImg!: HTMLImageElement;
    private uploadForm!: HTMLFormElement;
    private usernameInput!: HTMLInputElement;
    private saveButton!: HTMLElement;

    constructor() {
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
    }

    private loadSavedData() {
        // Load profile image
        const savedImageURL = StorageService.get('profileImageURL');
        if (savedImageURL && this.profileImg) {
            this.profileImg.src = savedImageURL;
            this.profileImg.style.display = 'block';
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
    }

    private setupImagePreview() {
        this.fileInput?.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file && this.profileImg) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (this.profileImg) {
                        this.profileImg.src = e.target?.result as string;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    private setupImageUpload() {
        this.uploadForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const file = this.fileInput?.files?.[0];
            if (!file) {
                alert("Please select a file first.");
                return;
            }

            try {
                const userId = StorageService.get('userId');
                const formData = new FormData();
                formData.append('profileImage', file);

                const response = await HttpService.post(`/api/uploadProfileImage/${userId}`, formData);
                const result = await response.json();

                if (result.success) {
                    StorageService.set('profileImageURL', result.imageUrl);
                    alert('Profile image uploaded successfully!');
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } catch (error) {
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
                const profileImageURL = StorageService.get('profileImageURL');

                const response = await HttpService.put(
                    `/api/users/${userId}`,
                    { 
                        username, 
                        profileImage: profileImageURL 
                    }
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

// Initialize profile page
new ProfilePage(); 
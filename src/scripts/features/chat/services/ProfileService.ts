import { StorageService } from '../../../core/storageService';
import { Constants } from '../../../core/constants';
import { ErrorHandler } from '../../../core/errorHandler';
import { UserProfile } from './ChatAuthService';
import { API_CONFIG } from '../../../core/api.config';

export class ProfileService {
    private readonly DEFAULT_AVATAR = '/dist/assets/images/default-avatar.svg';

    constructor(private currentUser: UserProfile | null) {
        console.log('ProfileService initialized with user:', {
            hasUser: !!currentUser,
            userId: currentUser?.id,
            hasProfile: !!currentUser?.profile
        });
    }

    public async loadUserProfile(): Promise<void> {
        try {
            console.log('loadUserProfile called with currentUser:', {
                hasUser: !!this.currentUser,
                userId: this.currentUser?.id,
                hasProfile: !!this.currentUser?.profile
            });

            if (!this.currentUser?.id) {
                console.log('No user ID found');
                return;
            }

            await this.updateProfileImage();
            this.updateUsername();
        } catch (error) {
            console.error('Error loading user profile:', error);
            ErrorHandler.handle(error);
        }
    }

    private async updateProfileImage(): Promise<void> {
        const profileImg = document.getElementById("taskbar-profile-img") as HTMLImageElement;
        console.log('Updating profile image:', {
            hasImageElement: !!profileImg,
            userId: this.currentUser?.id
        });

        if (!profileImg || !this.currentUser?.id) return;

        try {
            const imageUrl = `${API_CONFIG.BASE_URL}/api/users/${this.currentUser.id}/profile-image?${Date.now()}`;
            console.log('Setting profile image URL:', imageUrl);

            // Set the profile image with API URL
            profileImg.src = imageUrl;
            
            // Handle image load error
            profileImg.onerror = () => {
                console.log('Profile image load failed, using default');
                profileImg.src = this.DEFAULT_AVATAR;
            };

            // Handle successful load
            profileImg.onload = () => {
                console.log('Profile image loaded successfully');
            };
        } catch (error) {
            console.error('Error updating profile image:', error);
            profileImg.src = this.DEFAULT_AVATAR;
        }
    }

    private updateUsername(): void {
        const usernameElement = document.getElementById("taskbar-username");
        if (usernameElement && this.currentUser?.profile?.username) {
            usernameElement.textContent = this.currentUser.profile.username;
        }
    }

    public handleProfileUpdate(profile: any): void {
        console.log('Profile update received:', profile);
        if (this.currentUser) {
            this.currentUser.profile = profile;
            StorageService.set(Constants.STORAGE_KEYS.USER_PROFILE, profile);
            this.loadUserProfile();
        }
    }
} 